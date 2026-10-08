import type { Category } from '$lib/types';

// content-worker owns this file. Icons only from the design system README list.
export interface CategoryMeta {
	label: string; // chip label
	single: string; // eyebrow on the sheet
	blurb: string; // one calm sentence on why this is worth finding
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
	park: { label: 'Puistot ja hiljaiset paikat', single: 'Hiljainen paikka', blurb: 'Hiljainen hetki keskellä kaupunkia.' },
	memorial: { label: 'Muistomerkit ja taide', single: 'Muistomerkki', blurb: 'Pieni kivi tai laatta, jonka ohi on kävelty tuhat kertaa.' },
	building: { label: 'Historialliset rakennukset', single: 'Historiallinen rakennus', blurb: 'Seinät, joilla on kerrottavaa.' },
	ancient: { label: 'Muinaisjäännökset', single: 'Muinaisjäännös', blurb: 'Jälkiä ihmisistä, jotka asuivat täällä ennen katuja.' },
	tree: { label: 'Nimetyt puut ja luonnonihmeet', single: 'Luonnonihme', blurb: 'Puu, jolla on nimi, on nähnyt enemmän kuin kukaan ohikulkija.' },
	maritime: { label: 'Majakat ja meri', single: 'Meren merkki', blurb: 'Majakat, loistot ja hylyt kertovat, miten meri on kuljettanut meitä.' },
	viewpoint: { label: 'Näköalat', single: 'Näköalapaikka', blurb: 'Paikka, josta tuttu maisema näyttää uudelta.' },
	oddity: { label: 'Kummallisuudet', single: 'Kummallisuus', blurb: 'Rajakiviä, virstanpylväitä ja muita arjen arvoituksia.' }
};
