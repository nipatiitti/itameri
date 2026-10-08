<script lang="ts">
	import Icon from '@iconify/svelte';
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import PlacesMap from '$lib/map/PlacesMap.svelte';
	import CategoryChips from '$lib/components/CategoryChips.svelte';
	import NearbyList from '$lib/components/NearbyList.svelte';
	import PlaceSheet from '$lib/components/PlaceSheet.svelte';
	import PlaceSearch from '$lib/components/PlaceSearch.svelte';
	import { scale } from 'svelte/transition';
	import { tick } from 'svelte';
	import { COPY } from '$lib/content/copy';
	import { app } from '$lib/state/app.svelte';
	import { map } from '$lib/state/map.svelte';
	import type { Place } from '$lib/types';

	let recent: string[] = [];
	let empty = $state(false);
	let emptyTimer: ReturnType<typeof setTimeout> | undefined;
	let restored = $state(false);
	let sheet = $state<HTMLElement>();
	let aside = $state<HTMLElement>();
	const wideQuery = window.matchMedia('(min-width: 48rem)');
	let wide = $state(wideQuery.matches);
	let searching = $state(false);
	let searchButton = $state<HTMLButtonElement>();

	function closeSearch() {
		searching = false;
		tick().then(() => searchButton?.focus());
	}

	function show(place: Place) {
		map.flyTo(place, 16);
		app.select(place.id);
	}

	function surprise() {
		clearTimeout(emptyTimer);
		const place = app.surprise(map.origin, 2000, recent);
		if (!place) {
			empty = true;
			emptyTimer = setTimeout(() => (empty = false), 5000);
			return;
		}
		empty = false;
		recent = [place.id, ...recent].slice(0, 5);
		show(place);
	}

	function retry() {
		app.status = 'idle';
		app.load();
	}

	// Restore ?p=<id> once the places are in.
	$effect(() => {
		if (restored || app.status !== 'ready') return;
		const id = page.url.searchParams.get('p');
		untrack(() => {
			const place = id && id !== app.selectedId ? app.byId(id) : undefined;
			if (place) show(place);
		});
		restored = true;
	});

	// Keep ?p=<id> in step with the selection.
	$effect(() => {
		const id = app.selectedId;
		if (!restored) return;
		const url = new URL(location.href);
		if (url.searchParams.get('p') === id) return;
		if (id) url.searchParams.set('p', id);
		else url.searchParams.delete('p');
		untrack(() => replaceState(url, page.state));
	});

	$effect(() => {
		const update = () => (wide = wideQuery.matches);
		wideQuery.addEventListener('change', update);
		return () => wideQuery.removeEventListener('change', update);
	});

	$effect(() => {
		void app.selectedId;
		if (sheet) sheet.scrollTop = 0;
		if (aside) aside.scrollTop = 0;
	});
</script>

<svelte:head><title>Kartta, Arjen aarteet</title></svelte:head>
<h1 class="sr-only">Kartta</h1>

<div class="fixed inset-x-0 top-bar bottom-dock md:bottom-0 md:flex">
	<aside
		bind:this={aside}
		aria-label="Aarteet"
		class="contents md:relative md:z-10 md:flex md:w-panel md:flex-none md:flex-col md:gap-5 md:overflow-y-auto md:border-r md:bg-surface md:px-gutter md:py-5 lg:w-[28rem]"
	>
		<section aria-labelledby="filter-t" class="absolute inset-x-0 top-3 z-10 md:static">
			<h2 id="filter-t" class="sr-only font-sans text-base font-semibold md:not-sr-only">Mitä etsit?</h2>
			<div class="md:mt-3">
				<CategoryChips />
			</div>
		</section>

		{#if app.status === 'ready'}
			<div
				class={[
					'pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col md:pointer-events-auto md:static md:gap-5',
					searching && 'max-md:hidden'
				]}
			>
				<div class="flex flex-col items-center gap-2 px-gutter pb-4 md:items-stretch md:px-0 md:pb-0">
					{#if empty}
						<p role="status" class="notice pointer-events-auto bg-info-soft">
							{COPY.surpriseEmpty}
						</p>
					{/if}
					<button type="button" class="btn-primary pointer-events-auto md:w-full" onclick={surprise}>
						<Icon icon="ph:magnifying-glass" class="size-5" aria-hidden="true" />{COPY.surprise}
					</button>
				</div>

				<section
					bind:this={sheet}
					class={wide
						? '-mx-gutter border-t px-gutter pt-5'
						: 'sheet pointer-events-auto relative max-h-[60dvh] overflow-y-auto'}
					aria-labelledby="sheet-t"
				>
					{#if app.selected}
						<PlaceSheet place={app.selected} onclose={() => app.select(null)} />
					{:else}
						<NearbyList onpick={show} />
					{/if}
				</section>
			</div>
		{/if}
	</aside>

	<div class="absolute inset-0 md:relative md:min-w-0 md:flex-1">
		<PlacesMap />

		<div class="pointer-events-none absolute inset-x-0 top-16 z-10 flex flex-col items-end gap-2 px-gutter md:top-4">
			<div class="flex w-full flex-col items-end gap-2 md:w-panel">
				{#if searching}
					<div class="pointer-events-auto w-full" in:scale={{ start: 0.6, duration: 160, opacity: 0 }}>
						<PlaceSearch onclose={closeSearch} />
					</div>
				{:else}
					<button
						bind:this={searchButton}
						type="button"
						class="icon-btn pointer-events-auto"
						aria-label="Hae paikkaa"
						aria-expanded={searching}
						aria-controls="place-search"
						onclick={() => (searching = true)}
					>
						<Icon icon="ph:magnifying-glass" aria-hidden="true" />
					</button>
				{/if}
				<button
					type="button"
					class="icon-btn pointer-events-auto"
					aria-label="Paikanna minut"
					aria-busy={map.locating}
					onclick={() => map.locate()}
				>
					<Icon icon="ph:crosshair" aria-hidden="true" />
				</button>
				<button
					type="button"
					class="icon-btn pointer-events-auto"
					aria-label="Vain harvinaiset"
					aria-pressed={app.rareOnly}
					onclick={() => app.toggleRare()}
				>
					<Icon icon="ph:sliders-horizontal" aria-hidden="true" />
				</button>
			</div>
		</div>

		{#if app.status === 'loading' || app.status === 'idle'}
			<div class="pointer-events-none absolute inset-x-0 top-36 z-10 flex justify-center px-gutter">
				<section class="panel w-64" aria-busy="true">
					<span class="sr-only">{COPY.loading}</span>
					<span class="skeleton h-4 w-24"></span>
					<span class="skeleton mt-3 h-6 w-3/4"></span>
					<span class="skeleton mt-3 h-4 w-1/2"></span>
				</section>
			</div>
		{:else if app.status === 'error'}
			<div class="pointer-events-none absolute inset-x-0 top-36 z-10 flex justify-center px-gutter">
				<section class="panel pointer-events-auto w-full max-w-sm text-center" aria-labelledby="error-t">
					<Icon icon="ph:warning-circle" class="mx-auto size-10 text-danger" aria-hidden="true" />
					<h2 id="error-t" class="mt-3">Aarteita ei saatu haettua</h2>
					<p class="mt-1 text-sm text-fg-muted">{COPY.errorBody}</p>
					<button type="button" class="btn-primary mt-4" onclick={retry}>
						<Icon icon="ph:arrow-clockwise" class="size-5" aria-hidden="true" />{COPY.retry}
					</button>
				</section>
			</div>
		{/if}
	</div>
</div>
