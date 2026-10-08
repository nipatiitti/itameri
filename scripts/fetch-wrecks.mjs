// Museovirasto shipwrecks (muinaisjäännösrekisteri, tyyppi contains "hyly") for the maritime category.
// Run directly to merge into the existing static/data/maritime.geojson without re-running Overpass:
//   node scripts/fetch-wrecks.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { inFinland } from './fetch-places.mjs';

const FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'static', 'data', 'maritime.geojson');
const UA = 'arjen-aarteet/0.1 (softamestari)';
const round = (n) => Math.round(n * 1e6) / 1e6;

/** Wreck features as PlaceProps points, rare when metal or medieval. */
export async function fetchWrecks() {
	const params = new URLSearchParams({
		service: 'WFS',
		version: '2.0.0',
		request: 'GetFeature',
		typeName: 'rajapinta_suojellut:muinaisjaannos_piste',
		outputFormat: 'application/json',
		srsName: 'EPSG:4326',
		propertyName: 'Shape,mjtunnus,kohdenimi,kunta,tyyppi,alatyyppi,ajoitus,vedenalainen',
		CQL_FILTER: "tyyppi LIKE '%hyly%'"
	});
	const res = await fetch(`https://geoserver.museovirasto.fi/geoserver/rajapinta_suojellut/ows?${params}`, {
		headers: { 'User-Agent': UA },
		signal: AbortSignal.timeout(200_000)
	});
	if (!res.ok) throw new Error(`WFS HTTP ${res.status}`);
	const fc = await res.json();
	const seen = new Set();
	const out = [];
	for (const f of fc.features) {
		const p = f.properties;
		const c = f.geometry?.coordinates;
		if (!c || c[0] < 19 || c[0] > 31 || c[1] < 59.5 || c[1] > 66 || !inFinland(c) || seen.has(p.mjtunnus)) continue;
		seen.add(p.mjtunnus);
		const props = {
			id: `mv/${p.mjtunnus}`,
			name: (p.kohdenimi ?? '').trim() || 'Hylky',
			cat: 'maritime',
			src: 'museovirasto',
			url: `https://www.kyppi.fi/to.aspx?id=112.${p.mjtunnus}`
		};
		for (const k of ['kohdenimi', 'kunta', 'tyyppi', 'alatyyppi', 'ajoitus']) {
			if (typeof p[k] === 'string' && p[k].trim()) props[k] = p[k].trim();
		}
		const under = (p.vedenalainen ?? '').trim().toLowerCase();
		if (under === 'k' || under === 'e') props.vedenalainen = under;
		if (/hylyt \(metalli\)/.test(props.alatyyppi ?? '') || /keskiaikainen/.test(props.ajoitus ?? '')) props.rare = true;
		out.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [round(c[0]), round(c[1])] }, properties: props });
	}
	return out;
}

/** Merge wrecks into maritime features: replace older Museovirasto wrecks, drop OSM wrecks within 60 m. */
export function mergeWrecks(features, wrecks) {
	const cell = (lon, lat) => `${Math.floor(lon * 1000)}:${Math.floor(lat * 2000)}`;
	const grid = new Map();
	for (const w of wrecks) {
		const [lon, lat] = w.geometry.coordinates;
		const key = cell(lon, lat);
		grid.set(key, [...(grid.get(key) ?? []), w]);
	}
	const near = ([lon, lat]) => {
		const cx = Math.floor(lon * 1000);
		const cy = Math.floor(lat * 2000);
		for (let dx = -2; dx <= 2; dx++) {
			for (let dy = -2; dy <= 2; dy++) {
				for (const w of grid.get(`${cx + dx}:${cy + dy}`) ?? []) {
					if (distanceM([lon, lat], w.geometry.coordinates) <= 60) return true;
				}
			}
		}
		return false;
	};
	const kept = features.filter((f) => {
		if (f.properties.src === 'museovirasto') return false;
		return !(f.properties.historic === 'wreck' && near(f.geometry.coordinates));
	});
	return [...kept, ...wrecks];
}

function distanceM([lon1, lat1], [lon2, lat2]) {
	const r = (d) => (d * Math.PI) / 180;
	const s =
		Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lon2 - lon1) / 2) ** 2;
	return 2 * 6371000 * Math.asin(Math.sqrt(s));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const fc = JSON.parse(await readFile(FILE, 'utf8'));
	const before = fc.features.length;
	const wrecks = await fetchWrecks();
	fc.features = mergeWrecks(fc.features, wrecks);
	const json = JSON.stringify(fc);
	if (json.length > 2 * 1024 * 1024) throw new Error(`maritime.geojson would be ${json.length} bytes`);
	await writeFile(FILE, json);
	const osmWrecks = fc.features.filter((f) => f.properties.historic === 'wreck').length;
	const rare = fc.features.filter((f) => f.properties.rare).length;
	console.log(
		`maritime: ${before} -> ${fc.features.length} features, ${wrecks.length} Museovirasto wrecks, ${osmWrecks} OSM wrecks kept, ${rare} rare, ${(json.length / 1024).toFixed(0)} KB`
	);
}
