<script lang="ts">
	import { untrack } from 'svelte';
	import type { Map as MlMap } from 'maplibre-gl';
	import type { LngLat } from '$lib/types';
	import { addHereLayer, createMap, followFly, showHere, syncView, tintBasemap } from './basemap';

	let { center = $bindable() }: { center: LngLat } = $props();

	let m = $state.raw<MlMap | null>(null);

	const attachMap = (el: HTMLDivElement) => {
		const mm = createMap(el, untrack(() => center), 14);
		mm.on('load', () => {
			tintBasemap(mm);
			addHereLayer(mm);
			syncView(mm);
			m = mm;
		});
		mm.on('move', () => {
			const c = mm.getCenter();
			center = { lon: c.lng, lat: c.lat };
		});
		mm.on('moveend', () => syncView(mm));
		return () => {
			m = null;
			mm.remove();
		};
	};

	$effect(() => showHere(m));
	$effect(() => followFly(m));
</script>

<div class="h-full w-full" {@attach attachMap}></div>
