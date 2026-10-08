import type { LngLat, Place, TripPlan } from '$lib/types';
import { distanceM } from './geo';
import { BUDGET, MOOD_META, STOP_MINUTES, TRANSPORT_META } from '$lib/content/trip';

export interface PlannedRoute {
	stops: Place[]; // in visiting order, start not included
	lengthM: number; // loop length including the return leg
	minutes: number;
}

/** Plan a loop from `plan.start` through the best places for the mood, ordered as a short round trip. Pure. */
export function planTrip(plan: TripPlan, places: Place[]): PlannedRoute {
	const cats = new Set(MOOD_META[plan.mood].categories);
	const budget = BUDGET[plan.transport][plan.duration];
	const start = plan.start;

	let radius = budget.radiusM;
	let pool: Place[] = [];
	for (let i = 0; i < 3 && pool.length < budget.stops; i++) {
		pool = places.filter((p) => cats.has(p.category) && distanceM(start, p) <= radius);
		radius *= 1.8;
	}

	const score = (p: Place) =>
		(p.rare ? 2 : 0) +
		(p.wikipedia || p.wikidata ? 1.5 : 0) +
		(p.image ? 0.5 : 0) +
		(p.tags.description || p.tags.inscription ? 0.5 : 0) -
		(distanceM(start, p) / budget.radiusM) * 0.5 +
		Math.random() * 0.4;

	const ranked = pool.map((p) => ({ p, s: score(p) })).sort((a, b) => b.s - a.s);
	const perCat = Math.ceil(budget.stops / cats.size) + 1;
	const count = new Map<string, number>();
	const chosen: Place[] = [];
	const tooClose = (p: Place) => chosen.some((c) => distanceM(c, p) < 80);
	for (const pass of [true, false]) {
		for (const { p } of ranked) {
			if (chosen.length >= budget.stops) break;
			if (chosen.includes(p) || tooClose(p)) continue;
			const n = count.get(p.category) ?? 0;
			if (pass && n >= perCat) continue;
			chosen.push(p);
			count.set(p.category, n + 1);
		}
	}

	const stops = orderLoop(start, chosen);
	const lengthM = loopLength(start, stops);
	const minutes = Math.round((lengthM / 1000 / TRANSPORT_META[plan.transport].kmh) * 60 + stops.length * STOP_MINUTES);
	return { stops, lengthM, minutes };
}

/** Nearest-neighbour order from start, then 2-opt until no improvement. */
function orderLoop(start: LngLat, places: Place[]): Place[] {
	const rest = [...places];
	const out: Place[] = [];
	let at: LngLat = start;
	while (rest.length) {
		let bi = 0;
		let bd = Infinity;
		rest.forEach((p, i) => {
			const d = distanceM(at, p);
			if (d < bd) {
				bd = d;
				bi = i;
			}
		});
		const next = rest.splice(bi, 1)[0];
		out.push(next);
		at = next;
	}
	let improved = true;
	while (improved && out.length > 3) {
		improved = false;
		for (let i = 0; i < out.length - 1; i++) {
			for (let j = i + 1; j < out.length; j++) {
				const a = i === 0 ? start : out[i - 1];
				const b = out[i];
				const c = out[j];
				const d = j === out.length - 1 ? start : out[j + 1];
				const before = distanceM(a, b) + distanceM(c, d);
				const after = distanceM(a, c) + distanceM(b, d);
				if (after + 1 < before) {
					out.splice(i, j - i + 1, ...out.slice(i, j + 1).reverse());
					improved = true;
				}
			}
		}
	}
	return out;
}

export function loopLength(start: LngLat, stops: LngLat[]): number {
	let total = 0;
	let at: LngLat = start;
	for (const s of stops) {
		total += distanceM(at, s);
		at = s;
	}
	if (stops.length) total += distanceM(at, start);
	return total;
}

/** "1 h 20 min" or "45 min". */
export function formatMinutes(min: number): string {
	const h = Math.floor(min / 60);
	const m = Math.round(min % 60);
	if (!h) return `${m} min`;
	return m ? `${h} h ${m} min` : `${h} h`;
}
