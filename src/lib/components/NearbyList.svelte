<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { Place } from '$lib/types';
	import { app } from '$lib/state/app.svelte';
	import { map } from '$lib/state/map.svelte';
	import { distanceM, formatDistance } from '$lib/data/geo';
	import { CATEGORY_META } from '$lib/content/categories';
	import { COPY } from '$lib/content/copy';

	let {
		onpick,
		collapsed = false,
		ontoggle
	}: { onpick: (place: Place) => void; collapsed?: boolean; ontoggle?: () => void } = $props();

	const nearby = $derived.by(() => {
		const origin = map.origin;
		return app.visible
			.map((place) => ({ place, distance: distanceM(origin, place) }))
			.sort((a, b) => a.distance - b.distance)
			.slice(0, 8);
	});
</script>

<p class="eyebrow">{map.here ? 'Sijainnistasi' : 'Kartan keskeltä'}</p>
<h2 id="sheet-t" class="mt-1">
	{#if ontoggle}
		<button
			type="button"
			class="flex min-h-tap w-full items-center gap-3 text-left"
			aria-expanded={!collapsed}
			aria-controls="nearby-list"
			onclick={ontoggle}
		>
			<span class="flex-1">Aarteet lähellä</span>
			<span class="font-sans"><span class="tag bg-sunken">{nearby.length}</span></span>
			<Icon
				icon="ph:caret-right"
				class={`size-5 text-fg-muted ${collapsed ? '-rotate-90' : 'rotate-90'}`}
				aria-hidden="true"
			/>
		</button>
	{:else}
		Aarteet lähellä
	{/if}
</h2>

<div id="nearby-list" hidden={collapsed}>
	{#if nearby.length}
		<ul class="-mx-gutter mt-2">
			{#each nearby as { place, distance } (place.id)}
				<li>
					<button type="button" class="list-row w-full text-left" onclick={() => onpick(place)}>
						<span class="min-w-0 flex-1">
							<span class="block truncate font-semibold">{place.name}</span>
							<span class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
								<span>{CATEGORY_META[place.category].single}</span>
								<span>{formatDistance(distance)}</span>
								{#if place.rare}<span class="tag bg-highlight-soft">{COPY.rare}</span>{/if}
							</span>
						</span>
						<Icon icon="ph:caret-right" class="size-5 text-fg-muted" aria-hidden="true" />
					</button>
				</li>
			{/each}
		</ul>
		<p class="mt-3 text-xs text-fg-muted">Lähde: OpenStreetMap ja Museovirasto</p>
	{:else}
		<div class="py-4 text-center">
			<Icon icon="ph:anchor-simple" class="mx-auto size-10 text-accent" aria-hidden="true" />
			<h3 class="mt-3">Täällä on tyyntä</h3>
			<p class="mt-1 text-sm text-fg-muted">Tältä alueelta ei löytynyt aarteita valituilla rajauksilla.</p>
			<button type="button" class="btn-secondary mt-4" onclick={() => { app.rareOnly = false; app.showAll(); }}>Näytä kaikki</button>
		</div>
	{/if}
</div>
