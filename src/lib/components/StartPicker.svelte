<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { LngLat } from '$lib/types';
	import PickerMap from '$lib/map/PickerMap.svelte';
	import PlaceSearch, { type SearchHit } from './PlaceSearch.svelte';
	import { map } from '$lib/state/map.svelte';

	let { center = $bindable(), onpick }: { center: LngLat; onpick?: (hit: SearchHit) => void } = $props();

	let searching = $state(false);
	let searchButton = $state<HTMLButtonElement>();

	function closeSearch() {
		searching = false;
		searchButton?.focus();
	}
</script>

<div class="relative h-[60dvh] overflow-hidden rounded-card border md:h-[32rem]">
	<PickerMap bind:center />

	<div class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
		<Icon icon="ph:crosshair" class="size-10 text-accent" aria-hidden="true" />
	</div>

	<div class="pointer-events-none absolute inset-x-0 top-3 z-10 flex flex-col items-end gap-2 px-3">
		<div class="pointer-events-auto flex flex-col gap-2">
			<button
				bind:this={searchButton}
				type="button"
				class="icon-btn"
				aria-label="Hae paikkaa"
				aria-expanded={searching}
				aria-controls="place-search"
				onclick={() => (searching ? closeSearch() : (searching = true))}
			>
				<Icon icon="ph:magnifying-glass" aria-hidden="true" />
			</button>
			<button
				type="button"
				class="icon-btn"
				aria-label="Paikanna minut"
				aria-busy={map.locating}
				onclick={() => map.locate()}
			>
				<Icon icon="ph:crosshair" aria-hidden="true" />
			</button>
		</div>
		{#if searching}
			<div class="pointer-events-auto w-full md:w-panel md:max-w-full">
				<PlaceSearch onclose={closeSearch} {onpick} />
			</div>
		{/if}
	</div>
</div>
