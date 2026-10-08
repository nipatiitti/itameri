<script lang="ts">
	import Icon from '@iconify/svelte';
	import { SOURCES } from '$lib/content/sources';
</script>

<svelte:head><title>Tietoa, Löytöretki</title></svelte:head>

<section class="bg-deep text-on-deep">
	<div class="mx-auto max-w-content px-gutter py-10">
		<p class="eyebrow">Tietoa palvelusta</p>
		<h1 class="mt-2 font-display text-display text-on-deep">Tuttu ympäristö, uusin silmin</h1>
		<p class="mt-3 text-on-deep-muted">
			Löytöretki nostaa kartalle sen, minkä ohi kävelet joka päivä: nimetyt puut, pienet muistomerkit,
			muinaisjäännökset, näköalat ja meren merkit. Jokaisella on tarina.
		</p>
	</div>
</section>

<div class="mx-auto max-w-content px-gutter py-8">
	<h2>Miten sovellus toimii</h2>
	<p class="mt-2">
		Kartalla näkyvät paikat tulevat OpenStreetMapista. Kun avaat paikan, sovellus hakee sille kuvan ja
		tarinan Wikipediasta ja Finnasta. Painike Yllätä minut valitsee satunnaisen paikan läheltäsi.
		Kun olet käynyt paikalla, merkitse se löydetyksi, niin se tallentuu selaimeesi.
	</p>

	<h2 class="mt-8">Mistä tiedot tulevat</h2>
	<ul class="card-flush mt-4">
		{#each SOURCES as s (s.name)}
			<li>
				<a class="list-row" href={s.url} target="_blank" rel="noopener">
					<span class="min-w-0 flex-1">
						<span class="block font-semibold">{s.name}</span>
						<span class="block text-sm text-fg-muted">{s.description}</span>
						<span class="block text-xs text-fg-muted">{s.licence}</span>
					</span>
					<Icon icon="ph:arrow-up-right" class="size-5 text-fg-muted" aria-hidden="true" />
				</a>
			</li>
		{/each}
	</ul>

	<h2 class="mt-8">Kumppanina</h2>
	<p class="mt-2">
		Sovellus on tehty Softamestari 2026 -karsintaan, jonka teemakumppani on
		<a href="https://www.johnnurmisensaatio.fi" target="_blank" rel="noopener">John Nurmisen Säätiö</a>.
		Säätiö pelastaa Itämerta ja sen perintöä tuleville sukupolville.
	</p>

	<h2 class="mt-8">Hyvä tietää</h2>
	<p class="mt-2">
		Tiedot ovat vapaaehtoisten ja museoiden keräämiä, ja niissä voi olla puutteita. Sovellus ei ole
		tarkoitettu navigointikäyttöön. Sijaintisi ei lähde selaimestasi mihinkään.
	</p>
</div>
