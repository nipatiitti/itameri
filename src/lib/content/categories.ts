import type { Category } from '$lib/types';

// Lead stub; content-worker refines labels and blurbs. Icons must be names from the design system README.
export interface CategoryMeta {
	label: string; // chip label, plural
	single: string; // eyebrow on the sheet
	icon: string;
	blurb: string; // one calm sentence on why this is worth finding
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
	tree: { label: 'Puut', single: 'Nimetty puu', icon: 'ph:leaf', blurb: 'Puu, jolla on nimi, on nähnyt enemmän kuin kukaan ohikulkija.' },
	memorial: { label: 'Muistomerkit', single: 'Muistomerkki', icon: 'ph:anchor-simple', blurb: 'Pieni kivi tai laatta, jonka ohi on kävelty tuhat kertaa.' },
	ancient: { label: 'Muinaisjäännökset', single: 'Muinaisjäännös', icon: 'ph:anchor-simple', blurb: 'Jälkiä ihmisistä, jotka asuivat täällä ennen katuja.' },
	viewpoint: { label: 'Näköalat', single: 'Näköalapaikka', icon: 'ph:crosshair', blurb: 'Paikka, josta tuttu maisema näyttää uudelta.' },
	maritime: { label: 'Meren merkit', single: 'Merenkulun perintö', icon: 'ph:waves', blurb: 'Majakat, loistot ja hylyt kertovat, miten meri on kuljettanut meitä.' },
	artwork: { label: 'Taide', single: 'Julkinen taideteos', icon: 'ph:map-trifold', blurb: 'Taidetta, joka ei ole museossa vaan kadunkulmassa.' },
	park: { label: 'Puistot', single: 'Puisto', icon: 'ph:leaf', blurb: 'Hiljainen hetki keskellä kaupunkia.' },
	building: { label: 'Rakennukset', single: 'Historiallinen rakennus', icon: 'ph:info', blurb: 'Seinät, joilla on kerrottavaa.' }
};
