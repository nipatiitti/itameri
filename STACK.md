# STACK.md: how we build

Single source for the toolchain and code conventions. Agent rules are in CLAUDE.md, data sources
in APIS.md, facts in DOMAIN.md.

## 1. Scaffold (tested 7 Oct 2026)

`sv` 1.x scaffolds SvelteKit 3, released 1 Oct 2026, after the models' training data; it renames
`$lib` to `#lib`, `$app/environment` to `$app/env`, removes `$app/stores`, moves config. `sv`
0.17.1 (19 Sept) still scaffolds **SvelteKit 2.63** with Svelte 5.57, Vite 8, Tailwind 4.3 and
`$lib` intact. We pin 0.17.1. Fully non-interactive, ~7 s plus install:

```sh
pnpm dlx sv@0.17.1 create itameri --template minimal --types ts \
  --add tailwindcss="plugins:none" ai-tools="ide:claude-code+delivery:plugin" \
  --install pnpm --no-dir-check --no-download-check
```

- `ai-tools="ide:claude-code+delivery:plugin"` writes `.claude/settings.json` registering the
  `sveltejs/ai-tools` marketplace and enabling the `svelte` plugin (Svelte MCP + skill); it
  installs when the folder is trusted in Claude Code. Do not pass `tools:` or `mcpSetup:` with
  `delivery:plugin`, the CLI rejects them.
- Adapter stays the default `adapter-auto`. `pnpm build` prints "Could not detect a supported
  production environment" and succeeds; `pnpm preview` serves it (tested, 200). Dynamic routes
  work. No adapter-static, no prerender config.
- Node: Vite 8 needs 20.19+ or 22.12+.
- After scaffolding: `pnpm add maplibre-gl @iconify/svelte` (plus `pmtiles`, `d3-scale` as
  needed), add `src/routes/+layout.ts` with `export const ssr = false;`, then `git init`. The
  lead installs the design system's three files from the artifact (section 2).

## 2. Generated layout (differs from older SvelteKit 2 templates)

The design system is the Itämeri artifact, https://claude.ai/artifact/1uvkVvur2xa4FDDphRGxRT,
read with the Artifact tool (`action: "read"`, `path: "project/<file>"`). Three of its code
blocks are installed into the project by the lead; everything else is read from it live.

```
vite.config.ts            SvelteKit config lives HERE (adapter, compilerOptions). No svelte.config.js.
src/app.html              REPLACED by the html block in the artifact's project/tailwind.md (fonts, viewport-fit, theme-color)
src/routes/+layout.svelte imports './layout.css' and the favicon from $lib/assets; becomes the AppShell card
src/routes/layout.css     REPLACED by the css block in project/tailwind.md: the whole Itämeri theme (@theme static +
                          @utility components). There is NO src/app.css. Never edit its values.
src/lib/map-colors.ts     the ts block in the artifact's project/map.md: the map's only colour source
src/routes/+layout.ts     `export const ssr = false;` (we add it)
src/routes/+page.svelte
src/lib/                  $lib alias works
.claude/settings.json     from ai-tools; merge AGENT_SETUP.md section 2 into it, keep the plugin keys
tsconfig.json             extends ./.svelte-kit/tsconfig.json
```

Project structure we add: `src/lib/types.ts` (shared shapes, lead-owned), `src/lib/state/*.svelte.ts`
(app state), `src/lib/data/` (loaders and transforms), `src/lib/components/`, `src/lib/content/`
(copy, facts, `sources.ts` for attributions), `src/lib/map/` (only with a map), `static/data/`.
The design system itself stays in its artifact and is read from there.

## 3. Rendering: client-only

`export const ssr = false;` in the root `+layout.ts`. Consequences: no `browser` guards, no
hydration mismatches, `window`, `localStorage` and MapLibre can be used anywhere at module level,
module-level state singletons are safe (nothing is shared between requests because there is no
server render). `+page.ts` `load` still runs, in the browser. `pnpm preview` serves an empty shell
that renders on load, which is fine for judges running locally.

## 4. State: classes in `.svelte.ts` files

Svelte 5.57 supports runes in `.svelte.ts` / `.svelte.js` modules, including class fields. This is
our app-level state and the replacement for stores and for most context use:

```ts
// src/lib/state/app.svelte.ts
import type { Item } from "$lib/types";
export class AppState {
  items = $state<Item[]>([]);
  selectedId = $state<string | null>(null);
  query = $state("");
  selected = $derived(this.items.find((i) => i.id === this.selectedId) ?? null);
  visible = $derived(
    this.items.filter((i) =>
      i.name.toLowerCase().includes(this.query.toLowerCase()),
    ),
  );
  select(id: string | null) {
    this.selectedId = id;
  }
  async load() {
    this.items = await (await fetch("/data/items.json")).json();
  }
}
export const app = new AppState(); // one instance, safe because ssr = false
```

```svelte
<script lang="ts">
  import { app } from '$lib/state/app.svelte';   // no .ts extension in the import
</script>
<ul>{#each app.visible as item (item.id)}<li><button onclick={() => app.select(item.id)}>{item.name}</button></li>{/each}</ul>
```

Rules: one class per concern (`app`, `map`, `quiz`), exported as a module-level instance; read
fields through the instance (`app.selected`), never destructure them into locals (that copies
the value and loses reactivity); `$derived` for anything computed; `$effect` only inside
components, or `$effect.root` if a class must own one; use `setContext`/`getContext` only for a
per-instance object such as a MapLibre map handed to child layers, or pass it as a prop.
`localStorage` persistence: one `persisted<T>(key, initial)` helper in `src/lib/state/persisted.svelte.ts`
that wraps `$state` and writes on change; no cookies.

## 5. Svelte 5.57 and SvelteKit 2.63 conventions

- Runes only: `$state`, `$state.raw` for big immutable data (GeoJSON), `$derived`, `$derived.by`,
  `$effect`, `$props`, `$bindable`. No `export let`, no `on:click` (use `onclick`), no
  `createEventDispatcher` (callback props), no `$:`.
- `{@attach}` for DOM-bound libraries, `{@render children()}` in layouts, snippets for repeated
  markup, `class={[...]}` arrays for conditional classes.
- `$app/state` for `page.url`, `page.params`, `navigating` (no `$` prefix). `goto` from
  `$app/navigation`. `resolve()` from `$app/paths` for hrefs is optional; plain `/path` works.
- Imperative components (popups): `mount(Component, { target, props })` and `unmount` from `svelte`.
- Tailwind v4 with the Itämeri theme: component utilities (`card`, `btn-primary`, …), role colours
  (`bg-surface`, `text-fg`), named spacing (`px-gutter`, `h-bar`, `pb-dock`, `size-tap`), widths
  (`max-w-content`, `max-w-wide`, `w-panel`), two radii (`rounded-control`, `rounded-card`), one
  shadow (`shadow-float`). Defaults are wiped. No `tailwind.config.js`. Cheat sheet at the end of
  the artifact's `project/tailwind.md`. Verified to compile on this scaffold.
- Data loading: static files from `static/data` with `fetch('/data/x.json')` in a state class
  `load()` or in `+page.ts`. External data is cached into `static/data` by a one-off node script
  run by the lead, unless it is live by nature (AIS, weather, citizen observations).
- Fonts load from the Google Fonts link in the installed `app.html`. Icons: Phosphor via
  `@iconify/svelte` (`<Icon icon="ph:map-trifold" class="size-6" aria-hidden="true" />`), names
  from the system's `project/README.md`.

## 6. Maps: MapLibre in Svelte 5

Decisions: basemap **OpenFreeMap** `https://tiles.openfreemap.org/styles/positron` (the design
system asks for the lightest, label-light style; `liberty` and `bright` exist if detail is needed):
no key, open CORS, glyphs and sprites included. After load set the background to `MAP.water`
and keep basemap colours out of the UI. Map container per the MapHUD card:
`fixed inset-x-0 top-bar bottom-dock md:bottom-0`. Whole-Baltic start view
`center: [19.5, 59.5], zoom: 4.5` on a phone, 5 on desktop; Finland `[23, 61.5], 5`. Data as
GeoJSON in `static/data`, fetched once. Our own nautical chart tiles exist but are a special
case, see APIS.md Part D.

```svelte
<script lang="ts">
  import maplibregl from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css';
  let { onready }: { onready?: (m: maplibregl.Map) => void } = $props();
  let map = $state.raw<maplibregl.Map>();
  let loaded = $state(false);
  const attachMap = (el: HTMLDivElement) => {
    const m = new maplibregl.Map({
      container: el,
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: [19.5, 59.5], zoom: 4.5, attributionControl: false
    });
    m.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    m.on('load', () => { map = m; loaded = true; onready?.(m); });
    return () => { loaded = false; m.remove(); };
  };
</script>
<div class="absolute inset-0" {@attach attachMap}></div>
{#if loaded && map}<MapLayers {map} />{/if}
```

Rules that saved us before:

- `{@attach}` returns the cleanup. Never create the map in `onMount` plus `$effect` both.
- Child layer components mount only after `load`; each `$effect` that adds a source/layer returns
  a cleanup that removes layer then source. Guard with `map.getSource(id)` before adding.
- GeoJSON overlays: one source per dataset, `type: 'geojson', data: '/data/x.geojson'` (file in
  `/static/data`). Update with `(map.getSource(id) as GeoJSONSource).setData(fc)`.
- Popups: `new maplibregl.Popup().setDOMContent(el)` and `mount(Component, { target: el, props })`
  from `svelte`; `unmount` on close. Simpler: render a Svelte side panel from a `$state` selected
  feature instead of popups.
- Markers: `new maplibregl.Marker({ element }).setLngLat(..).addTo(map)` (setLngLat before addTo).
- Map paints can't read CSS vars; every colour comes from `src/lib/map-colors.ts` (`MAP`, `STATUS`,
  `ALGAE`, `FILL_OPACITY`, Finnish labels). Paint expressions for status fills, selection outline
  and algae circles are ready in the artifact's `project/map.md`.
- Numeric props stored as strings: `['to-number', ['get', 'DRVAL1']]`.
- Raster overlay: `{ type: 'raster', tiles: [url], tileSize: 256, attribution }` then a `raster`
  layer with `raster-opacity`.
- PMTiles: `import { Protocol } from 'pmtiles'; maplibregl.addProtocol('pmtiles', new Protocol().tile)`
  then `url: 'pmtiles://https://...'`.
- Mobile: full-screen map with an `absolute inset-0 pointer-events-none` overlay; interactive HUD
  children get `pointer-events-auto`. Viewport meta `maximum-scale=1` stops iOS input zoom.
- Attribution strings per source are listed in APIS.md Part D.

## 7. Charts

Use `layerchart` (Svelte 5 native, built on d3) or plain d3 + svg in a component. For one or two
charts, hand-rolled SVG with `scaleLinear` from `d3-scale` is fastest and has no setup risk.
