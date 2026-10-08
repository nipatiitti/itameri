// Shared shapes. Lead-owned. Workers import from here and never redefine these.

export const CATEGORIES = [
	'tree', // named trees (natural=tree + name)
	'memorial', // historic=memorial|monument|wayside_cross|wayside_shrine|boundary_stone
	'ancient', // historic=archaeological_site|ruins|tomb|castle|fort
	'viewpoint', // tourism=viewpoint
	'maritime', // man_made=lighthouse, historic=ship|wreck, man_made=beacon
	'artwork', // tourism=artwork
	'park', // leisure=park|garden (named, centroid)
	'building' // historic=building|manor|church|chapel|tower, heritage=*
] as const;
export type Category = (typeof CATEGORIES)[number];

/** One discoverable place from the OSM extract. */
export interface Place {
	id: string; // OSM "node/123" | "way/456" | "relation/789"
	name: string; // never empty; categories with unnamed features get a Finnish generic name
	category: Category;
	lon: number;
	lat: number;
	/** Selected OSM tags kept for the sheet: inscription, description, start_date, species, height, website, ... */
	tags: Record<string, string>;
	wikipedia?: string; // "fi:Suomenlinna" style
	wikidata?: string; // "Q12345"
}

/** GeoJSON feature properties as stored in static/data/places.geojson (flat for MapLibre). */
export interface PlaceProps {
	id: string;
	name: string;
	cat: Category;
	wikipedia?: string;
	wikidata?: string;
	[tag: string]: string | undefined;
}

export type PlaceFeature = GeoJSON.Feature<GeoJSON.Point, PlaceProps>;
export type PlaceCollection = GeoJSON.FeatureCollection<GeoJSON.Point, PlaceProps>;

export type StorySource = 'wikipedia' | 'finna' | 'commons' | 'osm';

/** Enrichment for a selected place, fetched live. Everything optional degrades gracefully. */
export interface Story {
	title: string;
	extract?: string; // 1 to 3 sentences of plain text
	imageUrl?: string;
	imageCredit?: string; // "Kuva: Museovirasto, CC BY 4.0"
	sourceUrl?: string; // link for "Lue lisää"
	source: StorySource;
}

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface LngLat {
	lon: number;
	lat: number;
}

/** A found place, persisted in localStorage. */
export interface Find {
	id: string;
	at: string; // ISO date-time
}

export interface SourceEntry {
	name: string;
	description: string;
	url: string;
	licence: string;
}
