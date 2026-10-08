<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { Place, Trip } from '$lib/types';
	import { CATEGORY_META } from '$lib/content/categories';
	import { COPY } from '$lib/content/copy';
	import { formatDistance } from '$lib/data/geo';
	import { formatMinutes } from '$lib/data/route';
	import { trips } from '$lib/state/trips.svelte';

	let {
		trip,
		onpick,
		onhide,
		collapsed = false
	}: { trip: Trip; onpick: (place: Place) => void; onhide: () => void; collapsed?: boolean } = $props();

	const stops = $derived(trips.stopsOf(trip));
</script>

<p class="eyebrow">Retki</p>
<h2 id="sheet-t" class="mt-1">{trip.name}</h2>

<div hidden={collapsed}>
	<p class="mt-1 flex flex-wrap gap-x-3 text-sm text-fg-muted">
		<span>{stops.length} kohdetta</span>
		<span>{formatDistance(trip.lengthM)}</span>
		<span>{formatMinutes(trip.minutes)}</span>
	</p>

	<ol class="-mx-gutter mt-3" aria-label="Kohteet">
		{#each stops as place, i (place.id)}
			<li>
				<button type="button" class="list-row w-full text-left" onclick={() => onpick(place)}>
					<span class="tag bg-sunken" aria-hidden="true">{i + 1}</span>
					<span class="min-w-0 flex-1">
						<span class="block truncate font-semibold">{place.name}</span>
						<span class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
							<span>{CATEGORY_META[place.category].single}</span>
							{#if place.rare}<span class="tag bg-highlight-soft">{COPY.rare}</span>{/if}
						</span>
					</span>
					<Icon icon="ph:caret-right" class="size-5 text-fg-muted" aria-hidden="true" />
				</button>
			</li>
		{/each}
	</ol>

	<button type="button" class="btn-primary mt-4 w-full" disabled={!stops.length} onclick={() => onpick(stops[0])}>
		<Icon icon="ph:path" class="size-5" aria-hidden="true" />Aloita retki
	</button>
	<div class="mt-2 flex flex-wrap gap-2">
		<a href={`/retki/${trip.id}`} class="btn-quiet flex-1">Avaa retken sivu</a>
		<button type="button" class="btn-quiet" onclick={onhide}>
			<Icon icon="ph:x" class="size-5" aria-hidden="true" />Piilota reitti
		</button>
	</div>
</div>
