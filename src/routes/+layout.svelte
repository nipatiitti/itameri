<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Icon from '@iconify/svelte';
	import { page } from '$app/state';
	import { app } from '$lib/state/app.svelte';

	let { children } = $props();
	app.load();

	const items = [
		{ href: '/', label: 'Kartta', icon: 'ph:map-trifold' },
		{ href: '/loydot', label: 'Löydöt', icon: 'ph:list-bullets' },
		{ href: '/tietoa', label: 'Tietoa', icon: 'ph:info' }
	];
	const current = (href: string) => (page.url.pathname === href ? 'page' : undefined);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Löytöretki</title>
</svelte:head>

<div class="flex min-h-dvh flex-col">
	<header class="sticky top-0 z-20 bg-deep text-on-deep">
		<div class="mx-auto flex h-bar max-w-wide items-center gap-3 px-gutter">
			<span class="buoy" aria-hidden="true"></span>
			<a href="/" class="font-display text-lg font-semibold text-on-deep no-underline">Löytöretki</a>
			<nav aria-label="Päävalikko" class="ml-auto hidden md:flex">
				{#each items as item (item.href)}
					<a href={item.href} class="bar-link" aria-current={current(item.href)}>{item.label}</a>
				{/each}
			</nav>
		</div>
	</header>

	<main class="flex-1 pb-dock md:pb-0">
		{@render children()}
	</main>

	<nav aria-label="Päävalikko" class="fixed inset-x-0 bottom-0 z-20 flex border-t bg-surface pb-safe md:hidden">
		{#each items as item (item.href)}
			<a href={item.href} class="nav-item" aria-current={current(item.href)}>
				<Icon icon={item.icon} aria-hidden="true" />{item.label}
			</a>
		{/each}
	</nav>
</div>
