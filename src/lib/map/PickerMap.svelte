<script lang="ts">
	// STUB: map-worker replaces this file. Contract: a basemap that fills its parent, starts at `center`, reports its centre via `bind:center` on every move, follows map.fly like PlacesMap, shows the here-dot. No place points.
	import type { LngLat } from "$lib/types";
	let { center = $bindable() }: { center: LngLat } = $props();
</script>
<div class="h-full w-full bg-map-water"></div>
