import type { Photo, Place, Story, StorySource } from '$lib/types';

const TIMEOUT = 8000;
const cache = new Map<string, Promise<Story>>();

/** Story for a place: text, hero photo and old Finna photos. Cached per place, never throws. */
export function fetchStory(place: Place): Promise<Story> {
	let p = cache.get(place.id);
	if (!p) {
		p = build(place).catch(() => baseStory(place));
		cache.set(place.id, p);
	}
	return p;
}

async function getJson<T>(url: string): Promise<T | null> {
	try {
		const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
		if (!res.ok) return null;
		return (await res.json()) as T;
	} catch {
		return null;
	}
}

interface TextPart {
	extract?: string;
	hero?: Photo;
	readMoreUrl?: string;
	readMoreLabel?: string;
	source: StorySource;
}

async function build(place: Place): Promise<Story> {
	const [text, oldPhotos] = await Promise.all([textChain(place), finnaPhotos(place)]);
	const fallback = baseStory(place);
	const hero = text?.hero ?? (await heroChain(place));
	return {
		title: place.name,
		extract: text?.extract ?? fallback.extract,
		hero,
		oldPhotos,
		readMoreUrl: text?.readMoreUrl ?? fallback.readMoreUrl,
		readMoreLabel: text?.readMoreUrl ? text.readMoreLabel : fallback.readMoreLabel,
		source: text?.extract ? text.source : fallback.source
	};
}

// ---------- text: Wikipedia, Wikidata, geosearch ----------

async function textChain(place: Place): Promise<TextPart | null> {
	if (place.wikipedia) {
		const m = /^([a-z-]{2,12}):(.+)$/.exec(place.wikipedia);
		const hit = await wikiSummary(m ? m[1] : 'fi', m ? m[2] : place.wikipedia);
		if (hit) return hit;
	}
	if (place.wikidata) {
		const hit = await fromWikidata(place.wikidata);
		if (hit) return hit;
	}
	return geoWiki(place);
}

interface Summary {
	type?: string;
	extract?: string;
	thumbnail?: { source: string; width: number };
	originalimage?: { source: string; width: number };
	content_urls?: { desktop?: { page?: string } };
}

async function wikiSummary(lang: string, title: string): Promise<TextPart | null> {
	const s = await getJson<Summary>(
		`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.trim().replace(/ /g, '_'))}`
	);
	if (!s || s.type === 'disambiguation' || !s.extract) return null;
	return {
		extract: shorten(s.extract),
		hero: summaryImage(s),
		readMoreUrl: s.content_urls?.desktop?.page,
		readMoreLabel: 'Wikipedia',
		source: 'wikipedia'
	};
}

function summaryImage(s: Summary): Photo | undefined {
	const orig = s.originalimage?.source;
	const commons = orig && /\/wikipedia\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/?#]+)/.exec(orig);
	const url = commons ? filePath(decodeURIComponent(commons[1])) : (s.thumbnail?.source ?? orig);
	return url ? { url, credit: 'Kuva: Wikimedia Commons' } : undefined;
}

/** Up to about three sentences and 400 characters, cut at a sentence end. */
function shorten(text: string): string {
	const sentences = text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+(?=[A-ZÅÄÖ0-9"”])/);
	let out = '';
	for (const s of sentences.slice(0, 3)) {
		if (out && out.length + s.length + 1 > 400) break;
		out = out ? `${out} ${s}` : s;
	}
	if (out.length > 450) out = `${out.slice(0, 400).replace(/\s+\S*$/, '')}…`;
	return out;
}

interface WdEntity {
	sitelinks?: Record<string, { title: string }>;
	claims?: Record<string, { mainsnak?: { datavalue?: { value?: unknown } } }[]>;
	descriptions?: Record<string, { value: string }>;
}

async function fromWikidata(qid: string): Promise<TextPart | null> {
	const data = await getJson<{ entities?: Record<string, WdEntity> }>(
		`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(qid)}&props=sitelinks|claims|descriptions&languages=fi|sv|en&sitefilter=fiwiki|svwiki|enwiki&format=json&origin=*`
	);
	const e = data?.entities?.[qid];
	if (!e) return null;
	const p18 = e.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
	const file = typeof p18 === 'string' ? p18 : undefined;
	const lang = ['fi', 'sv', 'en'].find((l) => e.sitelinks?.[`${l}wiki`]);
	const [summary, hero] = await Promise.all([
		lang ? wikiSummary(lang, e.sitelinks![`${lang}wiki`].title) : Promise.resolve(null),
		file ? commonsPhoto(file) : Promise.resolve(undefined)
	]);
	if (summary) return { ...summary, hero: hero ?? summary.hero };
	const desc = e.descriptions?.fi?.value;
	if (!desc && !hero) return null;
	return { extract: desc ? capitalise(desc) + '.' : undefined, hero, source: 'wikidata' };
}

async function geoWiki(place: Place): Promise<TextPart | null> {
	const words = nameWords(place.name);
	if (words.size === 0) return null;
	const data = await getJson<{ query?: { geosearch?: { title: string }[] } }>(
		`https://fi.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${place.lat}|${place.lon}&gsradius=300&gslimit=5&format=json&origin=*`
	);
	const hit = data?.query?.geosearch?.find((g) => [...nameWords(g.title)].some((w) => words.has(w)));
	return hit ? wikiSummary('fi', hit.title) : null;
}

const STOP = new Set([
	'vanha', 'vanhan', 'uusi', 'uuden', 'suuri', 'pieni', 'iso', 'pikku', 'kirkko', 'puisto', 'talo',
	'muistomerkki', 'kartano', 'majakka', 'linna', 'mylly', 'saari', 'kivi', 'lähde', 'huippu', 'torni'
]);

function nameWords(s: string): Set<string> {
	return new Set(
		s
			.toLowerCase()
			.split(/[^\p{L}]+/u)
			.filter((w) => w.length >= 4 && !STOP.has(w))
	);
}

// ---------- hero image ----------

async function heroChain(place: Place): Promise<Photo | undefined> {
	if (place.image) {
		const commons = /Special:FilePath\/([^?]+)/.exec(place.image);
		if (commons) return (await commonsPhoto(decodeURIComponent(commons[1]))) ?? { url: place.image, credit: 'Kuva: Wikimedia Commons' };
		return { url: place.image, credit: 'Kuva: OpenStreetMap-yhteisö' };
	}
	return commonsNearby(place);
}

interface ImageInfo {
	url?: string;
	thumburl?: string;
	extmetadata?: Record<string, { value?: string }>;
}

function filePath(name: string): string {
	return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name.replace(/ /g, '_'))}?width=640`;
}

function commonsCredit(info?: ImageInfo): string {
	const artist = stripHtml(info?.extmetadata?.Artist?.value ?? '');
	const licence = stripHtml(info?.extmetadata?.LicenseShortName?.value ?? '');
	return ['Kuva: ' + (artist || 'Wikimedia Commons'), artist ? 'Wikimedia Commons' : '', licence]
		.filter(Boolean)
		.join(', ');
}

async function commonsPhoto(file: string): Promise<Photo | undefined> {
	const name = file.replace(/^File:/, '');
	const data = await getJson<{ query?: { pages?: Record<string, { imageinfo?: ImageInfo[] }> } }>(
		`https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent('File:' + name)}&prop=imageinfo&iiprop=extmetadata&format=json&origin=*`
	);
	const info = Object.values(data?.query?.pages ?? {})[0]?.imageinfo?.[0];
	return { url: filePath(name), credit: commonsCredit(info), linkUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(name.replace(/ /g, '_'))}` };
}

async function commonsNearby(place: Place): Promise<Photo | undefined> {
	const words = nameWords(place.name);
	if (words.size === 0) return undefined;
	const data = await getJson<{
		query?: { pages?: Record<string, { index?: number; title: string; imageinfo?: ImageInfo[] }> };
	}>(
		`https://commons.wikimedia.org/w/api.php?action=query&generator=geosearch&ggscoord=${place.lat}|${place.lon}&ggsradius=100&ggsnamespace=6&ggslimit=10&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=640&format=json&origin=*`
	);
	const pages = Object.values(data?.query?.pages ?? {})
		.filter((p) => /\.(jpe?g|png|webp)$/i.test(p.title) && p.imageinfo?.[0]?.thumburl)
		.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
	// Only a photo whose title, description, object name or categories mention the place by name.
	const score = (p: (typeof pages)[number]) => {
		const m = p.imageinfo?.[0]?.extmetadata ?? {};
		const text = [p.title, m.ImageDescription?.value, m.ObjectName?.value, m.Categories?.value]
			.map((v) => stripHtml(v ?? ''))
			.join(' ');
		return [...nameWords(text)].filter((w) => words.has(w)).length;
	};
	const best = pages.map((p) => ({ p, n: score(p) })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n)[0]?.p;
	if (!best) return undefined;
	const info = best.imageinfo![0];
	return {
		url: info.thumburl!,
		credit: commonsCredit(info),
		linkUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(best.title.replace(/ /g, '_'))}`
	};
}

function stripHtml(s: string): string {
	return s
		.replace(/<[^>]*>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&#0?39;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/\s+/g, ' ')
		.trim();
}

// ---------- Finna old photos ----------

interface FinnaRecord {
	title?: string;
	images?: string[];
	imageRights?: { copyright?: string };
	buildings?: { translated?: string }[];
	year?: string;
	recordPage?: string;
	geoLocations?: string[];
}

/** True when the record's own geometry is a point or a small area within about 3 km of the place. */
function finnaNear(r: FinnaRecord, place: Place): boolean {
	const wkt = r.geoLocations?.[0];
	if (!wkt) return false;
	const nums = wkt.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
	if (nums.length < 2) return false;
	let lons: number[], lats: number[];
	if (/^ENVELOPE/i.test(wkt)) {
		lons = [nums[0], nums[1]];
		lats = [nums[2], nums[3]];
	} else {
		lons = nums.filter((_, i) => i % 2 === 0);
		lats = nums.filter((_, i) => i % 2 === 1);
	}
	const minLon = Math.min(...lons), maxLon = Math.max(...lons);
	const minLat = Math.min(...lats), maxLat = Math.max(...lats);
	const small = maxLon - minLon < 0.08 && maxLat - minLat < 0.04;
	const pad = 0.03;
	const inside = place.lon > minLon - pad && place.lon < maxLon + pad && place.lat > minLat - pad && place.lat < maxLat + pad;
	return small && inside;
}

function finnaUrl(lookfor: string, lat: number, lon: number, d: number): string {
	const params: [string, string][] = [
		['lookfor', lookfor],
		['filter[]', 'format:0/Image/'],
		['filter[]', '~usage_rights_str_mv:usage_A'],
		['filter[]', '~usage_rights_str_mv:usage_B'],
		['filter[]', `{!geofilt sfield=location_geo pt=${lat},${lon} d=${d}}`],
		...['id', 'title', 'images', 'imageRights', 'buildings', 'year', 'recordPage', 'geoLocations'].map(
			(f): [string, string] => ['field[]', f]
		),
		['limit', '6'],
		['sort', 'year asc']
	];
	return `https://api.finna.fi/v1/search?${params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')}`;
}

async function finnaSearch(url: string, place: Place): Promise<Photo[]> {
	const data = await getJson<{ records?: FinnaRecord[] }>(url);
	const photos: Photo[] = [];
	for (const r of data?.records ?? []) {
		const img = r.images?.[0];
		if (!img || !finnaNear(r, place)) continue;
		const sized = /[?&]size=/.test(img) ? img.replace(/([?&]size=)[a-z]+/, '$1medium') : `${img}&size=medium`;
		const by = [r.buildings?.[0]?.translated, r.imageRights?.copyright].filter(Boolean).join(', ');
		photos.push({
			url: `https://api.finna.fi${sized}`,
			credit: by ? `Kuva: ${by}` : 'Kuva: Finna',
			linkUrl: r.recordPage ? `https://finna.fi${r.recordPage}` : undefined,
			year: r.year,
			title: r.title
		});
	}
	const yearNum = (p: Photo) => {
		const y = Number.parseInt(p.year ?? '', 10);
		return y >= 1800 && y <= 2100 ? y : 9999;
	};
	return photos.sort((a, b) => yearNum(a) - yearNum(b));
}

async function finnaPhotos(place: Place): Promise<Photo[]> {
	const near = await finnaSearch(finnaUrl('*', place.lat, place.lon, 0.5), place);
	if (near.length > 0) return near;
	if ((place.name.match(/\p{L}/gu) ?? []).length < 4) return [];
	return finnaSearch(finnaUrl(`"${place.name.replace(/"/g, '')}"`, place.lat, place.lon, 3), place);
}

// ---------- tag-based fallback ----------

function baseStory(place: Place): Story {
	const t = place.tags;
	const mv = place.source === 'museovirasto';
	return {
		title: place.name,
		extract: t.kuvaus ?? t['description:fi'] ?? t.description ?? t.inscription ?? (mv ? mvSentence(t) : undefined),
		hero: place.image
			? { url: place.image, credit: place.image.includes('wikimedia.org') ? 'Kuva: Wikimedia Commons' : 'Kuva: OpenStreetMap-yhteisö' }
			: undefined,
		oldPhotos: [],
		readMoreUrl: mv ? place.externalUrl : undefined,
		readMoreLabel: mv && place.externalUrl ? 'Museovirasto' : undefined,
		source: mv ? 'museovirasto' : 'osm'
	};
}

const SINGULAR: Record<string, string> = {
	kuppikivet: 'kuppikivi',
	kuppikalliot: 'kuppikallio',
	uhrikivet: 'uhrikivi',
	uhrilähteet: 'uhrilähde',
	hautaröykkiöt: 'hautaröykkiö',
	röykkiöt: 'röykkiö',
	viljelyröykkiöt: 'viljelyröykkiö',
	kaskiröykkiöt: 'kaskiröykkiö',
	linnavuoret: 'linnavuori',
	jatulintarhat: 'jatulintarha',
	seidat: 'seita',
	hiidenkiukaat: 'hiidenkiuas',
	tarinapaikat: 'tarinapaikka',
	polttokenttäkalmistot: 'polttokenttäkalmisto',
	ruumiskalmistot: 'ruumiskalmisto',
	ortodoksikalmistot: 'ortodoksinen kalmisto',
	tarhakalmistot: 'tarhakalmisto',
	kalmistot: 'kalmisto',
	lähteet: 'lähde',
	karsikkopaikat: 'karsikkopaikka',
	käräjäpaikat: 'käräjäpaikka',
	ristikivet: 'ristikivi',
	miekanhiontakivet: 'miekanhiontakivi',
	asuinpaikat: 'asuinpaikka',
	hautapaikat: 'hautapaikka',
	'kultti- ja tarinapaikat': 'kultti- tai tarinapaikka',
	kivirakenteet: 'kivirakenne',
	puolustusvarustukset: 'puolustusvarustus',
	jätinkirkot: 'jätinkirkko',
	asumuspainanteet: 'asumuspainanne',
	talonpohjat: 'talonpohja'
};
const SKIP = new Set(['ei määritelty', 'ajoittamaton', '']);

function joinFi(items: string[]): string {
	return items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} ja ${items.at(-1)}`;
}
function capitalise(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}
function list(s?: string): string[] {
	return [...new Set((s ?? '').split(',').map((x) => x.trim().toLowerCase()))].filter((x) => !SKIP.has(x));
}

/** "Paikalla on rautakautinen kuppikivi. Se on muinaismuistolailla suojeltu." from Museovirasto fields. */
function mvSentence(t: Record<string, string>): string | undefined {
	if (/hyly/i.test(t.tyyppi ?? '')) return wreckSentence(t);
	let kinds = list(t.alatyyppi)
		.map((x) => SINGULAR[x])
		.filter(Boolean);
	if (kinds.length === 0) kinds = list(t.tyyppi).map((x) => SINGULAR[x]).filter(Boolean);
	const dates = list(t.ajoitus).filter((x) => x.endsWith('nen'));
	const parts: string[] = [];
	if (kinds.length > 0) {
		const adj = dates.length === 1 ? `${dates[0]} ` : '';
		parts.push(`Paikalla on ${adj}${joinFi(kinds.slice(0, 3))}.`);
		if (dates.length > 1) parts.push(`Kohde on ajoitettu ${joinFi(dates.map(translative))}.`);
	} else if (dates.length > 0) {
		parts.push(`Kohde on ajoitettu ${joinFi(dates.map(translative))}.`);
	}
	parts.push('Se on kiinteä muinaisjäännös, jonka muinaismuistolaki suojelee.');
	return parts.join(' ');
}

/** "Vedenalainen puuhylky, historiallinen aika." or "Metallihylky, ajoitus keskiaikainen." */
function wreckSentence(t: Record<string, string>): string {
	const sub = t.alatyyppi ?? '';
	const kind = /metalli/i.test(sub) ? 'metallihylky' : /puu/i.test(sub) ? 'puuhylky' : 'hylky';
	const head = t.vedenalainen === 'k' ? `Vedenalainen ${kind}` : capitalise(kind);
	const dates = list(t.ajoitus).filter((x) => x.endsWith('nen'));
	const when =
		dates.length === 0
			? ''
			: dates.length === 1 && dates[0] === 'historiallinen'
				? ', historiallinen aika'
				: `, ajoitus ${joinFi(dates)}`;
	return `${head}${when}. Se on kiinteä muinaisjäännös, jonka muinaismuistolaki suojelee.`;
}

function translative(adj: string): string {
	return adj.replace(/nen$/, 'seksi');
}
