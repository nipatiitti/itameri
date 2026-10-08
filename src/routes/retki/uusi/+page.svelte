<script lang="ts">
	import Icon from '@iconify/svelte';
	import { goto } from '$app/navigation';
	import { fly } from 'svelte/transition';
	import StartPicker from '$lib/components/StartPicker.svelte';
	import type { SearchHit } from '$lib/components/PlaceSearch.svelte';
	import { DURATIONS, MOODS, TRANSPORTS, type Duration, type LngLat, type Mood, type Transport } from '$lib/types';
	import { DURATION_META, MOOD_META, TRANSPORT_META } from '$lib/content/trip';
	import { COPY } from '$lib/content/copy';
	import { distanceM } from '$lib/data/geo';
	import { app } from '$lib/state/app.svelte';
	import { map } from '$lib/state/map.svelte';
	import { trips } from '$lib/state/trips.svelte';

	const TITLES = ['Mitä etsit?', 'Miten liikutaan?', 'Kuinka pitkään?', 'Mistä lähdetään?'];

	let step = $state(1);
	let mood = $state<Mood>();
	let transport = $state<Transport>();
	let duration = $state<Duration>();
	let center = $state<LngLat>({ ...(map.here ?? map.center) });
	let picked = $state<{ name: string; at: LngLat }>();
	let tooFew = $state(false);

	function pick(hit: SearchHit) {
		picked = { name: hit.display_name.split(',')[0].trim(), at: { lon: +hit.lon, lat: +hit.lat } };
	}

	function plan() {
		if (!mood || !transport || !duration) return;
		const start = { lon: center.lon, lat: center.lat };
		const startName = picked && distanceM(start, picked.at) < 2000 ? picked.name : undefined;
		const trip = trips.create({ mood, transport, duration, start, startName });
		if (!trip) {
			tooFew = true;
			return;
		}
		goto(`/retki/${trip.id}`);
	}

	function retry() {
		app.status = 'idle';
		app.load();
	}
</script>

<svelte:head><title>Uusi retki, Arjen aarteet</title></svelte:head>

<div class="mx-auto max-w-content px-gutter py-6">
	<div class="flex items-start gap-2">
		{#if step > 1}
			<button type="button" class="icon-btn-quiet -ml-3" aria-label="Takaisin" onclick={() => (step -= 1)}>
				<Icon icon="ph:arrow-left" class="size-6" aria-hidden="true" />
			</button>
		{:else}
			<a href="/retki" class="icon-btn-quiet -ml-3" aria-label="Takaisin">
				<Icon icon="ph:arrow-left" class="size-6" aria-hidden="true" />
			</a>
		{/if}
		<div class="min-w-0 flex-1">
			<p class="eyebrow">Vaihe {step}/4</p>
			{#key step}
				<h1 class="mt-1" tabindex="-1" {@attach (el) => el.focus()}>{TITLES[step - 1]}</h1>
			{/key}
		</div>
	</div>

	{#key step}
	<div in:fly={{ x: 24, duration: 200 }}>
	{#if step === 1}
		<ul class="mt-6 grid gap-3 md:grid-cols-2">
			{#each MOODS as m (m)}
				<li>
					<button
						type="button"
						class="card w-full text-left"
						aria-pressed={mood === m}
						onclick={() => {
							mood = m;
							step = 2;
						}}
					>
						<span class="block font-semibold">{MOOD_META[m].label}</span>
						<span class="mt-1 block text-sm text-fg-muted">{MOOD_META[m].blurb}</span>
					</button>
				</li>
			{/each}
		</ul>
	{:else if step === 2}
		<ul class="mt-6 grid gap-3 md:grid-cols-3">
			{#each TRANSPORTS as t (t)}
				<li>
					<button
						type="button"
						class="card w-full text-left"
						aria-pressed={transport === t}
						onclick={() => {
							transport = t;
							step = 3;
						}}><span class="font-semibold">{TRANSPORT_META[t].label}</span></button
					>
				</li>
			{/each}
		</ul>
	{:else if step === 3}
		<ul class="mt-6 grid gap-3 md:grid-cols-3">
			{#each DURATIONS as d (d)}
				<li>
					<button
						type="button"
						class="card w-full text-left"
						aria-pressed={duration === d}
						onclick={() => {
							duration = d;
							step = 4;
						}}><span class="font-semibold">{DURATION_META[d].label}</span></button
					>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="mt-2 text-sm text-fg-muted">Siirrä karttaa niin, että tähtäin osuu lähtöpaikkaan. Retki palaa samaan pisteeseen.</p>
		<div class="mt-4">
			<StartPicker bind:center onpick={pick} />
		</div>
		{#if tooFew}
			<p role="status" class="notice mt-4 bg-warn-soft">
				Tältä alueelta ei löytynyt tarpeeksi aarteita. Kokeile toista lähtöpistettä tai pidempää retkeä.
			</p>
		{/if}
		{#if app.status === 'error'}
			<div role="status" class="notice mt-4 items-center bg-danger-soft">
				<p class="flex-1">{COPY.errorBody}</p>
				<button type="button" class="btn-quiet" onclick={retry}>
					<Icon icon="ph:arrow-clockwise" class="size-5" aria-hidden="true" />{COPY.retry}
				</button>
			</div>
		{/if}
		<button type="button" class="btn-primary mt-4 w-full" disabled={app.status !== 'ready'} onclick={plan}>
			Suunnittele retki
		</button>
	{/if}
	</div>
	{/key}
</div>
