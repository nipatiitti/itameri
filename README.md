# Arjen aarteet

**Suomeksi lyhyesti.** Arjen aarteet on löytöretki omaan lähiympäristöösi. Kartta näyttää lähelläsi
olevat nimetyt puut, muistomerkit, muinaisjäännökset, majakat, hylyt, näköalat ja muut pienet
ihmeet, ja jokaisesta paikasta kuvan ja tarinan. Paina Yllätä minut, niin kartta vie sinut
satunnaiseen aarteeseen läheltäsi. Retki-välilehdellä valitset tunnelman, kulkutavan, keston ja
lähtöpaikan, ja sovellus suunnittelee sinulle kierroksen parhaiden paikkojen kautta. Kun olet
käynyt paikalla, paina Kävin täällä, niin löytö tallentuu selaimeesi. Sovellus toimii kokonaan
selaimessa, eikä se tarvitse kirjautumista tai avaimia.

---

Arjen aarteet ("everyday treasures") is a browser-only map of hidden gems in your everyday
surroundings: named trees, small memorials, ancient monuments, lighthouses, shipwrecks, viewpoints
and other quiet curiosities, built on OpenStreetMap data and the Finnish Heritage Agency's ancient
monuments register. Open any place and the app fetches a photo and a short story for it from
Wikipedia, Wikidata, Wikimedia Commons and Finna, including old photographs of the same spot when
they exist. The **Retki** tab plans a short adventure loop through the best places around a start
point you choose. It was built for the Softamestari 2026 qualifier, theme Löytöretki (expedition),
with John Nurmisen Säätiö as the theme partner.

## The demo moment

Press **Yllätä minut** ("Surprise me"). The map flies to a random place near you and opens its card
with a picture and a story. Often it is something you have walked past a hundred times without
noticing: a cup-marked stone, a named oak, a boundary stone, marked **Harvinainen** ("rare") when
its kind is uncommon. Scroll down and **Näin se näytti ennen** shows how the place looked decades
ago, from museum photo archives.

Then open **Retki**, answer four one-tap questions, and the app draws an afternoon's loop through
the most interesting places nearby.

## Run it

Requirements: Node 22 (22.12 or newer) and pnpm.

```sh
pnpm install
pnpm dev
```

Open the URL that `pnpm dev` prints (usually http://localhost:5173).

Production build:

```sh
pnpm build && pnpm preview
```

The project uses SvelteKit's `adapter-auto`, so the build may print that no deployment target was
detected. The preview still works.

There is no backend, no database and no API key. The place data ships as static files in
`static/data`. An internet connection is still needed for the map tiles, place search, and the
photos and stories, which are fetched live when you open a place.

## Features

The app has four tabs: **Kartta** (map), **Retki** (trip planner), **Löydöt** (finds) and
**Tietoa** (about).

- Map of eight kinds of places, each switchable with a chip: parks and quiet places, memorials and
  art, historic buildings, ancient monuments, named trees and natural wonders, lighthouses and the
  sea (including 702 shipwrecks from the Museovirasto register), viewpoints, and oddities.
- **Vain harvinaiset** ("rare only"): a star toggle on the map that shows only rare finds.
- Place search by name or address, powered by OpenStreetMap Nominatim.
- A list of nearby places sorted by distance.
- A place card with a photo, a short story, plain facts from the data (built, inscription, species,
  dating and so on), a link to read more (Wikipedia, or the Museovirasto kyppi.fi page for wrecks
  and ancient monuments), and the source of every photo and text.
- Old photographs of the spot from Finna museum and archive collections, free licences only.
- A **Harvinainen** badge for places whose kind is uncommon in the data.
- **Yllätä minut**: one tap picks a random place near you, widening the search if nothing is close.
- **Retki**: an adventure planner, described below.
- **Kävin täällä**: mark a place as found. Finds are kept in your browser (localStorage) and listed
  on the **Löydöt** page. Nothing leaves your device.
- Location is asked only when you tap the locate button. Without it the map starts in Helsinki.
- Finnish UI, designed phone first.

## Retki: the adventure planner

A four-step wizard, one tap per step:

1. **Mood**: calm (Rauhoittumista), urban curiosities (Kaupungin kummallisuuksia), hidden in the
   woods (Metsän kätköjä), by the sea (Meren ääreen) or traces of history (Historian jälkiä). Each
   mood maps to three place categories.
2. **Transport**: walking, cycling or driving.
3. **Duration**: about an hour, a couple of hours or half a day. Together with the transport this
   sets the search radius and the number of stops (4 to 9).
4. **Start point**: move the map under a crosshair, search for a place, or use your location.

The app then plans a loop that starts and ends at your start point. Places are scored by rarity,
whether a story or photo is available, and distance from the start, with a cap per category so
the trip stays varied and no two stops closer than about 80 m. The stops are ordered with a
nearest-neighbour pass and then improved with 2-opt to shorten the loop. The trip page shows the
stops, the length of the loop, and an estimated time. The first estimate is a straight-line sketch
at a typical speed for the transport (walking 4.5 km/h, cycling 15 km/h, driving 40 km/h) plus
10 minutes per stop. The app then asks the public Valhalla routing server run by FOSSGIS
(valhalla1.openstreetmap.de, no key) for a real route on paths and roads with the matching
profile, draws it on the map, and replaces the length and time with Valhalla's figures. If the
server is slow or unreachable, the straight-line loop stays.

Trips are saved in your browser. You can re-plan a trip with the same answers, rename it, delete
it, or show it on the main map, where it is drawn as a dashed loop with numbered stops.

**The route is a sketch, not turn-by-turn directions.** Without the routing server the line
crosses water, buildings and private land. It is not for navigation.

## Data sources and licences

| Source | Used for | Licence |
| --- | --- | --- |
| [OpenStreetMap](https://www.openstreetmap.org/copyright) | Places, names and facts (static extracts) | © OpenStreetMap contributors, ODbL |
| [OpenFreeMap](https://openfreemap.org) | Basemap (positron style) | © OpenFreeMap, © OpenMapTiles, © OpenStreetMap contributors |
| [Nominatim](https://nominatim.org) | Place search, live, one request per submitted search (usage policy: at most 1 request per second) | © OpenStreetMap contributors, ODbL |
| [Museovirasto](https://www.museovirasto.fi) (Finnish Heritage Agency) | Ancient monuments register: ancient sites | Museovirasto, CC BY 4.0 |
| [Museovirasto](https://www.museovirasto.fi) (Finnish Heritage Agency) | Ancient monuments register: 702 shipwrecks, each linked to its kyppi.fi page | Museovirasto, CC BY 4.0 |
| [Wikipedia](https://fi.wikipedia.org) | Stories (Finnish first, then Swedish and English) | CC BY-SA 4.0 |
| [Wikidata](https://www.wikidata.org) | Identifiers and image links | CC0 |
| [Wikimedia Commons](https://commons.wikimedia.org) | Photos | Per image, shown with the image |
| [Finna](https://www.finna.fi) | Historical photos from Finnish museums and archives | Per record, free licences only (CC0, PDM, CC BY), shown with the organisation |

The same attributions appear in the app on the **Tietoa** page, and every photo carries its own
credit line and link.

### How a place gets its photo

The app tries these in order and stops at the first hit: the image tag on the OpenStreetMap object,
the Wikidata image (P18), the Wikipedia page summary, a Wikimedia Commons photo taken within about
150 m, and a Finna photo near the spot. If none exists, the card shows a neutral placeholder.

## How the static extracts were made

The places come from Node scripts that are run once, not from live Overpass queries:

```sh
node scripts/fetch-places.mjs
```

It queries the OpenStreetMap Overpass API for each category, with mirror fallback and retries, and
the Museovirasto ancient monuments register (WFS), within a bounding box over southern and central
Finland (latitude 59.5 to 66, longitude 19 to 31), clipped to a rough outline of Finland. It writes
one GeoJSON file per category to `static/data/<category>.geojson`, with a name for every place, a
rarity flag and a small set of tags. After that the app never calls Overpass, so filtering is
instant and the map cannot break when an Overpass server is busy. If a category file is missing,
only that category disappears.

```sh
node scripts/fetch-wrecks.mjs
```

This fetches the shipwrecks (register type "hylky") from the Museovirasto register and merges them
into `static/data/maritime.geojson` without re-running Overpass. OpenStreetMap wrecks that duplicate
a register wreck are dropped. Metal and medieval wrecks are marked rare.

Re-run the scripts to refresh the data.

## Known limitations

- The data is crowd-sourced and collected by volunteers and museums. Places may be missing,
  misplaced or out of date, and coverage is uneven between towns.
- Coverage ends at latitude 66, so most of Lapland is not included.
- Wreck positions come from the register, and many wrecks are under water. They are heritage
  sites to read about, not dive sites to look for.
- Not every place has a photo or a story. Wikipedia and Commons rate-limit bursts of requests, so
  a story can occasionally fail to load. Try again a moment later.
- Some places are on private land or protected sites. Respect signs, landowners and the
  ancient monuments act; do not dig or move anything.
- Distances are straight lines, Retki routes come from a public routing server when it answers, and trip times are rough estimates. **Not for
  navigation** (Ei navigointikäyttöön).
- Finds and trips live only in this browser. Clearing site data removes them, and they do not
  sync between devices.

## Credits

Built for the **Softamestari 2026** qualifier, theme Löytöretki. Theme partner:
[John Nurmisen Säätiö](https://www.johnnurmisensaatio.fi), a foundation that works to save the
Baltic Sea and its maritime heritage.

Map data and place search © OpenStreetMap contributors. Basemap by OpenFreeMap and OpenMapTiles.
Heritage data and shipwrecks by Museovirasto. Stories and photos from Wikipedia, Wikidata,
Wikimedia Commons and Finna, each credited where it is shown.

Built with SvelteKit, Svelte 5, MapLibre GL and Tailwind CSS.
