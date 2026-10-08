import type { Place, Story } from '$lib/types';

// STUB: data-worker replaces this file. Contract: fetchStory(place) resolves to a Story (source 'osm' at minimum), never throws.
export async function fetchStory(place: Place): Promise<Story> {
	return {
		title: place.name,
		source: place.source,
		extract: place.tags.description ?? place.tags.inscription,
		hero: place.image ? { url: place.image, credit: 'Kuva: OpenStreetMap' } : undefined,
		oldPhotos: [],
		readMoreUrl: place.externalUrl
	};
}
