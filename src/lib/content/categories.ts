import type { Category } from '$lib/types';

// content-worker owns this file. Icons only from the design system README list.
export interface CategoryMeta {
	label: string; // chip label
	single: string; // eyebrow on the sheet
	blurb: string; // one calm sentence on why this is worth finding
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
	park: {
		label: 'Puistot ja hiljaiset paikat',
		single: 'Hiljainen paikka',
		blurb: 'Puistot, puutarhat ja hautausmaat, joissa kaupungin ääni vaimenee.'
	},
	memorial: {
		label: 'Muistomerkit ja taide',
		single: 'Muistomerkki tai taideteos',
		blurb: 'Patsaat, laatat ja muistokivet, joiden ohi moni kävelee katsomatta.'
	},
	building: {
		label: 'Historialliset rakennukset',
		single: 'Historiallinen rakennus',
		blurb: 'Kirkot, kartanot ja vanhat talot, joiden seinillä on pitkä tarina.'
	},
	ancient: {
		label: 'Muinaisjäännökset',
		single: 'Muinaisjäännös',
		blurb: 'Röykkiöt, kuppikivet ja linnavuoret ajalta ennen katuja.'
	},
	tree: {
		label: 'Nimetyt puut ja luonnonihmeet',
		single: 'Luonnonihme',
		blurb: 'Puut, joilla on oma nimi, sekä lähteet, siirtolohkareet ja luolat.'
	},
	maritime: {
		label: 'Majakat ja meri',
		single: 'Meren merkki',
		blurb: 'Majakat, merimerkit ja hylyt kertovat, miten meri on kuljettanut ihmisiä.'
	},
	viewpoint: {
		label: 'Näköalat',
		single: 'Näköalapaikka',
		blurb: 'Tornit, kalliot ja huiput, joilta tuttu maisema näyttää uudelta.'
	},
	oddity: {
		label: 'Kummallisuudet',
		single: 'Kummallisuus',
		blurb: 'Rajakivet, virstanpylväät, kaiverrukset ja muut arjen arvoitukset.'
	}
};
