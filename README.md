# Arjen aarteet

Päivittäin ihmiset kävelevät ohi historiallisista muinaisjäänteistä, mielenkiintoisista plakaateista ja arvokkaista taideteoksista, edes tiedostamatta niitten olemassa oloa. Nämä täynnä tarinoita olevat asiat, ovat ns. "Arjen aarteita". Kulttuurillisesti merkittäviä kohteita, joita kuka vaan voi ihailla koska vaan, mutta joiden olemassa olosta liian harva tietää.

Tämän sovelluksen ideana on tarjota jokaiselle mahdollisuus irtaantua arjestaan pieneksi hetkeksi, löytää mielenkiintoinen tarina, hiljainen puisto tai ajatuksia herättävä urbaani taideteos. Oli se sitten keskellä metsää tai kaupungin keskustassa.

Arjen aarteet on pelkästään selaimessa toimiva kartta, joka rakentuu OpenStreetMapin datasta ja Museoviraston muinaisjäännösrekisteristä. Avaa mikä tahansa kohde, niin sovellus hakee sille kuvan ja lyhyen tarinan Wikipediasta, Wikidatasta, Wikimedia Commonsista ja Finnasta, mukaan lukien vanhat valokuvat samasta paikasta, kun niitä on. **Retki**-välilehti suunnittelee lyhyen seikkailulenkin parhaiden kohteiden kautta valitsemasi lähtöpisteen ympärillä. Sovellus tehtiin Softamestari 2026 -karsintaan teemalla Löytöretki, teemakumppanina John Nurmisen Säätiö.

**Unohda murheet ja hyppää Arjen Aarteiden Löytöretkelle!**

---

Every day people walk past ancient remains, curious plaques and valuable works of art without
knowing they are there. These things, full of stories, are what we call "everyday treasures":
culturally significant places anyone can admire at any time, but that too few know exist.

The idea of this app is to give everyone a chance to step out of the everyday for a moment and
find an interesting story, a quiet park or a thought-provoking piece of urban art, whether in the
middle of a forest or in a city centre.

Arjen aarteet is a browser-only map built on OpenStreetMap data and the Finnish Heritage Agency's
ancient monuments register. Open any place and the app fetches a photo and a short story for it
from Wikipedia, Wikidata, Wikimedia Commons and Finna, including old photographs of the same spot
when they exist. The **Retki** tab plans a short adventure loop through the best places around a
start point you choose. It was built for the Softamestari 2026 qualifier, theme Löytöretki
(expedition), with John Nurmisen Säätiö as the theme partner.

**Forget your worries and set off on an expedition for everyday treasures!**

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
   mood maps to three place categories with weights; the lead category gets at least half the
   stops when enough are around.
2. **Transport**: walking, cycling, driving or by boat.
3. **Duration**: about an hour, a couple of hours or half a day. Together with the transport this
   sets the search radius and the number of stops (4 to 9).
4. **Start point**: move the map under a crosshair, search for a place, or use your location.

The app then plans a loop that starts and ends at your start point. Places are scored by rarity,
whether a story or photo is available, and distance from the start, with a cap per category so
the trip stays varied and no two stops closer than about 80 m. The stops are ordered with a
nearest-neighbour pass and then improved with 2-opt to shorten the loop. If the estimate still
exceeds the chosen duration, the stop with the longest detour is dropped until it fits. The trip page shows the
stops, the length of the loop, and an estimated time. The first estimate is a straight-line sketch
at a typical speed for the transport (walking 4.5 km/h, cycling 15 km/h, driving 40 km/h, boating 10 km/h) plus
10 minutes per stop. The app then asks the public Valhalla routing server run by FOSSGIS
(valhalla1.openstreetmap.de, no key) for a real route on paths and roads with the matching
profile, draws it on the map, and replaces the length and time with Valhalla's figures. If the
server is slow or unreachable, the straight-line loop stays. Legs that Valhalla can only route via a
long detour (a ferry to the mainland between two islets) are drawn as straight hops over the water.
By boat the loop is always straight lines, and shipwrecks can be stops.

Trips are saved in your browser. You can re-plan a trip with the same answers, rename it, delete
it, share it, or show it on the main map, where it is drawn as a loop with numbered stops and the
other places are hidden. **Aloita retki** opens the first stop, and the place card then steps
through the stops in order. A share link carries the whole trip in its address, so it opens on any
device without a server.

## Data sources and licences

| Source                                                                 | Used for                                                                                          | Licence                                                                       |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [OpenStreetMap](https://www.openstreetmap.org/copyright)               | Places, names and facts (static extracts)                                                         | © OpenStreetMap contributors, ODbL                                            |
| [OpenFreeMap](https://openfreemap.org)                                 | Basemap (positron style)                                                                          | © OpenFreeMap, © OpenMapTiles, © OpenStreetMap contributors                   |
| [Nominatim](https://nominatim.org)                                     | Place search, live, one request per submitted search (usage policy: at most 1 request per second) | © OpenStreetMap contributors, ODbL                                            |
| [Museovirasto](https://www.museovirasto.fi) (Finnish Heritage Agency)  | Ancient monuments register: ancient sites                                                         | Museovirasto, CC BY 4.0                                                       |
| [Museovirasto](https://www.museovirasto.fi) (Finnish Heritage Agency)  | Ancient monuments register: 702 shipwrecks, each linked to its kyppi.fi page                      | Museovirasto, CC BY 4.0                                                       |
| [Wikipedia](https://fi.wikipedia.org)                                  | Stories (Finnish first, then Swedish and English)                                                 | CC BY-SA 4.0                                                                  |
| [Wikidata](https://www.wikidata.org)                                   | Identifiers and image links                                                                       | CC0                                                                           |
| [Wikimedia Commons](https://commons.wikimedia.org)                     | Photos                                                                                            | Per image, shown with the image                                               |
| [Finna](https://www.finna.fi)                                          | Historical photos from Finnish museums and archives                                               | Per record, free licences only (CC0, PDM, CC BY), shown with the organisation |
| [Valhalla public server](https://valhalla.openstreetmap.de) by FOSSGIS | Retki routes on paths and roads, live, no key                                                     | FOSSGIS e.V., routes from OpenStreetMap data, ODbL                            |
| [kyppi.fi](https://www.kyppi.fi) (Museovirasto)                        | Descriptions of ancient monuments and wrecks, fetched once by script                              | Museovirasto, CC BY 4.0                                                       |

The same attributions appear in the app on the **Tietoa** page, and every photo carries its own
credit line and link.

### How a place gets its photo

The app tries these in order and stops at the first hit: the image tag on the OpenStreetMap object,
the Wikidata image (P18), the Wikipedia page summary, and a Wikimedia Commons photo taken within
about 100 m whose title or description mentions the place. Finna photos are shown only when the
record's own location lies at the spot. If nothing matches, the card simply has no photo; a wrong
picture is worse than none.

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
  sync between devices. A trip can be moved with its share link.
- The routing server is a public, fair-use service. A burst of trips in a row can be rate-limited,
  in which case the loop stays a straight-line sketch.

## Credits

Built for the **Softamestari 2026** qualifier, theme Löytöretki. Theme partner:
[John Nurmisen Säätiö](https://www.johnnurmisensaatio.fi), a foundation that works to save the
Baltic Sea and its maritime heritage.

Map data and place search © OpenStreetMap contributors. Basemap by OpenFreeMap and OpenMapTiles.
Heritage data, descriptions and shipwrecks by Museovirasto. Stories and photos from Wikipedia,
Wikidata, Wikimedia Commons and Finna, each credited where it is shown. Routes by the Valhalla
public server run by FOSSGIS.

Built with SvelteKit, Svelte 5, MapLibre GL and Tailwind CSS.
