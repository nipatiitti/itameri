import type { SourceEntry } from '$lib/types';

// content-worker owns this file. Shown on /tietoa.
export const SOURCES: SourceEntry[] = [
	{
		name: 'OpenStreetMap',
		description: 'Paikat, nimet ja kuvaukset',
		url: 'https://www.openstreetmap.org',
		licence: '© OpenStreetMap contributors, ODbL'
	},
	{
		name: 'OpenFreeMap',
		description: 'Karttapohja',
		url: 'https://openfreemap.org',
		licence: '© OpenFreeMap, © OpenMapTiles, © OpenStreetMap contributors'
	},
	{
		name: 'Wikipedia ja Wikimedia Commons',
		description: 'Tarinat ja kuvat',
		url: 'https://fi.wikipedia.org',
		licence: 'CC BY-SA 4.0, kuvien lisenssi kuvan yhteydessä'
	},
	{
		name: 'Finna',
		description: 'Museoiden ja arkistojen kuvat',
		url: 'https://www.finna.fi',
		licence: 'Lisenssi kuvan yhteydessä'
	}
];
