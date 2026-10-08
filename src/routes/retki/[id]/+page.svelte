<script lang="ts">
	import Icon from '@iconify/svelte';
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { CATEGORY_META } from '$lib/content/categories';
	import { COPY } from '$lib/content/copy';
	import { formatDistance } from '$lib/data/geo';
	import { formatMinutes } from '$lib/data/route';
	import { app } from '$lib/state/app.svelte';
	import { trips } from '$lib/state/trips.svelte';

	const trip = $derived(trips.byId(page.params.id ?? ''));
	const stops = $derived(trip ? trips.stopsOf(trip) : []);
	const stats = $derived(
		trip
			? [
					{ label: 'Kohteita', parts: [[String(trip.stops.length), '']] },
					{ label: 'Matka', parts: pairs(formatDistance(trip.lengthM)) },
					{ label: 'Kesto', parts: pairs(formatMinutes(trip.minutes)), wide: true }
				]
			: []
	);

	let name = $state('');
	let rerollFailed = $state(false);

	$effect(() => {
		const id = page.params.id ?? '';
		untrack(() => {
			name = trips.byId(id)?.name ?? '';
			rerollFailed = false;
		});
	});

	/** "1 h 20 min" → [["1", "h"], ["20", "min"]] so each number gets its own unit span. */
	function pairs(text: string): string[][] {
		const words = text.split(/\s+/);
		const out: string[][] = [];
		for (let i = 0; i < words.length; i += 2) out.push([words[i], words[i + 1] ?? '']);
		return out;
	}

	function rename(event: SubmitEvent) {
		event.preventDefault();
		if (trip && name.trim()) trips.rename(trip.id, name.trim());
	}

	function showOnMap() {
		if (!trip) return;
		trips.show(trip.id);
		goto('/');
	}

	function remove() {
		if (!trip) return;
		trips.remove(trip.id);
		goto('/retki');
	}
</script>

<svelte:head><title>{trip ? trip.name : 'Retki'}, Arjen aarteet</title></svelte:head>

<div class="mx-auto max-w-content px-gutter py-6">
	{#if trip}
		<a href="/retki" class="btn-quiet -ml-5">
			<Icon icon="ph:arrow-left" class="size-5" aria-hidden="true" />Kaikki retket
		</a>
		<h1 class="mt-2">{trip.name}</h1>

		<dl class="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
			{#each stats as stat (stat.label)}
				<div class={['card', stat.wide && 'col-span-2 md:col-span-1']}>
					<dt class="text-sm text-fg-muted">{stat.label}</dt>
					<dd class="mt-1">
						{#each stat.parts as [value, unit], i (i)}<span class="stat-value">{value}</span>{#if unit}<span
									class="stat-unit">{unit}</span
								>{/if}{#if i < stat.parts.length - 1}{' '}{/if}{/each}
					</dd>
				</div>
			{/each}
		</dl>
		<p class="mt-3 text-sm text-fg-muted">
			Lähtö: {trip.plan.startName ?? 'valittu piste'}. Reitti on suora viiva kohteiden välillä, ei reittiohje.
		</p>

		{#if app.status === 'loading' || app.status === 'idle'}
			<div class="card mt-6" aria-busy="true">
				<span class="sr-only">{COPY.loading}</span>
				<span class="skeleton h-4 w-3/4"></span>
				<span class="skeleton mt-3 h-4 w-1/2"></span>
				<span class="skeleton mt-3 h-4 w-2/3"></span>
			</div>
		{:else}
			<ol class="card-flush mt-6" aria-label="Kohteet">
				{#each stops as place, i (place.id)}
					<li>
						<a href={`/?p=${encodeURIComponent(place.id)}`} class="list-row" onclick={() => (trips.activeId = trip?.id ?? null)}>
							<span class="tag bg-sunken" aria-hidden="true">{i + 1}</span>
							<span class="min-w-0 flex-1">
								<span class="block truncate font-semibold">{place.name}</span>
								<span class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
									<span>{CATEGORY_META[place.category].single}</span>
									{#if place.rare}<span class="tag bg-highlight-soft">{COPY.rare}</span>{/if}
								</span>
							</span>
							<Icon icon="ph:caret-right" class="size-5 text-fg-muted" aria-hidden="true" />
						</a>
					</li>
				{/each}
			</ol>
			<p class="mt-3 text-xs text-fg-muted">Lähde: OpenStreetMap ja Museovirasto</p>
		{/if}

		<button type="button" class="btn-primary mt-6 w-full" onclick={showOnMap}>Näytä kartalla</button>
		{#if rerollFailed}
			<p role="status" class="notice mt-3 bg-warn-soft">Uutta reittiä ei löytynyt. Vanha reitti on tallessa.</p>
		{/if}
		<div class="mt-3 flex flex-wrap gap-2">
			<button
				type="button"
				class="btn-secondary flex-1"
				disabled={app.status !== 'ready'}
				onclick={() => (rerollFailed = !trips.reroll(trip.id))}
			>
				<Icon icon="ph:arrow-clockwise" class="size-5" aria-hidden="true" />Arvo uudelleen
			</button>
			<button type="button" class="btn-quiet" onclick={remove}>Poista</button>
		</div>

		<form class="mt-8" onsubmit={rename}>
			<label for="trip-name" class="block text-sm font-semibold">Retken nimi</label>
			<div class="mt-1 flex gap-2">
				<input id="trip-name" class="field min-w-0 flex-1" autocomplete="off" bind:value={name} />
				<button
					type="submit"
					class="btn-quiet"
					disabled={!name.trim() || name.trim() === trip.name}>Tallenna nimi</button
				>
			</div>
		</form>
	{:else}
		<section class="card text-center" aria-labelledby="missing-t">
			<Icon icon="ph:warning-circle" class="mx-auto size-10 text-danger" aria-hidden="true" />
			<h1 id="missing-t" class="mt-3">Retkeä ei löytynyt</h1>
			<p class="mt-1 text-sm text-fg-muted">Retki on ehkä poistettu, tai linkki on tallennettu toisella laitteella.</p>
			<a href="/retki" class="btn-primary mt-4">Kaikki retket</a>
		</section>
	{/if}
</div>
