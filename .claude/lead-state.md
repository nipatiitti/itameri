# Lead state (re-injected after compaction)

## Concept
Arjen aarteet: a map that shows the special in the mundane. OSM hidden gems (named trees, memorials,
ancient sites, viewpoints, maritime marks, artworks, parks, historic buildings) on an OpenFreeMap
basemap. Tap a place: sheet with photo and story from Wikipedia/Wikidata/Commons/Finna. "Yllätä minut"
picks a random place near you and flies there. "Kävin täällä" saves it to Löydöt (localStorage).
Nav: Kartta (/), Löydöt (/loydot), Tietoa (/tietoa). UI language Finnish. Service name "Arjen aarteet".

## Contracts (lead-owned, done)
- src/lib/types.ts: Category, Place, PlaceProps, PlaceCollection, Story, LoadStatus, LngLat, Find, SourceEntry
- src/lib/state/app.svelte.ts: app.places/status/active/selectedId/selected/visible/story/storyStatus, load(), select(id), toggleCategory, surprise(from)
- src/lib/state/map.svelte.ts: map.center/zoom/here/fly, flyTo(), locate(), origin (map-worker may extend)
- src/lib/state/finds.svelte.ts: finds.list/count/has/add/remove/toggle
- src/lib/data/geo.ts: distanceM, formatDistance
- Layout + nav done, About page done (lead). Design system installed (app.html, layout.css, map-colors.ts).

## Ownership
- data-worker: scripts/fetch-places.mjs, static/data/<category>.geojson (8 files), src/lib/data/places.ts, src/lib/data/story.ts
- map-worker: src/lib/map/**, src/lib/state/map.svelte.ts
- ui-worker: src/routes/+page.svelte, src/routes/loydot/+page.svelte, src/lib/components/**
- content-worker: src/lib/content/**, README.md
- lead: everything else (types, layout, tietoa page, app/finds state, git)

## Decisions
- Static extracts per category in static/data: Overpass (coastal Finland bbox 59.5,19,66,31) and Museovirasto muinaisjäännökset; stories and photos live (OSM image → Wikidata P18 → Wikipedia summary → Commons geosearch → Finna radius → placeholder).
- Points all MAP.select colour; no category colours (design system has no categorical scale).
- One primary button per screen: "Yllätä minut" on map page; sheet buttons are secondary.
- Start view Helsinki zoom 13; geolocation only on tap.

## Timeline
17:03 start · 17:25 contracts + dispatch · ~18:00 skeleton on screen · 19:20 feature freeze · 19:30 build · 19:45 zip
- IDEA.md adopted: name Arjen aarteet, rarity flag, nearby list in the sheet, Finna old-photo strip. Retki mode only if time.
- Gotcha: maplibre-gl.css is unlayered and forces position:relative on the map div; size it with h-full w-full, not absolute inset-0. maplibre 6.13 needs setWorkerUrl with a Vite ?worker&url import (done in PlacesMap).

## Retki planner (18:15 decision)
New tab Retki (/retki list, /retki/uusi wizard, /retki/[id] detail). Contracts: types.ts (Mood, Transport, Duration, TripPlan, Trip),
src/lib/content/trip.ts (MOOD_META with categories, TRANSPORT_META, DURATION_META, BUDGET), src/lib/data/route.ts (planTrip, loopLength,
formatMinutes), src/lib/state/trips.svelte.ts (trips.list/active/activeId/create/reroll/rename/remove/stopsOf). map-worker: PickerMap.svelte
(bind:center, follows map.fly) and route line + numbered stops in PlacesMap from trips.active. ui-worker: the three pages + trip tag on map panel.
data-worker: Museovirasto wrecks into maritime. Nav icon ph:path (outside the design list, user-approved concept).

## 18:35 status (all committed, workers idle)
- Done since 18:15: wrecks (702) in maritime; Retki tab complete (list, wizard, detail, TripSheet on map, route layer, PickerMap);
  phone sheet 3 modes (full/header/pill) at page level in +page.svelte; "Yllätä minut" hidden while a place or trip is selected;
  rare filter = star button; search expands in place; README + About cover Retki/wrecks/Nominatim.
- Route fit: planTrip trims stops (largest detour first, min 2) until minutes <= duration × 1.15.
- Known risks: phone pill overlaps top of close button slightly; Lapland (lat > 66) not in extract; Nominatim rate limit not enforced.
- Remaining: user browser pass of Retki + sheet → fixes → 19:20 freeze → pnpm build once (~19:30) → zip without node_modules/.svelte-kit (19:45).
- 18:45 user decision: the design system's no-animation rule is scrapped; Svelte fly/scale transitions allowed (sheet content, wizard steps, trip cards).
- Trip ↔ map contract: trips.show(id) = draw + fit; trips.activeId = draw only; trips.fit() refit. PlaceSheet gets `stepper` when the open place is a stop of the active trip (Edellinen/Seuraava, Kohde n/total); closing a stop refits the loop. TripSheet "Aloita retki" opens stop 1.
- 19:00 Routing: Valhalla FOSSGIS (src/lib/data/routing.ts), trips.refine(id) fills trips.shapes and overwrites lengthM/minutes with real values; map draws shape when present, straight ring otherwise. Moods have weights; lead category gets ≥ half the stops; wrecks never routed to.
- 19:12 Transport 'boat' (Veneellä, 10 km/h, straight lines, wrecks allowed). Per-leg detour check: leg > max(3×straight, straight+1.5 km) → straight hop.
- 19:25 Kyppi descriptions: scripts/fetch-kyppi.mjs bakes `kuvaus` into ancient/maritime geojson (no CORS on kyppi, so fetched once). story.ts baseStory and PlaceSheet prefer tags.kuvaus. Routing fallback is sequential (429 on bursts).
