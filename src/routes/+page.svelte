<script lang="ts">
	// STUB: ui-worker replaces this file (map page from the MapHUD card).
	import PlacesMap from '$lib/map/PlacesMap.svelte';
</script>

<svelte:head><title>Kartta, Löytöretki</title></svelte:head>
<h1 class="sr-only">Kartta</h1>
<div class="fixed inset-x-0 top-bar bottom-dock md:bottom-0">
	<PlacesMap />
</div>
