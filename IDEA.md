The pitch in one line
Arjen aarteet: an expedition map that surfaces the remarkable within walking distance, with a picture and a story for every find.

Categories and where they come from

Chip Source Reliability
Puistot ja hiljaiset paikat OpenFreeMap tiles: park, landuse cemetery and allotments, poi class garden. No API call at all. Solid
Muistomerkit ja taide Tiles poi class monument plus Overpass historic=memorial, tourism=artwork Tiles solid, Overpass garnish
Historialliset rakennukset Museovirasto RKY areas (probed, open CORS) plus OSM historic=\* and buildings with start_date Solid via Museovirasto
Muinaisjäännökset Museovirasto muinaisjaannos_piste with tyyppi and alatyyppi: hautaröykkiöt, uhrikivet, kuppikivet, seidat, linnavuoret, tarinapaikat. The same layer gave us the 708 wrecks, so it is already probed with open CORS and bbox queries. Solid, and this is the category nobody else will have
Nimetyt puut ja luonnonihmeet Overpass: natural=tree with a name, natural=spring, glacial erratics (natural=stone, geological=glacial_erratic), natural=cave_entrance Overpass only
Majakat ja meri Väylävirasto loistot_uusi (probed), OSM man_made=lighthouse Solid
Näköalat OSM tourism=viewpoint, observation towers, peaks (tiles have mountain_peak) Mixed
Kummallisuudet Rare tags: boundary stones, milestones, wayside shrines, flagpoles, fountains, inscriptions Overpass only

The architectural call that makes this reliable: at 17:10 the lead runs one node script that pulls each Overpass category for all of Finland once, with mirror fallback and retries, into static/data/<category>.geojson. Named trees in Finland are a few thousand points, viewpoints a couple of thousand, so the files are small. After that the app never calls Overpass live. Filters become instant, offline-safe, and the demo cannot break mid-pitch. Museovirasto and Väylävirasto can stay live, since they held up in every probe, or get the same treatment if time allows.

Images from everywhere, as a fallback chain per POI

OSM image or wikimedia_commons tag, direct.
wikidata tag, then Wikidata P18 image, served via Commons Special:FilePath?width=640.
wikipedia tag, then Wikipedia REST summary in fi, sv, en: thumbnail plus the extract, which is also your “more info” text.
Commons geosearch within 150 m of the point, namespace 6, with origin=\*.
Finna radius search, free licences only: historical photos near the spot, with year and organisation. Probed, open CORS, and a second wow on its own (“this is what your park looked like in 1932”).
Panoramax street-level photos by bbox, keyless, worth a 10-second probe at kickoff.
Never blank: a paper-textured placeholder with the category icon.

Every image carries its licence line and a link, which the jury’s foundation-minded eyes will notice.

More info sheet
Wikipedia extract in Finnish first, the Museovirasto kyppi page for ancient sites, OSM tags rendered as plain facts (built, architect, height, inscription, description:fi), the Finna photos as a strip, “Avaa OpenStreetMapissa” and “Reittiohje” links. Everything resolves lazily when the card opens, so the map stays fast.

The three moves that create the wow

“Yllätä minut”: one tap, the map flies to a random find within two kilometres and the card opens with its picture. This is the demo moment and the literal expedition.
Rarity badge: rank finds by how uncommon the tag is in Finland (Taginfo counts, fetched once) and by whether a story exists. “Harvinainen” on a cup-marked stone 300 m from a judge’s office is the surprise.
Retki mode: pick up to five finds, the app orders them into a loop by distance and draws the line. No routing engine needed; a straight-line loop with distances is honest and enough.

Keep it simple
Map, a chip row of categories, a bottom sheet listing nearby finds sorted by distance, a card with image and two lines, the more-info sheet. Search by Nominatim or Photon, location by Geolocation with Helsinki centre as the fallback, state in the URL. The design system already has every one of those pieces.

Risks to name now

Overpass is the only fragile source, hence the prefetch at kickoff, and the app must degrade to tiles plus Museovirasto if a category file is missing.
The Museovirasto register is big; always query by bbox and cap the count.
Commons and Wikipedia rate-limit bursts, so resolve images only for visible cards and cache in memory.
Attribution for OSM, Museovirasto, Finna, Commons and the tile provider goes in the About view and on each image.

Draft IDEA block
Arjen aarteet: löytöretki omaan lähiympäristöön. Kartta näyttää valitsemasi aarrelajit lähelläsi (puistot, muistomerkit, historialliset rakennukset, muinaisjäännökset, nimetyt puut, majakat, näköalat, kummallisuudet), jokaisella kuva ja tarina. Demohetki: “Yllätä minut” lentää satunnaiseen harvinaiseen kohteeseen ja avaa kortin kuvineen; Finnan vanhat valokuvat samasta paikasta. MVP: kartta, kategoriachipit, lähellä-lista, kortti kuvalla, lisätiedot, Yllätä minut, jaettava URL. Data: OpenFreeMap-tiilet, Museovirasto, Väylävirasto suoraan; Overpass-kategoriat haetaan kerran skriptillä staattisiksi tiedostoiksi. Jätetään pois: reititys, pelillistäminen, Retki-tila (viimeisenä jos aikaa).
