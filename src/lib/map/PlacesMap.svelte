<script lang="ts">
	import { untrack } from 'svelte';
	import { LngLatBounds, type Map as MlMap, type GeoJSONSource } from 'maplibre-gl';
	import { app } from '$lib/state/app.svelte';
	import { map } from '$lib/state/map.svelte';
	import { trips } from '$lib/state/trips.svelte';
	import { MAP } from '$lib/map-colors';
	import {
		EMPTY,
		addHereLayer,
		collection,
		createMap,
		feature,
		followFly,
		setData,
		showHere,
		syncView,
		tintBasemap
	} from './basemap';

	let m = $state.raw<MlMap | null>(null);

	function addLayers(mm: MlMap) {
		tintBasemap(mm);
		if (mm.getSource('places')) return;

		mm.addSource('places', {
			type: 'geojson',
			data: EMPTY,
			cluster: true,
			clusterRadius: 40,
			clusterMaxZoom: 15
		});
		mm.addSource('selected', { type: 'geojson', data: EMPTY });
		mm.addSource('route', { type: 'geojson', data: EMPTY });
		mm.addSource('route-points', { type: 'geojson', data: EMPTY });

		mm.addLayer({
			id: 'clusters',
			type: 'circle',
			source: 'places',
			filter: ['has', 'point_count'],
			paint: {
				'circle-color': MAP.select,
				'circle-radius': ['step', ['get', 'point_count'], 14, 10, 18, 50, 24],
				'circle-stroke-color': MAP.halo,
				'circle-stroke-width': 2
			}
		});
		mm.addLayer({
			id: 'cluster-count',
			type: 'symbol',
			source: 'places',
			filter: ['has', 'point_count'],
			layout: {
				'text-field': ['get', 'point_count_abbreviated'],
				'text-font': ['Noto Sans Regular'],
				'text-size': 12,
				'text-allow-overlap': true
			},
			paint: { 'text-color': MAP.halo }
		});
		mm.addLayer({
			id: 'route',
			type: 'line',
			source: 'route',
			layout: { 'line-join': 'round', 'line-cap': 'round' },
			paint: {
				'line-color': MAP.select,
				'line-width': 3,
				'line-opacity': 0.7,
				'line-dasharray': [2, 1.5]
			}
		});
		mm.addLayer({
			id: 'points',
			type: 'circle',
			source: 'places',
			filter: ['!', ['has', 'point_count']],
			paint: {
				'circle-color': MAP.select,
				'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 4, 14, 7],
				'circle-stroke-color': MAP.halo,
				'circle-stroke-width': ['case', ['boolean', ['get', 'rare'], false], 2.5, 1.5]
			}
		});
		mm.addLayer({
			id: 'selected',
			type: 'circle',
			source: 'selected',
			paint: {
				'circle-color': MAP.halo,
				'circle-radius': 9,
				'circle-stroke-color': MAP.select,
				'circle-stroke-width': 3
			}
		});
		mm.addLayer({
			id: 'route-start',
			type: 'circle',
			source: 'route-points',
			filter: ['==', ['get', 'kind'], 'start'],
			paint: {
				'circle-color': MAP.select,
				'circle-radius': 7,
				'circle-stroke-color': MAP.halo,
				'circle-stroke-width': 2
			}
		});
		mm.addLayer({
			id: 'route-stops',
			type: 'circle',
			source: 'route-points',
			filter: ['==', ['get', 'kind'], 'stop'],
			paint: {
				'circle-color': MAP.halo,
				'circle-radius': 11,
				'circle-stroke-color': MAP.select,
				'circle-stroke-width': 2
			}
		});
		mm.addLayer({
			id: 'route-stop-number',
			type: 'symbol',
			source: 'route-points',
			filter: ['==', ['get', 'kind'], 'stop'],
			layout: {
				'text-field': ['to-string', ['get', 'n']],
				'text-font': ['Noto Sans Regular'],
				'text-size': 12,
				'text-allow-overlap': true,
				'text-ignore-placement': true
			},
			paint: { 'text-color': MAP.select }
		});
		mm.addLayer({
			id: 'points-label',
			type: 'symbol',
			source: 'places',
			minzoom: 14,
			filter: ['!', ['has', 'point_count']],
			layout: {
				'text-field': ['get', 'name'],
				'text-font': ['Noto Sans Regular'],
				'text-size': 12,
				'text-anchor': 'top',
				'text-offset': [0, 0.9],
				'text-max-width': 10,
				'text-allow-overlap': false
			},
			paint: {
				'text-color': MAP.label,
				'text-halo-color': MAP.land,
				'text-halo-width': 1.5
			}
		});
		addHereLayer(mm);
	}

	const CLICKABLE = ['route-stops', 'selected', 'clusters', 'points'];

	const attachMap = (el: HTMLDivElement) => {
		const start = untrack(() => ({ center: map.center, zoom: map.zoom }));
		const mm = createMap(el, start.center, start.zoom);

		mm.on('load', () => {
			addLayers(mm);
			syncView(mm);
			m = mm;
		});
		mm.on('moveend', () => syncView(mm));

		mm.on('click', (e) => {
			if (!mm.getLayer('points')) return;
			const [f] = mm.queryRenderedFeatures(e.point, { layers: CLICKABLE });
			if (!f) {
				app.select(null);
				return;
			}
			const [lon, lat] = (f.geometry as GeoJSON.Point).coordinates;
			if (f.layer.id === 'clusters') {
				(mm.getSource('places') as GeoJSONSource)
					.getClusterExpansionZoom(f.properties.cluster_id)
					.then((zoom) => mm.easeTo({ center: [lon, lat], zoom }))
					.catch(() => {});
				return;
			}
			const id = String(f.properties.id);
			if (id !== app.selectedId) app.select(id);
			mm.easeTo({ center: [lon, lat] });
		});

		const hoverable = ['clusters', 'points', 'route-stops'];
		mm.on('mouseenter', hoverable, () => (mm.getCanvas().style.cursor = 'pointer'));
		mm.on('mouseleave', hoverable, () => (mm.getCanvas().style.cursor = ''));

		return () => {
			m = null;
			mm.remove();
		};
	};

	$effect(() => {
		if (!m) return;
		setData(
			m,
			'places',
			trips.active
				? EMPTY
				: collection(
						app.visible.map((p) => feature(p, { id: p.id, name: p.name, cat: p.category, rare: p.rare }))
					)
		);
	});

	$effect(() => {
		if (!m) return;
		const s = app.selected;
		setData(m, 'selected', s ? collection([feature(s, { id: s.id })]) : EMPTY);
		m.setPaintProperty('route-stops', 'circle-stroke-width', [
			'case',
			['==', ['get', 'id'], s?.id ?? ''],
			3,
			2
		]);
	});

	$effect(() => {
		const mm = m;
		if (!mm) return;
		const trip = trips.active;
		if (!trip) {
			setData(mm, 'route', EMPTY);
			setData(mm, 'route-points', EMPTY);
			return;
		}
		const home = trip.plan.start;
		const stops = trips.stopsOf(trip);
		const ring = [home, ...stops, home].map((p) => [p.lon, p.lat]);
		const line = trips.shapes[trip.id] ?? ring;
		untrack(() => trips.refine(trip.id));
		setData(mm, 'route', {
			type: 'FeatureCollection',
			features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: line }, properties: {} }]
		});
		setData(
			mm,
			'route-points',
			collection([
				feature(home, { kind: 'start' }),
				...stops.map((p, i) => feature(p, { kind: 'stop', id: p.id, n: i + 1 }))
			])
		);
	});

	// Fit the whole loop only when asked (Näytä kartalla, Aloita retki, closing a stop), never on a plain redraw.
	$effect(() => {
		const mm = m;
		const seq = trips.fitSeq;
		const trip = trips.active;
		if (!mm || !trip || seq === trips.fitHandled) return;
		trips.fitHandled = seq;
		const bounds = new LngLatBounds();
		for (const p of [trip.plan.start, ...trips.stopsOf(trip)]) bounds.extend([p.lon, p.lat]);
		mm.fitBounds(bounds, { padding: 60, maxZoom: 16 });
	});

	$effect(() => showHere(m));
	$effect(() => followFly(m));
</script>

<div class="h-full w-full" {@attach attachMap}></div>
