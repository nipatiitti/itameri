import type { Category, Duration, Mood, Transport } from '$lib/types';

// Lead-written; content-worker may polish words, not keys.

/** `weight`: how much each category counts for the mood; the heaviest one leads and gets at least half the stops when available. */
export const MOOD_META: Record<Mood, { label: string; blurb: string; categories: Category[]; weight: Partial<Record<Category, number>> }> = {
	calm: {
		label: 'Rauhoittumista',
		blurb: 'Puistoja, vanhoja puita ja näköaloja, joissa hengitys tasaantuu.',
		categories: ['park', 'tree', 'viewpoint'],
		weight: { park: 2, tree: 1.5, viewpoint: 1 }
	},
	urban: {
		label: 'Kaupungin kummallisuuksia',
		blurb: 'Taidetta, muistolaattoja ja arjen arvoituksia kadunkulmissa.',
		categories: ['memorial', 'oddity', 'building'],
		weight: { oddity: 2, memorial: 1.5, building: 1 }
	},
	woods: {
		label: 'Metsän kätköjä',
		blurb: 'Muinaisjäännöksiä, lähteitä ja siirtolohkareita polkujen varrella.',
		categories: ['ancient', 'tree', 'viewpoint'],
		weight: { ancient: 2, tree: 1.5, viewpoint: 0.5 }
	},
	sea: {
		label: 'Meren ääreen',
		blurb: 'Majakoita, merimerkkejä ja hylkyjä, joista meri kertoo.',
		categories: ['maritime', 'viewpoint', 'ancient'],
		weight: { maritime: 2, viewpoint: 1, ancient: 0.3 }
	},
	history: {
		label: 'Historian jälkiä',
		blurb: 'Kartanoita, kirkkoja ja muistomerkkejä, joilla on kerrottavaa.',
		categories: ['building', 'ancient', 'memorial'],
		weight: { building: 2, ancient: 1.5, memorial: 1 }
	}
};

export const TRANSPORT_META: Record<Transport, { label: string; kmh: number }> = {
	walk: { label: 'Kävellen', kmh: 4.5 },
	bike: { label: 'Pyörällä', kmh: 15 },
	car: { label: 'Autolla', kmh: 40 },
	boat: { label: 'Veneellä', kmh: 10 }
};

export const DURATION_META: Record<Duration, { label: string; minutes: number }> = {
	short: { label: 'Noin tunti', minutes: 60 },
	medium: { label: 'Pari tuntia', minutes: 120 },
	long: { label: 'Puoli päivää', minutes: 240 }
};

/** Search radius in metres and number of stops per transport and duration. */
export const BUDGET: Record<Transport, Record<Duration, { radiusM: number; stops: number }>> = {
	walk: { short: { radiusM: 1200, stops: 4 }, medium: { radiusM: 2500, stops: 6 }, long: { radiusM: 4000, stops: 8 } },
	bike: { short: { radiusM: 4000, stops: 5 }, medium: { radiusM: 7000, stops: 7 }, long: { radiusM: 12000, stops: 9 } },
	car: { short: { radiusM: 12000, stops: 5 }, medium: { radiusM: 25000, stops: 7 }, long: { radiusM: 45000, stops: 9 } },
	boat: { short: { radiusM: 5000, stops: 4 }, medium: { radiusM: 10000, stops: 6 }, long: { radiusM: 20000, stops: 8 } }
};

/** Minutes spent at each stop. */
export const STOP_MINUTES = 10;
