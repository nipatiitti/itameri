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
	import { COPY } from '$lib/content/copy';
	import { app } from '$lib/state/app.svelte';
	import { map } from '$lib/state/map.svelte';
	import type { Place } from '$lib/types';

	let recent: string[] = [];
	let empty = $state(false);
	let emptyTimer: ReturnType<typeof setTimeout> | undefined;
	let restored = $state(false);
	let sheet = $state<HTMLElement>();
	let searching = $state(false);
	let searchButton = $state<HTMLButtonElement>();

	function closeSearch() {
		searching = false;
		searchButton?.focus();
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
			const place = id ? app.byId(id) : undefined;
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
		void app.selectedId;
		if (sheet) sheet.scrollTop = 0;
	});
</script>

<svelte:head><title>Kartta, Arjen aarteet</title></svelte:head>
<h1 class="sr-only">Kartta</h1>

<div class="fixed inset-x-0 top-bar bottom-dock md:bottom-0">
	<PlacesMap />

	<div
		class="pointer-events-none absolute inset-x-0 top-3 z-10 flex flex-col gap-2 md:top-4 md:right-[calc(var(--container-panel)+var(--spacing-gutter)*2)] md:flex-row md:items-start md:pl-gutter"
	>
		<div class="pointer-events-auto min-w-0 md:flex-1">
			<CategoryChips />
		</div>
		<div class="flex min-w-0 flex-col items-end gap-2 px-gutter md:px-0">
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
				<button type="button" class="icon-btn" aria-label="Näytä kaikki" onclick={() => app.showAll()}>
					<Icon icon="ph:sliders-horizontal" aria-hidden="true" />
				</button>
			</div>
			{#if searching}
				<div class="pointer-events-auto w-full max-w-full md:w-panel">
					<PlaceSearch onclose={closeSearch} />
				</div>
			{/if}
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

	{#if app.status === 'ready'}
		<div
			class={[
				'pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col md:static',
				searching && 'max-md:hidden'
			]}
		>
			<div
				class="flex flex-col items-center gap-2 px-gutter pb-4 md:absolute md:inset-x-0 md:bottom-hud md:z-10 md:pb-0"
			>
				{#if empty}
					<p role="status" class="notice pointer-events-auto bg-info-soft">
						{COPY.surpriseEmpty}
					</p>
				{/if}
				<button type="button" class="btn-primary pointer-events-auto" onclick={surprise}>
					<Icon icon="ph:magnifying-glass" class="size-5" aria-hidden="true" />{COPY.surprise}
				</button>
			</div>

			<section
				bind:this={sheet}
				class="sheet relative pointer-events-auto max-h-[60dvh] overflow-y-auto md:absolute md:top-4 md:right-gutter md:bottom-auto md:z-30 md:max-h-[calc(100dvh-8rem)] md:w-panel"
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
</div>
