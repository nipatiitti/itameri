# Lead state (re-injected after compaction)

## Concept
Löytöretki: a map that shows the special in the mundane. OSM hidden gems (named trees, memorials,
ancient sites, viewpoints, maritime marks, artworks, parks, historic buildings) on an OpenFreeMap
basemap. Tap a place: sheet with photo and story from Wikipedia/Wikidata/Commons/Finna. "Yllätä minut"
picks a random place near you and flies there. "Kävin täällä" saves it to Löydöt (localStorage).
Nav: Kartta (/), Löydöt (/loydot), Tietoa (/tietoa). UI language Finnish. Service name "Löytöretki".

## Contracts (lead-owned, done)
- src/lib/types.ts: Category, Place, PlaceProps, PlaceCollection, Story, LoadStatus, LngLat, Find, SourceEntry
- src/lib/state/app.svelte.ts: app.places/status/active/selectedId/selected/visible/story/storyStatus, load(), select(id), toggleCategory, surprise(from)
- src/lib/state/map.svelte.ts: map.center/zoom/here/fly, flyTo(), locate(), origin (map-worker may extend)
- src/lib/state/finds.svelte.ts: finds.list/count/has/add/remove/toggle
- src/lib/data/geo.ts: distanceM, formatDistance
- Layout + nav done, About page done (lead). Design system installed (app.html, layout.css, map-colors.ts).

## Ownership
- data-worker: scripts/fetch-places.mjs, static/data/places.geojson, src/lib/data/places.ts, src/lib/data/story.ts
- map-worker: src/lib/map/**, src/lib/state/map.svelte.ts
- ui-worker: src/routes/+page.svelte, src/routes/loydot/+page.svelte, src/lib/components/**
- content-worker: src/lib/content/**, README.md
- lead: everything else (types, layout, tietoa page, app/finds state, git)

## Decisions
- Static Overpass extract (coastal Finland bbox 59.5,19,66,31) shipped in static/data; stories live.
- Points all MAP.select colour; no category colours (design system has no categorical scale).
- One primary button per screen: "Yllätä minut" on map page; sheet buttons are secondary.
- Start view Helsinki zoom 13; geolocation only on tap.

## Timeline
17:03 start · 17:25 contracts + dispatch · ~18:00 skeleton on screen · 19:20 feature freeze · 19:30 build · 19:45 zip
