<script lang="ts" module>
	export interface SearchHit {
		place_id: number;
		display_name: string;
		lat: string;
		lon: string;
	}
</script>

<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { LoadStatus } from '$lib/types';
	import { map } from '$lib/state/map.svelte';
	import { COPY } from '$lib/content/copy';

	type Hit = SearchHit;

	let { onclose, onpick }: { onclose: () => void; onpick?: (hit: SearchHit) => void } = $props();

	let query = $state('');
	let status = $state<LoadStatus>('idle');
	let hits = $state.raw<Hit[]>([]);
	let token = 0;

	async function search(event: SubmitEvent) {
		event.preventDefault();
		const q = query.trim();
		if (!q) return;
		const mine = ++token;
		status = 'loading';
		const params = new URLSearchParams({
			q,
			format: 'jsonv2',
			countrycodes: 'fi,se,ee',
			limit: '5',
			'accept-language': 'fi'
		});
		try {
			const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
				signal: AbortSignal.timeout(8000)
			});
			if (!res.ok) throw new Error(`Nominatim ${res.status}`);
			const data: Hit[] = await res.json();
			if (mine !== token) return;
			hits = data;
			status = 'ready';
		} catch {
			if (mine !== token) return;
			hits = [];
			status = 'error';
		}
	}

	function pick(hit: Hit) {
		map.flyTo({ lon: +hit.lon, lat: +hit.lat }, 13);
		query = '';
		hits = [];
		status = 'idle';
		onpick?.(hit);
		onclose();
	}

	function parts(name: string): [string, string] {
		const i = name.indexOf(',');
		return i < 0 ? [name, ''] : [name.slice(0, i), name.slice(i + 1).trim()];
	}
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose()} />

<section id="place-search" class="panel" aria-label="Hae paikkaa">
	<div class="flex items-center gap-2">
		<form role="search" class="flex min-w-0 flex-1 gap-2" onsubmit={search}>
			<label for="place-q" class="sr-only">Paikka tai osoite</label>
			<input
				id="place-q"
				type="search"
				class="field min-w-0 flex-1"
				placeholder="Esimerkiksi Turku tai Hakaniemi"
				enterkeyhint="search"
				autocomplete="off"
				bind:value={query}
				{@attach (el) => el.focus()}
			/>
			<button type="submit" class="btn-secondary">Hae</button>
		</form>
		<button type="button" class="icon-btn-quiet -mr-2" aria-label="Sulje" onclick={onclose}>
			<Icon icon="ph:x" class="size-6" aria-hidden="true" />
		</button>
	</div>

	<div aria-live="polite">
		{#if status === 'loading'}
			<div class="mt-3" aria-busy="true">
				<span class="sr-only">{COPY.loading}</span>
				<span class="skeleton h-4 w-3/4"></span>
			</div>
		{:else if status === 'error'}
			<p class="mt-3 text-sm text-fg-muted">Hakua ei voitu tehdä.</p>
		{:else if status === 'ready' && !hits.length}
			<p class="mt-3 text-sm text-fg-muted">Paikkaa ei löytynyt.</p>
		{:else if hits.length}
			<ul class="-mx-4 mt-3">
				{#each hits as hit (hit.place_id)}
					{@const [name, rest] = parts(hit.display_name)}
					<li>
						<button type="button" class="list-row w-full text-left" onclick={() => pick(hit)}>
							<span class="min-w-0 flex-1">
								<span class="block truncate font-semibold">{name}</span>
								{#if rest}<span class="block truncate text-sm text-fg-muted">{rest}</span>{/if}
							</span>
							<Icon icon="ph:caret-right" class="size-5 text-fg-muted" aria-hidden="true" />
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
	<p class="mt-3 text-xs text-fg-muted">Haku: OpenStreetMap Nominatim</p>
</section>
