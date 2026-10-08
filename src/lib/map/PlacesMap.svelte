<script lang="ts">
	import { untrack } from 'svelte';
	import { Map as MlMap, AttributionControl, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl';
	import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { app } from '$lib/state/app.svelte';
	import { map } from '$lib/state/map.svelte';
	import { MAP } from '$lib/map-colors';
	import type { LngLat } from '$lib/types';

	type Point = GeoJSON.Feature<GeoJSON.Point>;
	type Collection = GeoJSON.FeatureCollection<GeoJSON.Point>;

	setWorkerUrl(workerUrl);
	const STYLE = 'https://tiles.openfreemap.org/styles/positron';
	const EMPTY: Collection = { type: 'FeatureCollection', features: [] };

	const feature = (p: LngLat, properties: Record<string, unknown> = {}): Point => ({
		type: 'Feature',
		geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
		properties
	});
	const collection = (features: Point[]): Collection => ({ type: 'FeatureCollection', features });

	let m = $state.raw<MlMap | null>(null);

	function setData(id: string, data: Collection) {
		(m?.getSource(id) as GeoJSONSource | undefined)?.setData(data);
	}

	function addLayers(mm: MlMap) {
		if (mm.getLayer('background')) mm.setPaintProperty('background', 'background-color', MAP.land);
		if (mm.getLayer('water')) mm.setPaintProperty('water', 'fill-color', MAP.water);
		if (mm.getSource('places')) return;

		mm.addSource('places', {
			type: 'geojson',
			data: EMPTY,
			cluster: true,
			clusterRadius: 40,
			clusterMaxZoom: 15
		});
		mm.addSource('selected', { type: 'geojson', data: EMPTY });
		mm.addSource('here', { type: 'geojson', data: EMPTY });

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

	function syncView(mm: MlMap) {
		const c = mm.getCenter();
		const b = mm.getBounds();
		map.center = { lon: c.lng, lat: c.lat };
		map.zoom = mm.getZoom();
		map.bounds = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
	}

	const attachMap = (el: HTMLDivElement) => {
		const start = untrack(() => ({ lon: map.center.lon, lat: map.center.lat, zoom: map.zoom }));
		const mm = new MlMap({
			container: el,
			style: STYLE,
			center: [start.lon, start.lat],
			zoom: start.zoom,
			attributionControl: false
		});
		mm.addControl(new AttributionControl({ compact: true }), 'bottom-right');

		mm.on('load', () => {
			addLayers(mm);
			syncView(mm);
			m = mm;
		});
		mm.on('moveend', () => syncView(mm));

		mm.on('click', (e) => {
			if (!mm.getLayer('points')) return;
			const [f] = mm.queryRenderedFeatures(e.point, { layers: ['selected', 'clusters', 'points'] });
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

		const pointer = () => (mm.getCanvas().style.cursor = 'pointer');
		const plain = () => (mm.getCanvas().style.cursor = '');
		mm.on('mouseenter', ['clusters', 'points'], pointer);
		mm.on('mouseleave', ['clusters', 'points'], plain);

		return () => {
			m = null;
			mm.remove();
		};
	};

	$effect(() => {
		if (!m) return;
		setData(
			'places',
			collection(
				app.visible.map((p) => feature(p, { id: p.id, name: p.name, cat: p.category, rare: p.rare }))
			)
		);
	});

	$effect(() => {
		if (!m) return;
		const s = app.selected;
		setData('selected', s ? collection([feature(s, { id: s.id })]) : EMPTY);
	});

	$effect(() => {
		if (!m) return;
		const h = map.here;
		setData('here', h ? collection([feature(h)]) : EMPTY);
	});

	$effect(() => {
		const fly = map.fly;
		const mm = m;
		if (!mm || !fly || fly.seq <= map.handledSeq) return;
		map.handledSeq = fly.seq;
		mm.flyTo({
			center: [fly.target.lon, fly.target.lat],
			zoom: fly.zoom ?? Math.max(mm.getZoom(), 15),
			essential: true
		});
	});
</script>

<div class="h-full w-full" {@attach attachMap}></div>
