// Shared shapes. Lead-owned. Workers import from here and never redefine these.

export const CATEGORIES = [
	'park', // leisure=park|garden, landuse=cemetery|allotments (named, centroid)
	'memorial', // historic=memorial|monument, tourism=artwork
	'building', // historic=building|manor|church|chapel|tower|castle|fort, heritage=*, buildings with start_date before 1920
	'ancient', // Museovirasto muinaisjaannos_piste (kuppikivet, uhrikivet, röykkiöt, linnavuoret, seidat, tarinapaikat) + OSM historic=archaeological_site|ruins|tomb
	'tree', // natural=tree with name, natural=spring, glacial erratics, natural=cave_entrance
	'maritime', // man_made=lighthouse, man_made=beacon, historic=ship|wreck
	'viewpoint', // tourism=viewpoint, man_made=tower tower:type=observation, natural=peak with name
	'oddity' // historic=boundary_stone|milestone|wayside_shrine|wayside_cross, man_made=flagpole (named), amenity=fountain (named), historic=inscription
] as const;
export type Category = (typeof CATEGORIES)[number];

export type PlaceSource = 'osm' | 'museovirasto';

/** One discoverable place. */
export interface Place {
	id: string; // OSM "node/123" | "way/456" | "relation/789" | Museovirasto "mv/<mjtunnus>"
	name: string; // never empty; unnamed features get a Finnish generic name from their type
	category: Category;
	source: PlaceSource;
	lon: number;
	lat: number;
	/** True when the feature's defining tag is uncommon in the extract (shown as "Harvinainen"). */
	rare: boolean;
	/** Selected raw tags kept for the sheet as plain facts: inscription, description, start_date, species, height, architect, tyyppi, alatyyppi, ajoitus, ... */
	tags: Record<string, string>;
	wikipedia?: string; // "fi:Suomenlinna" style
	wikidata?: string; // "Q12345"
	image?: string; // direct image URL from OSM image= or wikimedia_commons= tag (already resolved to a fetchable URL)
	externalUrl?: string; // kyppi.fi page for Museovirasto, OSM page for OSM
}

/** GeoJSON feature properties as stored in static/data/<category>.geojson (flat for MapLibre). */
export interface PlaceProps {
	id: string;
	name: string;
	cat: Category;
	src: PlaceSource;
	rare?: boolean;
	wikipedia?: string;
	wikidata?: string;
	image?: string;
	url?: string;
	[tag: string]: string | boolean | undefined;
}

export type PlaceFeature = GeoJSON.Feature<GeoJSON.Point, PlaceProps>;
export type PlaceCollection = GeoJSON.FeatureCollection<GeoJSON.Point, PlaceProps>;

export type StorySource = 'wikipedia' | 'wikidata' | 'commons' | 'finna' | 'osm' | 'museovirasto';

/** A photo with its licence line. */
export interface Photo {
	url: string; // fetchable image URL, about 640 px wide
	credit: string; // "Kuva: Museovirasto, CC BY 4.0" style, shown next to the image
	linkUrl?: string; // record page
	year?: string; // for Finna historical photos
	title?: string;
}

/** Enrichment for a selected place, fetched live. Everything optional degrades gracefully. */
export interface Story {
	title: string;
	extract?: string; // 1 to 3 sentences of plain text
	hero?: Photo; // the main picture from the fallback chain
	oldPhotos: Photo[]; // Finna historical photos near the spot, may be empty
	readMoreUrl?: string; // Wikipedia page or kyppi page
	readMoreLabel?: string; // "Wikipedia", "Museovirasto"
	source: StorySource; // where the extract came from
}

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface LngLat {
	lon: number;
	lat: number;
}

/** A found place, persisted in localStorage. */
export interface Find {
	id: string;
	name: string;
	category: Category;
	at: string; // ISO date-time
}

export interface SourceEntry {
	name: string;
	description: string;
	url: string;
	licence: string;
}

// ---------- Retki (trip planner) ----------

export const MOODS = ['calm', 'urban', 'woods', 'sea', 'history'] as const;
export type Mood = (typeof MOODS)[number];
export const TRANSPORTS = ['walk', 'bike', 'car'] as const;
export type Transport = (typeof TRANSPORTS)[number];
export const DURATIONS = ['short', 'medium', 'long'] as const;
export type Duration = (typeof DURATIONS)[number];

/** The wizard's answers. */
export interface TripPlan {
	mood: Mood;
	transport: Transport;
	duration: Duration;
	start: LngLat;
	startName?: string; // from search, else undefined
}

/** A planned loop, persisted in localStorage. Stops are place ids in visiting order; the loop returns to start. */
export interface Trip {
	id: string;
	name: string;
	createdAt: string; // ISO
	plan: TripPlan;
	stops: string[];
	lengthM: number; // whole loop including the return leg
	minutes: number; // estimated time including stops
}
