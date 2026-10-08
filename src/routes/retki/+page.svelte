<script lang="ts">
	import Icon from '@iconify/svelte';
	import { formatDistance } from '$lib/data/geo';
	import { formatMinutes } from '$lib/data/route';
	import { fly } from 'svelte/transition';
	import { trips } from '$lib/state/trips.svelte';
	import { TRANSPORT_META } from '$lib/content/trip';

	const date = new Intl.DateTimeFormat('fi-FI');
</script>

<svelte:head><title>Retket, Arjen aarteet</title></svelte:head>

<div class="mx-auto max-w-content px-gutter py-6">
	<h1>Retket</h1>
	<p class="mt-2 text-fg-muted">
		Suunnittele kierros lähiympäristöösi. Valitse tunnelma, kulkutapa ja lähtöpiste, niin kokoamme reitin parhaiden
		aarteiden kautta.
	</p>

	{#if trips.list.length}
		<a href="/retki/uusi" class="btn-primary mt-4">Uusi retki</a>
		<ul class="mt-6 grid gap-3" aria-label="Tallennetut retket">
			{#each trips.list as trip, i (trip.id)}
				<li in:fly={{ y: 12, duration: 200, delay: i * 40 }}>
					<a href={`/retki/${trip.id}`} class="card flex items-center gap-3">
						<span class="min-w-0 flex-1">
							<span class="block font-semibold">{trip.name}</span>
							<span class="mt-1 flex flex-wrap gap-x-3 text-sm text-fg-muted">
								<span>{TRANSPORT_META[trip.plan.transport].label}</span>
								<span>{trip.stops.length} kohdetta</span>
								<span>{formatDistance(trip.lengthM)}</span>
								<span>{formatMinutes(trip.minutes)}</span>
								<time datetime={trip.createdAt}>{date.format(new Date(trip.createdAt))}</time>
							</span>
						</span>
						<Icon icon="ph:caret-right" class="size-5 text-fg-muted" aria-hidden="true" />
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<section class="card mt-6 text-center" aria-labelledby="empty-t">
			<Icon icon="ph:anchor-simple" class="mx-auto size-10 text-accent" aria-hidden="true" />
			<h2 id="empty-t" class="mt-3">Ensimmäinen retki odottaa</h2>
			<p class="mt-1 text-sm text-fg-muted">Kolme valintaa ja lähtöpiste, siinä kaikki.</p>
			<a href="/retki/uusi" class="btn-primary mt-4">Uusi retki</a>
		</section>
	{/if}
</div>
