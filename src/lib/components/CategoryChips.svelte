<script lang="ts">
	import { CATEGORIES } from '$lib/types';
	import { CATEGORY_META } from '$lib/content/categories';
	import { app } from '$lib/state/app.svelte';
</script>

<ul aria-label="Näytettävät lajit" class="flex gap-2 overflow-x-auto px-gutter py-1 md:flex-wrap md:px-0">
	{#each CATEGORIES as category (category)}
		<li class="flex-none">
			<button
				type="button"
				class="chip"
				aria-pressed={app.isActive(category)}
				onclick={() => app.toggleCategory(category)}>{CATEGORY_META[category].label}</button
			>
		</li>
	{/each}
</ul>
