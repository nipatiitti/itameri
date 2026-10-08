import { Map as MlMap, AttributionControl, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { map } from '$lib/state/map.svelte';
import { MAP, ALGAE } from '$lib/map-colors';
import type { LngLat } from '$lib/types';

setWorkerUrl(workerUrl);

export type Feature = GeoJSON.Feature<GeoJSON.Geometry>;
export type Collection = GeoJSON.FeatureCollection<GeoJSON.Geometry>;

const STYLE = 'https://tiles.openfreemap.org/styles/positron';
export const EMPTY: Collection = { type: 'FeatureCollection', features: [] };

export const feature = (p: LngLat, properties: Record<string, unknown> = {}): Feature => ({
	type: 'Feature',
	geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
	properties
});
export const collection = (features: Feature[]): Collection => ({ type: 'FeatureCollection', features });

/** OpenFreeMap positron with compact attribution bottom-right and no other controls. */
export function createMap(container: HTMLElement, center: LngLat, zoom: number): MlMap {
	const mm = new MlMap({
		container,
		style: STYLE,
		center: [center.lon, center.lat],
		zoom,
		attributionControl: false
	});
	mm.addControl(new AttributionControl({ compact: true }), 'bottom-right');
	return mm;
}

export function setData(mm: MlMap | null, id: string, data: Collection) {
	(mm?.getSource(id) as GeoJSONSource | undefined)?.setData(data);
}

/** Pull positron's grey basemap toward the paper palette. Every colour is a theme token. */
export function tintBasemap(mm: MlMap) {
	const paint = (id: string, prop: string, value: unknown) => {
		if (mm.getLayer(id)) mm.setPaintProperty(id, prop, value);
	};
	paint('background', 'background-color', MAP.land);
	paint('water', 'fill-color', MAP.water);
	paint('waterway', 'line-color', MAP.water);
	for (const id of ['park', 'landcover_wood']) {
		paint(id, 'fill-color', ALGAE[0]);
		paint(id, 'fill-opacity', id === 'park' ? 0.45 : 0.3);
	}
	paint('landuse_residential', 'fill-color', MAP.muted);
	paint('landuse_residential', 'fill-opacity', 0.12);
	paint('building', 'fill-color', MAP.muted);
	paint('building', 'fill-opacity', 0.3);
	for (const id of ['highway-name-minor', 'highway-name-major', 'highway-name-path', 'label_other', 'label_village', 'label_town', 'label_city', 'label_state']) {
		paint(id, 'text-color', MAP.label);
		paint(id, 'text-halo-color', MAP.land);
	}
	for (const id of ['water_name_point_label', 'water_name_line_label']) paint(id, 'text-color', MAP.select);
}

/** The one brass "you are here" dot. Add last so it sits on top. */
export function addHereLayer(mm: MlMap) {
	if (mm.getSource('here')) return;
	mm.addSource('here', { type: 'geojson', data: EMPTY });
	mm.addLayer({
		id: 'here',
		type: 'circle',
		source: 'here',
		paint: {
			'circle-color': MAP.here,
			'circle-radius': 6,
			'circle-stroke-color': MAP.halo,
			'circle-stroke-width': 2
		}
	});
}

/** Call inside an $effect: draws map.here. */
export function showHere(mm: MlMap | null) {
	const h = map.here;
	setData(mm, 'here', h ? collection([feature(h)]) : EMPTY);
}

/** Write centre, zoom and bounds to the shared map state. */
export function syncView(mm: MlMap) {
	const c = mm.getCenter();
	const b = mm.getBounds();
	map.center = { lon: c.lng, lat: c.lat };
	map.zoom = mm.getZoom();
	map.bounds = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
}

/** Call inside an $effect: runs the latest map.fly request once across all maps. */
export function followFly(mm: MlMap | null) {
	const fly = map.fly;
	if (!mm || !fly || fly.seq <= map.handledSeq) return;
	map.handledSeq = fly.seq;
	mm.flyTo({
		center: [fly.target.lon, fly.target.lat],
		zoom: fly.zoom ?? Math.max(mm.getZoom(), 15),
		essential: true
	});
}
