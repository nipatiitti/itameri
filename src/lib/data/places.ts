import type { Place, PlaceCollection } from '$lib/types';

// STUB: data-worker replaces this file. Contract: loadPlaces() resolves to Place[] (empty on failure, never throws).
export async function loadPlaces(): Promise<Place[]> {
	try {
		const res = await fetch('/data/places.geojson');
		if (!res.ok) return [];
		const fc = (await res.json()) as PlaceCollection;
		return fc.features.map((f) => {
			const { id, name, cat, wikipedia, wikidata, ...tags } = f.properties;
			return {
				id,
				name,
				category: cat,
				lon: f.geometry.coordinates[0],
				lat: f.geometry.coordinates[1],
				tags: Object.fromEntries(Object.entries(tags).filter(([, v]) => typeof v === 'string')) as Record<string, string>,
				wikipedia,
				wikidata
			};
		});
	} catch {
		return [];
	}
}
