import type { SourceEntry } from '$lib/types';

// content-worker owns this file. Shown on /tietoa. Licence strings follow APIS.md D3.
export const SOURCES: SourceEntry[] = [
	{
		name: 'OpenStreetMap',
		description: 'Kartan paikat, nimet ja tiedot. Poimittu kerran staattisiksi tiedostoiksi.',
		url: 'https://www.openstreetmap.org/copyright',
		licence: '© OpenStreetMap contributors, ODbL'
	},
	{
		name: 'OpenFreeMap',
		description: 'Karttapohja',
		url: 'https://openfreemap.org',
		licence: '© OpenFreeMap, © OpenMapTiles, © OpenStreetMap contributors'
	},
	{
		name: 'Nominatim',
		description: 'Paikkahaku',
		url: 'https://nominatim.org',
		licence: 'OpenStreetMap Nominatim, © OpenStreetMap contributors, ODbL'
	},
	{
		name: 'Valhalla (FOSSGIS)',
		description: 'Retkien reitit kävellen, pyörällä ja autolla',
		url: 'https://valhalla.openstreetmap.de',
		licence: 'FOSSGIS e.V., reitit OpenStreetMap-datasta, ODbL'
	},
	{
		name: 'Museovirasto',
		description: 'Muinaisjäännösrekisterin kohteet ja niiden tiedot',
		url: 'https://www.museovirasto.fi',
		licence: 'Museovirasto, CC BY 4.0'
	},
	{
		name: 'Wikipedia',
		description: 'Paikkojen tarinat',
		url: 'https://fi.wikipedia.org',
		licence: 'CC BY-SA 4.0'
	},
	{
		name: 'Wikidata',
		description: 'Paikkojen tunnisteet ja kuvalinkit',
		url: 'https://www.wikidata.org',
		licence: 'CC0'
	},
	{
		name: 'Wikimedia Commons',
		description: 'Valokuvat paikoista',
		url: 'https://commons.wikimedia.org',
		licence: 'Lisenssi on kuvakohtainen ja näkyy kuvan yhteydessä'
	},
	{
		name: 'Finna',
		description: 'Museoiden ja arkistojen vanhat valokuvat',
		url: 'https://www.finna.fi',
		licence: 'Vain vapaasti käytettävät kuvat (CC0, PDM, CC BY). Lisenssi ja organisaatio näkyvät kuvan yhteydessä.'
	}
];
