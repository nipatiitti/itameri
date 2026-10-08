// One-off extract: Overpass (OSM) and Museovirasto WFS → static/data/<category>.geojson.
// Run: node scripts/fetch-places.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'static', 'data');
const UA = 'arjen-aarteet/0.1 (softamestari)';
const BBOX = '59.5,19,66,31';
const MAX_BYTES = 6 * 1024 * 1024;
const MIRRORS = [
	'https://overpass-api.de/api/interpreter',
	'https://overpass.private.coffee/api/interpreter',
	'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
	'https://overpass.kumi.systems/api/interpreter'
];
const mirrorOrder = [...MIRRORS];
const mirrorWins = new Map();

const TAG_WHITELIST = [
	'description', 'description:fi', 'inscription', 'start_date', 'species', 'species:fi', 'genus',
	'height', 'architect', 'artist_name', 'material', 'denomination', 'website', 'ele', 'tower:type',
	'historic', 'natural', 'tourism', 'man_made', 'leisure', 'landuse', 'amenity', 'heritage'
];
const MV_TAGS = ['kohdenimi', 'kunta', 'tyyppi', 'alatyyppi', 'ajoitus'];

// Each rule: defining tag, optional sub-type key for rarity, Finnish generic name, optional keep test.
const named = (t) => !!t.name;
const RULES = {
	park: {
		query: [
			`nwr["leisure"~"^(park|garden)$"]["name"]`,
			`nwr["landuse"~"^(cemetery|allotments)$"]["name"]`
		],
		rules: [
			{ k: 'leisure', v: 'park', name: 'Puisto', keep: named },
			{ k: 'leisure', v: 'garden', name: 'Puutarha', keep: named },
			{ k: 'landuse', v: 'cemetery', name: 'Hautausmaa', keep: named },
			{ k: 'landuse', v: 'allotments', name: 'Siirtolapuutarha', keep: named }
		]
	},
	memorial: {
		query: [`nwr["historic"~"^(memorial|monument)$"]`, `nwr["tourism"="artwork"]`],
		rules: [
			{ k: 'historic', v: 'memorial', sub: 'memorial', name: memorialName },
			{ k: 'historic', v: 'monument', name: 'Monumentti' },
			{ k: 'tourism', v: 'artwork', sub: 'artwork_type', name: artworkName }
		],
		keep: (t) => !!(t.name || t.inscription || t.artist_name)
	},
	building: {
		query: [
			`nwr["historic"~"^(building|manor|church|chapel|tower|castle|fort|farm|mill|windmill|watermill)$"]["name"]`,
			`nwr["heritage"]["name"]`
		],
		rules: [
			{ k: 'historic', v: 'building', name: 'Historiallinen rakennus' },
			{ k: 'historic', v: 'manor', name: 'Kartano' },
			{ k: 'historic', v: 'church', name: 'Kirkko' },
			{ k: 'historic', v: 'chapel', name: 'Kappeli' },
			{ k: 'historic', v: 'tower', name: 'Torni' },
			{ k: 'historic', v: 'castle', name: 'Linna' },
			{ k: 'historic', v: 'fort', name: 'Linnoitus' },
			{ k: 'historic', v: 'farm', name: 'Talo' },
			{ k: 'historic', v: 'mill', name: 'Mylly' },
			{ k: 'historic', v: 'windmill', name: 'Tuulimylly' },
			{ k: 'historic', v: 'watermill', name: 'Vesimylly' },
			{ k: 'heritage', v: '*', name: 'Suojeltu kohde' }
		],
		keep: named
	},
	ancient: {
		query: [`nwr["historic"~"^(archaeological_site|ruins|tomb)$"]`],
		rules: [
			{ k: 'historic', v: 'archaeological_site', sub: 'site_type', name: 'Muinaisjäännös' },
			{ k: 'historic', v: 'ruins', name: 'Rauniot' },
			{ k: 'historic', v: 'tomb', name: 'Hauta' }
		]
	},
	tree: {
		query: [
			`nwr["natural"="tree"]["name"]`,
			`nwr["natural"="spring"]["name"]`,
			`nwr["natural"="stone"]["name"]`,
			`nwr["natural"="stone"]["description"]`,
			`nwr["geological"="glacial_erratic"]`,
			`nwr["natural"="cave_entrance"]`
		],
		rules: [
			{ k: 'natural', v: 'tree', name: 'Puu', keep: named },
			{ k: 'natural', v: 'spring', name: 'Lähde', keep: named },
			{ k: 'natural', v: 'stone', name: 'Siirtolohkare', keep: (t) => !!(t.name || t.description) },
			{ k: 'geological', v: 'glacial_erratic', name: 'Siirtolohkare', keep: (t) => !!(t.name || t.description) },
			{ k: 'natural', v: 'cave_entrance', name: 'Luola' }
		]
	},
	maritime: {
		query: [
			`nwr["man_made"="lighthouse"]`,
			`nwr["man_made"="beacon"]["name"]`,
			`nwr["historic"~"^(ship|wreck)$"]`,
			`nwr["seamark:type"="light_major"]`
		],
		rules: [
			{ k: 'man_made', v: 'lighthouse', name: 'Majakka' },
			{ k: 'historic', v: 'ship', name: 'Museolaiva' },
			{ k: 'historic', v: 'wreck', name: 'Hylky' },
			{ k: 'man_made', v: 'beacon', name: 'Merimerkki', keep: named },
			{ k: 'seamark:type', v: 'light_major', name: 'Majakka' }
		]
	},
	viewpoint: {
		query: [
			`nwr["tourism"="viewpoint"]`,
			`nwr["man_made"="tower"]["tower:type"="observation"]`,
			`nwr["natural"="peak"]["name"]`
		],
		rules: [
			{ k: 'man_made', v: 'tower', name: 'Näkötorni', keep: (t) => t['tower:type'] === 'observation' },
			{ k: 'tourism', v: 'viewpoint', name: 'Näköalapaikka' },
			{ k: 'natural', v: 'peak', name: 'Huippu', keep: named }
		]
	},
	oddity: {
		query: [
			`nwr["historic"~"^(boundary_stone|milestone|wayside_shrine|wayside_cross|inscription|stone|aircraft|tank|locomotive|cannon)$"]`,
			`nwr["man_made"="flagpole"]["name"]`,
			`nwr["amenity"="fountain"]["name"]`
		],
		rules: [
			{ k: 'historic', v: 'boundary_stone', name: 'Rajakivi' },
			{ k: 'historic', v: 'milestone', name: 'Virstanpylväs' },
			{ k: 'historic', v: 'wayside_shrine', name: 'Tienvarsipyhäkkö' },
			{ k: 'historic', v: 'wayside_cross', name: 'Tienvarsiristi' },
			{ k: 'historic', v: 'inscription', name: 'Kaiverrus' },
			{ k: 'historic', v: 'stone', name: 'Historiallinen kivi' },
			{ k: 'historic', v: 'aircraft', name: 'Lentokone' },
			{ k: 'historic', v: 'tank', name: 'Panssarivaunu' },
			{ k: 'historic', v: 'locomotive', name: 'Veturi' },
			{ k: 'historic', v: 'cannon', name: 'Tykki' },
			{ k: 'man_made', v: 'flagpole', name: 'Lipputanko', keep: named },
			{ k: 'amenity', v: 'fountain', name: 'Suihkulähde', keep: named }
		]
	}
};

const ORDER = ['maritime', 'ancient', 'viewpoint', 'oddity', 'memorial', 'tree', 'building', 'park'];

function memorialName(t) {
	const m = {
		plaque: 'Muistolaatta',
		statue: 'Patsas',
		stone: 'Muistokivi',
		war_memorial: 'Sotamuistomerkki',
		bust: 'Rintakuva',
		cross: 'Muistoristi',
		obelisk: 'Obeliski',
		stolperstein: 'Muistokivi'
	};
	return m[t.memorial] ?? 'Muistomerkki';
}
function artworkName(t) {
	const m = {
		statue: 'Patsas',
		sculpture: 'Veistos',
		mural: 'Seinämaalaus',
		installation: 'Taideinstallaatio',
		relief: 'Reliefi',
		bust: 'Rintakuva',
		graffiti: 'Graffiti',
		mosaic: 'Mosaiikki',
		stone: 'Taidekivi',
		fountain: 'Suihkulähde'
	};
	return m[t.artwork_type] ?? 'Taideteos';
}

const ancientPattern = /kuppikiv|uhrikiv|uhri|röykki|linnavuor|seita|seid|tarinapaik|kalmist|jatulintarha|hiidenkiuas/i;
const MV_GENERIC = [
	[/kuppikiv|kuppikallio/, 'Kuppikivi'],
	[/uhrikiv/, 'Uhrikivi'],
	[/uhri/, 'Uhripaikka'],
	[/jatulintarha/, 'Jatulintarha'],
	[/linnavuor/, 'Linnavuori'],
	[/seita|seid/, 'Seita'],
	[/hiidenkiuas/, 'Hiidenkiuas'],
	[/hautaröykki/, 'Hautaröykkiö'],
	[/röykki/, 'Röykkiö'],
	[/kalmist/, 'Kalmisto'],
	[/tarinapaik/, 'Tarinapaikka'],
	[/asuinpaik/, 'Kivikautinen asuinpaikka']
];

// Rough Finland outline (land border and maritime midlines, lon/lat) so the bbox does not pull in
// Sweden, Estonia or Russia.
const FINLAND = [
	[19.13, 60.3], [19.8, 59.8], [20.5, 59.6], [21.3, 59.62], [22.5, 59.65], [23.5, 59.75],
	[24.5, 59.85], [25.5, 59.9], [26.3, 60.0], [27.2, 60.25], [27.8, 60.42], [27.75, 60.52],
	[28.55, 60.97], [28.82, 61.15], [29.25, 61.33], [29.7, 61.6], [30.15, 61.85], [30.6, 62.1],
	[31, 62.4], [31, 63.2], [30.9, 63.5], [30.5, 64.1], [30.1, 64.5], [29.8, 65.0], [30.0, 65.5],
	[29.6, 66.0], [24.0, 66.0], [24.14, 65.86], [24.1, 65.7], [23.8, 65.45], [23.2, 65.1],
	[22.6, 64.75], [21.8, 64.25], [21.1, 63.8], [20.95, 63.55], [20.0, 63.0], [19.6, 62.5],
	[19.4, 61.5], [19.3, 60.6]
];
export function inFinland([x, y]) {
	let inside = false;
	for (let i = 0, j = FINLAND.length - 1; i < FINLAND.length; j = i++) {
		const [xi, yi] = FINLAND[i];
		const [xj, yj] = FINLAND[j];
		if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
	}
	return inside;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const round = (n) => Math.round(n * 1e6) / 1e6;

async function overpassOnce(mirror, body) {
	const res = await fetch(mirror, {
		method: 'POST',
		headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
		body: 'data=' + encodeURIComponent(body),
		signal: AbortSignal.timeout(200_000)
	});
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	const text = await res.text();
	if (!text.trimStart().startsWith('{')) throw new Error('not JSON');
	const json = JSON.parse(text);
	if (json.remark && /error|timed out|out of memory/i.test(json.remark)) throw new Error(json.remark.slice(0, 120));
	return json.elements ?? [];
}

async function overpass(statements) {
	const body = `[out:json][timeout:180];(${statements.map((s) => `${s}(${BBOX});`).join('')});out center tags;`;
	for (let round = 0; round < 3; round++) {
		if (round > 0) await sleep(20_000);
		for (const mirror of [...mirrorOrder]) {
			for (let attempt = 0; attempt < 3; attempt++) {
				try {
					const els = await overpassOnce(mirror, body);
					mirrorWins.set(mirror, (mirrorWins.get(mirror) ?? 0) + 1);
					return els;
				} catch (e) {
					process.stdout.write(`  ${new URL(mirror).host} try ${attempt + 1}: ${e.message}\n`);
					if (e.name === 'TimeoutError') break;
					if (attempt < 2) await sleep(5000 * (attempt + 1));
				}
			}
			mirrorOrder.splice(mirrorOrder.indexOf(mirror), 1);
			mirrorOrder.push(mirror);
		}
	}
	throw new Error('all mirrors failed');
}

async function overpassSplit(statements) {
	try {
		return await overpass(statements);
	} catch (e) {
		if (statements.length === 1) throw e;
		const out = [];
		for (const s of statements) {
			try {
				out.push(...(await overpass([s])));
			} catch {
				process.stdout.write(`  part failed: ${s}\n`);
			}
		}
		return out;
	}
}

function resolveImage(t) {
	const img = t.image;
	if (img && /^https?:\/\//i.test(img)) {
		if (/\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(img) || /upload\.wikimedia\.org|Special:FilePath/i.test(img)) return img;
	}
	const file = (t.wikimedia_commons?.startsWith('File:') && t.wikimedia_commons) || (img?.startsWith('File:') && img);
	if (file) {
		const name = file.slice(5).trim().replace(/ /g, '_');
		return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=640`;
	}
	return undefined;
}

function osmFeature(el, cat) {
	const t = el.tags ?? {};
	const def = RULES[cat];
	const rule = def.rules.find((r) => (r.v === '*' ? t[r.k] !== undefined : t[r.k] === r.v) && (!r.keep || r.keep(t)));
	if (!rule || (def.keep && !def.keep(t))) return null;
	const lat = el.lat ?? el.center?.lat;
	const lon = el.lon ?? el.center?.lon;
	if (lat === undefined || lon === undefined || !inFinland([lon, lat])) return null;
	if (/[\u0400-\u04FF]/.test(t.name ?? '') && !t['name:fi']) return null;
	const id = `${el.type}/${el.id}`;
	const generic = typeof rule.name === 'function' ? rule.name(t) : rule.name;
	const props = {
		id,
		name: (t['name:fi'] || t.name || generic).trim() || generic,
		cat,
		src: 'osm'
	};
	if (t.wikipedia) props.wikipedia = t.wikipedia;
	if (/^Q\d+$/.test(t.wikidata ?? '')) props.wikidata = t.wikidata;
	const image = resolveImage(t);
	if (image) props.image = image;
	props.url = `https://www.openstreetmap.org/${id}`;
	for (const k of TAG_WHITELIST) if (typeof t[k] === 'string' && t[k].trim()) props[k] = t[k].trim();
	const key = `${rule.k}=${rule.v === '*' ? 'any' : rule.v}${rule.sub && t[rule.sub] ? `:${t[rule.sub]}` : ''}`;
	return {
		f: { type: 'Feature', geometry: { type: 'Point', coordinates: [round(lon), round(lat)] }, properties: props },
		key,
		named: !!t.name,
		wiki: !!(t.wikipedia || t.wikidata),
		ele: Number.parseFloat(t.ele) || 0
	};
}

async function museovirasto() {
	const base = 'https://geoserver.museovirasto.fi/geoserver/rajapinta_suojellut/ows';
	const likes = ['kuppikiv', 'uhrikiv', 'uhri', 'röykki', 'linnavuor', 'seita', 'seid', 'tarinapaik', 'kalmist', 'jatulintarha', 'hiidenkiuas'];
	const typeFilter =
		'(' +
		likes.map((l) => `alatyyppi ILIKE '%${l}%' OR tyyppi ILIKE '%${l}%'`).join(' OR ') +
		` OR (tyyppi ILIKE '%asuinpaik%' AND ajoitus ILIKE '%kivikau%'))`;
	const fetchAll = async (bbox) => {
		const all = [];
		for (let start = 0; ; start += 10000) {
			const params = new URLSearchParams({
				service: 'WFS',
				version: '2.0.0',
				request: 'GetFeature',
				typeName: 'rajapinta_suojellut:muinaisjaannos_piste',
				outputFormat: 'application/json',
				srsName: 'EPSG:4326',
				propertyName: 'Shape,mjtunnus,kohdenimi,kunta,tyyppi,alatyyppi,ajoitus',
				sortBy: 'OBJECTID',
				count: '10000',
				startIndex: String(start),
				CQL_FILTER: `${typeFilter} AND BBOX(Shape,${bbox},'EPSG:4326')`
			});
			const res = await fetch(`${base}?${params}`, {
				headers: { 'User-Agent': UA },
				signal: AbortSignal.timeout(200_000)
			});
			if (!res.ok) throw new Error(`WFS HTTP ${res.status}`);
			const fc = await res.json();
			all.push(...fc.features);
			if (fc.features.length < 10000) break;
		}
		return all;
	};
	let feats = await fetchAll('19,59.5,31,66');
	if (feats.length === 0) feats = await fetchAll('59.5,19,66,31');
	const inArea = (c) => c && c[0] >= 19 && c[0] <= 31 && c[1] >= 59.5 && c[1] <= 66;
	const kivikautinen = (p) => /asuinpaik/i.test(p.tyyppi ?? '') && /kivikau/i.test(p.ajoitus ?? '');
	const seen = new Set();
	const out = [];
	for (const f of feats) {
		const p = f.properties;
		const c = f.geometry?.coordinates;
		if (!inArea(c) || !inFinland(c) || seen.has(p.mjtunnus)) continue;
		const types = `${p.tyyppi ?? ''} ${p.alatyyppi ?? ''}`.toLowerCase();
		if (!ancientPattern.test(types) && !kivikautinen(p)) continue;
		seen.add(p.mjtunnus);
		const generic = MV_GENERIC.find(([re]) => re.test(types))?.[1] ?? 'Muinaisjäännös';
		const props = {
			id: `mv/${p.mjtunnus}`,
			name: (p.kohdenimi ?? '').trim() || generic,
			cat: 'ancient',
			src: 'museovirasto',
			url: `https://www.kyppi.fi/to.aspx?id=112.${p.mjtunnus}`
		};
		for (const k of MV_TAGS) if (typeof p[k] === 'string' && p[k].trim()) props[k] = p[k].trim();
		out.push({
			f: { type: 'Feature', geometry: { type: 'Point', coordinates: [round(c[0]), round(c[1])] }, properties: props },
			key: `mv:${(p.tyyppi ?? '').trim()}|${(p.alatyyppi ?? '').trim()}`,
			sub: (p.alatyyppi ?? '').trim(),
			named: !!p.kohdenimi
		});
	}
	const subCount = countBy(out, (x) => x.sub);
	out.sort((a, b) => subCount.get(a.sub) - subCount.get(b.sub));
	return out.slice(0, 8000);
}

function countBy(items, fn) {
	const m = new Map();
	for (const it of items) m.set(fn(it), (m.get(fn(it)) ?? 0) + 1);
	return m;
}

// Mark rare: key occurs < ~40 times; threshold adapted so roughly 5 to 10 % of the pool is rare.
function markRare(pool) {
	if (pool.length === 0) return;
	const counts = countBy(pool, (x) => x.key);
	const frac = (t) => pool.filter((x) => counts.get(x.key) < t).length / pool.length;
	let t = 40;
	while (t > 1 && frac(t) > 0.1) t--;
	while (t < 400 && frac(t) < 0.05 && frac(t + 1) <= 0.1) t++;
	for (const x of pool) {
		if (counts.get(x.key) < t) x.f.properties.rare = true;
		else delete x.f.properties.rare;
	}
}

const results = new Map();
const assigned = new Set();

async function writeCat(cat) {
	let items = results.get(cat) ?? [];
	const fcOf = (arr) => JSON.stringify({ type: 'FeatureCollection', features: arr.map((x) => x.f) });
	let json = fcOf(items);
	if (json.length > MAX_BYTES) {
		items = items.filter((x) => x.named);
		json = fcOf(items);
	}
	if (json.length > MAX_BYTES) {
		const counts = countBy(items, (x) => x.key);
		items = [...items].sort((a, b) => counts.get(a.key) - counts.get(b.key));
		const per = json.length / items.length;
		items = items.slice(0, Math.floor((MAX_BYTES * 0.95) / per));
		json = fcOf(items);
	}
	results.set(cat, items);
	await writeFile(path.join(OUT, `${cat}.geojson`), json);
	return json.length;
}

function capBy(items, n, score) {
	if (items.length <= n) return items;
	return [...items].sort((a, b) => score(b) - score(a)).slice(0, n);
}

async function runCategory(cat) {
	const t0 = Date.now();
	let items = [];
	try {
		if (cat === 'ancient') {
			let mv = [];
			try {
				mv = await museovirasto();
			} catch (e) {
				process.stdout.write(`  museovirasto failed: ${e.message}\n`);
			}
			const grid = new Set(mv.map((x) => cell(x.f.geometry.coordinates)));
			let osm = [];
			try {
				osm = (await overpassSplit(RULES.ancient.query))
					.map((el) => osmFeature(el, cat))
					.filter((x) => x && !nearGrid(grid, x.f.geometry.coordinates));
			} catch (e) {
				process.stdout.write(`  osm ancient failed: ${e.message}\n`);
			}
			items = [...mv, ...osm];
		} else {
			const els = await overpassSplit(RULES[cat].query);
			items = els.map((el) => osmFeature(el, cat)).filter(Boolean);
		}
	} catch (e) {
		process.stdout.write(`  ${cat} FAILED: ${e.message}, writing empty collection\n`);
	}
	const seen = new Set();
	items = items.filter((x) => {
		const id = x.f.properties.id;
		if (seen.has(id) || assigned.has(id)) return false;
		seen.add(id);
		return true;
	});
	if (cat === 'park') items = capBy(items, 6000, (x) => (x.wiki ? 2 : 0) + (x.f.properties.image ? 1 : 0));
	if (cat === 'viewpoint') {
		const peaks = items.filter((x) => x.f.properties.natural === 'peak' && x.key === 'natural=peak');
		const keepPeaks = new Set(capBy(peaks, 1500, (x) => (x.named ? 1e5 : 0) + x.ele));
		items = items.filter((x) => x.key !== 'natural=peak' || keepPeaks.has(x));
	}
	for (const x of items) assigned.add(x.f.properties.id);
	results.set(cat, items);
	markRare(items.filter((x) => x.f.properties.src === 'osm'));
	markRare(items.filter((x) => x.f.properties.src === 'museovirasto'));
	const bytes = await writeCat(cat);
	process.stdout.write(`${cat}: ${results.get(cat).length} features, ${(bytes / 1024).toFixed(0)} KB (${((Date.now() - t0) / 1000).toFixed(0)} s)\n`);
}

const cell = ([lon, lat]) => `${Math.round(lon * 500)}:${Math.round(lat * 1000)}`;
function nearGrid(grid, [lon, lat]) {
	const cx = Math.round(lon * 500);
	const cy = Math.round(lat * 1000);
	for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) if (grid.has(`${cx + dx}:${cy + dy}`)) return true;
	return false;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();

async function main() {
	await mkdir(OUT, { recursive: true });
	for (const cat of ORDER) await runCategory(cat);

	// Global rarity over the whole extract, then rewrite every file.
	const all = ORDER.flatMap((c) => results.get(c) ?? []);
	markRare(all.filter((x) => x.f.properties.src === 'osm'));
	markRare(all.filter((x) => x.f.properties.src === 'museovirasto'));
	console.log('\nFinal (global rarity):');
	for (const cat of ORDER) {
		const bytes = await writeCat(cat);
		const items = results.get(cat);
		const rare = items.filter((x) => x.f.properties.rare).length;
		console.log(`${cat}: ${items.length} features, ${rare} rare, ${(bytes / 1024).toFixed(0)} KB`);
	}
	const rareAll = all.filter((x) => x.f.properties.rare).length;
	console.log(`total ${all.length}, rare ${rareAll} (${((rareAll / Math.max(all.length, 1)) * 100).toFixed(1)} %)`);
	console.log('mirrors that answered:', Object.fromEntries(mirrorWins));
}
