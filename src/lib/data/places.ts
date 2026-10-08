import { CATEGORIES, type Place, type PlaceCollection } from '$lib/types';

// STUB: data-worker replaces this file. Contract: loadPlaces() resolves to Place[] from static/data/<category>.geojson,
// a missing or broken file drops only that category, never throws.
export async function loadPlaces(): Promise<Place[]> {
	const results = await Promise.all(
		CATEGORIES.map(async (cat) => {
			try {
				const res = await fetch(`/data/${cat}.geojson`);
				if (!res.ok) return [];
				const fc = (await res.json()) as PlaceCollection;
				return fc.features.map((f): Place => {
					const { id, name, src, rare, wikipedia, wikidata, image, url, cat: _cat, ...rest } = f.properties;
					const tags: Record<string, string> = {};
					for (const [k, v] of Object.entries(rest)) if (typeof v === 'string') tags[k] = v;
					return {
						id,
						name,
						category: cat,
						source: src,
						lon: f.geometry.coordinates[0],
						lat: f.geometry.coordinates[1],
						rare: rare === true,
						tags,
						wikipedia,
						wikidata,
						image,
						externalUrl: url
					};
				});
			} catch {
				return [];
			}
		})
	);
	return results.flat();
}
