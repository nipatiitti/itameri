<script lang="ts">
  import { CATEGORY_META } from "$lib/content/categories";
  import { app } from "$lib/state/app.svelte";
  import { finds } from "$lib/state/finds.svelte";
  import type { Place, StorySource } from "$lib/types";
  import Icon from "@iconify/svelte";
  import PhotoFigure from "./PhotoFigure.svelte";

  let { place, onclose }: { place: Place; onclose: () => void } = $props();

  let expanded = $state(true);
  $effect(() => {
    void place.id;
    expanded = true;
  });

  const SOURCE_LABEL: Record<StorySource, string> = {
    wikipedia: "Wikipedia",
    wikidata: "Wikidata",
    commons: "Wikimedia Commons",
    finna: "Finna",
    osm: "OpenStreetMap",
    museovirasto: "Museovirasto",
  };
  const number = new Intl.NumberFormat("fi-FI", { maximumFractionDigits: 1 });
  const date = new Intl.DateTimeFormat("fi-FI");

  function metres(value: string | undefined): string | undefined {
    const n = parseFloat((value ?? "").replace(",", "."));
    return Number.isFinite(n) ? `${number.format(n)} m` : undefined;
  }
  function built(value: string | undefined): string | undefined {
    const full = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (full)
      return date.format(
        new Date(Number(full[1]), Number(full[2]) - 1, Number(full[3])),
      );
    return value?.match(/^~?(\d{4})/)?.[1];
  }

  const meta = $derived(CATEGORY_META[place.category]);
  const found = $derived(finds.has(place.id));
  const loading = $derived(app.storyStatus === "loading");
  const extract = $derived(
    app.story?.extract ?? place.tags.description ?? meta.blurb,
  );
  const readMore = $derived(app.story?.readMoreUrl ?? place.externalUrl);
  const sources = $derived(
    [
      ...new Set(
        [app.story?.source, place.source].filter((s) => s !== undefined),
      ),
    ]
      .map((s) => SOURCE_LABEL[s])
      .join(" ja "),
  );
  const facts = $derived.by(() => {
    const t = place.tags;
    const rows: { label: string; value: string | undefined; wide?: boolean }[] =
      [
        { label: "Rakennettu", value: built(t.start_date) },
        { label: "Arkkitehti", value: t.architect },
        { label: "Taiteilija", value: t.artist_name },
        { label: "Laji", value: t["species:fi"] ?? t.species },
        { label: "Korkeus", value: metres(t.height) },
        { label: "Korkeus merenpinnasta", value: metres(t.ele) },
        { label: "Ajoitus", value: t.ajoitus },
        { label: "Tyyppi", value: t.alatyyppi },
        { label: "Kunta", value: t.kunta },
        { label: "Teksti", value: t.inscription, wide: true },
      ];
    return rows.filter((r) => r.value?.trim());
  });
</script>

<button
  type="button"
  class="absolute inset-x-0 top-0 h-8 md:hidden"
  aria-label={expanded ? "Pienennä kortti" : "Näytä kortti"}
  aria-expanded={expanded}
  aria-controls="place-body"
  onclick={() => (expanded = !expanded)}
></button>
<div class="flex items-start gap-3">
  <div class="min-w-0 flex-1">
    <p class="eyebrow">{meta.single}</p>
    <h2 id="sheet-t" class="mt-1">{place.name}</h2>
  </div>
  <button
    type="button"
    class="icon-btn-quiet -mt-2 -mr-2"
    aria-label="Sulje"
    onclick={onclose}
  >
    <Icon icon="ph:x" class="size-6" aria-hidden="true" />
  </button>
</div>

<div id="place-body" hidden={!expanded}>
{#if place.rare || found}
  <ul class="mt-3 flex flex-wrap gap-2" aria-label="Merkinnät">
    {#if place.rare}<li class="tag bg-highlight-soft">Harvinainen</li>{/if}
    {#if found}<li class="tag bg-ok-soft">Löydetty</li>{/if}
  </ul>
{/if}

<div class="mt-4">
  <PhotoFigure
    photo={app.story?.hero}
    {loading}
    alt={place.name}
  />
</div>

{#if loading}
  <div class="mt-3" aria-busy="true">
    <span class="sr-only">Ladataan…</span>
    <span class="skeleton h-4 w-full"></span>
    <span class="skeleton mt-2 h-4 w-5/6"></span>
    <span class="skeleton mt-2 h-4 w-2/3"></span>
  </div>
{:else}
  <p class="mt-3">{extract}</p>
  {#if app.storyStatus === "error"}
    <div class="mt-2 flex flex-wrap items-center gap-2">
      <p class="text-sm text-fg-muted">Tarinaa ei saatu haettua.</p>
      <button
        type="button"
        class="btn-quiet"
        onclick={() => app.select(place.id)}
      >
        <Icon
          icon="ph:arrow-clockwise"
          class="size-5"
          aria-hidden="true"
        />Yritä uudelleen
      </button>
    </div>
  {/if}
{/if}

{#if facts.length}
  <dl class="mt-4 grid grid-cols-2 gap-4">
    {#each facts as fact (fact.label)}
      <div class={[fact.wide && "col-span-2"]}>
        <dt class="text-sm text-fg-muted">{fact.label}</dt>
        <dd class="mt-1">{fact.value}</dd>
      </div>
    {/each}
  </dl>
{/if}
<p class="mt-4 text-xs text-fg-muted">Lähde: {sources}</p>

{#if app.story?.oldPhotos.length}
  <section class="mt-6" aria-labelledby="old-t">
    <h3 id="old-t">Tältä se näytti ennen</h3>
    <ul class="-mx-gutter mt-2 flex gap-3 overflow-x-auto px-gutter pb-2">
      {#each app.story.oldPhotos as photo, i (i)}
        <li class="w-40 flex-none">
          <figure>
            <img
              src={photo.url}
              alt={photo.title ?? `${place.name}, vanha valokuva`}
              loading="lazy"
              class="h-32 w-full rounded-control bg-sunken object-cover"
            />
            <figcaption class="mt-1 text-xs text-fg-muted">
              {#if photo.year}<span class="block font-semibold text-fg"
                  >{photo.year}</span
                >{/if}
              {#if photo.linkUrl}
                <a href={photo.linkUrl} target="_blank" rel="noopener"
                  >{photo.credit}</a
                >
              {:else}
                {photo.credit}
              {/if}
            </figcaption>
          </figure>
        </li>
      {/each}
    </ul>
  </section>
{/if}

<div class="mt-5 flex flex-wrap gap-2">
  <button
    type="button"
    class="btn-secondary flex-1"
    aria-pressed={found}
    onclick={() => finds.toggle(place)}
  >
    {#if found}<Icon
        icon="ph:check-circle"
        class="size-5"
        aria-hidden="true"
      />{/if}Kävin täällä
  </button>
  {#if readMore}
    <a href={readMore} target="_blank" rel="noopener" class="btn-quiet">
      <Icon icon="ph:arrow-up-right" class="size-5" aria-hidden="true" />Lue
      lisää<span class="sr-only">, avautuu uuteen välilehteen</span>
    </a>
  {/if}
</div>
</div>
