<script lang="ts">
	import type { Photo } from '$lib/types';

	let { photo, loading, alt }: { photo?: Photo; loading: boolean; alt: string } = $props();

	let failedUrl = $state<string | null>(null);
	const shown = $derived(photo && photo.url !== failedUrl ? photo : undefined);
</script>

{#if loading}
	<div class="skeleton aspect-[4/3] w-full" aria-busy="true"><span class="sr-only">Ladataan…</span></div>
{:else if shown}
	<figure>
		<img
			src={shown.url}
			{alt}
			loading="lazy"
			class="aspect-[4/3] w-full rounded-control bg-sunken object-cover"
			onerror={() => (failedUrl = shown.url)}
		/>
		<figcaption class="mt-1 text-xs text-fg-muted">
			{#if shown.linkUrl}
				<a href={shown.linkUrl} target="_blank" rel="noopener">{shown.credit}</a>
			{:else}
				{shown.credit}
			{/if}
		</figcaption>
	</figure>
{/if}
