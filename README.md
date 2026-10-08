# Arjen aarteet

**Suomeksi lyhyesti.** Arjen aarteet on löytöretki omaan lähiympäristöösi. Kartta näyttää lähelläsi
olevat nimetyt puut, muistomerkit, muinaisjäännökset, majakat, näköalat ja muut pienet ihmeet, ja
jokaisesta paikasta kuvan ja tarinan. Paina Yllätä minut, niin kartta vie sinut satunnaiseen
aarteeseen läheltäsi. Kun olet käynyt paikalla, paina Kävin täällä, niin löytö tallentuu
selaimeesi. Sovellus toimii kokonaan selaimessa, eikä se tarvitse kirjautumista tai avaimia.

---

Arjen aarteet ("everyday treasures") is a browser-only map of hidden gems in your everyday
surroundings: named trees, small memorials, ancient monuments, lighthouses, viewpoints and other
quiet curiosities, built on OpenStreetMap data and the Finnish Heritage Agency's ancient monuments
register. Open any place and the app fetches a photo and a short story for it from Wikipedia,
Wikidata, Wikimedia Commons and Finna, including old photographs of the same spot when they exist.
It was built for the Softamestari 2026 qualifier, theme Löytöretki (expedition), with John Nurmisen
Säätiö as the theme partner.

## The demo moment

Press **Yllätä minut** ("Surprise me"). The map flies to a random place near you and opens its card
with a picture and a story. Often it is something you have walked past a hundred times without
noticing: a cup-marked stone, a named oak, a boundary stone, marked **Harvinainen** ("rare") when
its kind is uncommon. Scroll down and **Näin se näytti ennen** shows how the place looked decades
ago, from museum photo archives.

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
`static/data`. An internet connection is still needed for the map tiles and for the photos and
stories, which are fetched live when you open a place.

## Features

- Map of eight kinds of places, each switchable with a chip: parks and quiet places, memorials and
  art, historic buildings, ancient monuments, named trees and natural wonders, lighthouses and the
  sea, viewpoints, and oddities.
- A list of nearby places sorted by distance.
- A place card with a photo, a short story, plain facts from the data (built, inscription, species,
  dating and so on), a link to read more, and the source of every photo and text.
- Old photographs of the spot from Finna museum and archive collections, free licences only.
- A **Harvinainen** badge for places whose kind is uncommon in the data.
- **Yllätä minut**: one tap picks a random place near you, widening the search if nothing is close.
- **Kävin täällä**: mark a place as found. Finds are kept in your browser (localStorage) and listed
  on the **Löydöt** page. Nothing leaves your device.
- Location is asked only when you tap the locate button. Without it the map starts in Helsinki.
- Finnish UI, designed phone first.

## Data sources and licences

| Source | Used for | Licence |
| --- | --- | --- |
| [OpenStreetMap](https://www.openstreetmap.org/copyright) | Places, names and facts (static extracts) | © OpenStreetMap contributors, ODbL |
| [OpenFreeMap](https://openfreemap.org) | Basemap (positron style) | © OpenFreeMap, © OpenMapTiles, © OpenStreetMap contributors |
| [Museovirasto](https://www.museovirasto.fi) (Finnish Heritage Agency) | Ancient monuments register | Museovirasto, CC BY 4.0 |
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

The places come from one Node script that is run once, not from live Overpass queries:

```sh
node scripts/fetch-places.mjs
```

It queries the OpenStreetMap Overpass API for each category, with mirror fallback and retries, and
the Museovirasto ancient monuments register (WFS), within a bounding box over southern and central
Finland (latitude 59.5 to 66, longitude 19 to 31). It writes one GeoJSON file per category to
`static/data/<category>.geojson`, with a name for every place, a rarity flag and a small set of
tags. After that the app never calls Overpass, so filtering is instant and the map cannot break
when an Overpass server is busy. If a category file is missing, only that category disappears.
Re-run the script to refresh the data.

## Known limitations

- The data is crowd-sourced and collected by volunteers and museums. Places may be missing,
  misplaced or out of date, and coverage is uneven between towns.
- Coverage ends at latitude 66, so most of Lapland is not included.
- Not every place has a photo or a story. Wikipedia and Commons rate-limit bursts of requests, so
  a story can occasionally fail to load. Try again a moment later.
- Some places are on private land or protected sites. Respect signs, landowners and the
  ancient monuments act; do not dig or move anything.
- Distances are straight-line distances. **Not for navigation** (Ei navigointikäyttöön).
- Finds live only in this browser. Clearing site data removes them, and they do not sync between
  devices.

## Credits

Built for the **Softamestari 2026** qualifier, theme Löytöretki. Theme partner: [John Nurmisen Säätiö](https://www.johnnurmisensaatio.fi), a
foundation that works to save the Baltic Sea and its maritime heritage.

Map data © OpenStreetMap contributors. Basemap by OpenFreeMap and OpenMapTiles. Heritage data by
Museovirasto. Stories and photos from Wikipedia, Wikidata, Wikimedia Commons and Finna, each
credited where it is shown.

Built with SvelteKit, Svelte 5, MapLibre GL and Tailwind CSS.
