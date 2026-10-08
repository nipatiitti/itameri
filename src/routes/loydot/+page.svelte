<script lang="ts">
	import Icon from '@iconify/svelte';
	import { finds } from '$lib/state/finds.svelte';
	import { CATEGORY_META } from '$lib/content/categories';
	import { COPY } from '$lib/content/copy';

	const date = new Intl.DateTimeFormat('fi-FI');
</script>

<svelte:head><title>Löydöt, Arjen aarteet</title></svelte:head>
<div class="mx-auto max-w-content px-gutter py-6">
	<h1>{COPY.findsTitle}</h1>

	{#if finds.count}
		<dl class="mt-4">
			<dt class="text-sm text-fg-muted">Paikat, joissa olet käynyt</dt>
			<dd class="mt-1">
				<span class="stat-value">{new Intl.NumberFormat('fi-FI').format(finds.count)}</span><span
					class="stat-unit">löytöä</span
				>
			</dd>
		</dl>

		<ul class="card-flush mt-6">
			{#each finds.list as find (find.id)}
				<li>
					<a href={`/?p=${encodeURIComponent(find.id)}`} class="list-row">
						<span class="min-w-0 flex-1">
							<span class="block truncate font-semibold">{find.name}</span>
							<span class="flex flex-wrap gap-x-3 text-sm text-fg-muted">
								<span>{CATEGORY_META[find.category].single}</span>
								<time datetime={find.at}>{date.format(new Date(find.at))}</time>
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
			<h2 id="empty-t" class="mt-3">{COPY.findsEmptyTitle}</h2>
			<p class="mt-1 text-sm text-fg-muted">{COPY.findsEmptyBody}</p>
			<a href="/" class="btn-secondary mt-4">{COPY.openMap}</a>
		</section>
	{/if}
</div>
