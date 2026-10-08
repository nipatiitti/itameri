import type { Place, Trip, TripPlan } from '$lib/types';
import { persisted } from './persisted.svelte';
import { planTrip } from '$lib/data/route';
import { MOOD_META, STOP_MINUTES, TRANSPORT_META } from '$lib/content/trip';
import { fetchLegs } from '$lib/data/routing';
import { distanceM } from '$lib/data/geo';
import { app } from './app.svelte';

/** Saved trips (localStorage) and the one currently drawn on the map. */
export class TripsState {
	#store = persisted<Trip[]>('arjen-aarteet.trips', []);
	/** Trip drawn on the main map, or null. */
	activeId = $state<string | null>(null);
	/** Bumped when the map should fit the whole active loop; the map records what it has handled. */
	fitSeq = $state(0);
	fitHandled = 0;

	/** Draw this trip on the map and fit the whole loop into view. */
	show(id: string) {
		this.activeId = id;
		this.fitSeq += 1;
		app.select(null);
	}
	fit() {
		if (this.activeId) this.fitSeq += 1;
	}

	/** Road-following shapes by trip id, filled by refine(). Missing means straight lines. */
	shapes = $state<Record<string, [number, number][]>>({});
	#pending = new Map<string, string>();

	/** Fetch the real route for a trip once per stop list; updates its length and time when it arrives. */
	async refine(id: string) {
		const trip = this.byId(id);
		if (!trip) return;
		const key = trip.stops.join(',');
		if (this.#pending.get(id) === key) return;
		this.#pending.set(id, key);
		const stops = this.stopsOf(trip);
		const points = [trip.plan.start, ...stops, trip.plan.start];
		if (trip.plan.transport === 'boat') return;
		const legs = await fetchLegs(points, trip.plan.transport);
		if (this.#pending.get(id) !== key || !legs.some(Boolean)) return;
		// A leg that detours far beyond the straight line (ferry to the mainland and back) becomes a straight hop over the water.
		const mps = (TRANSPORT_META[trip.plan.transport].kmh * 1000) / 3600;
		const coords: [number, number][] = [];
		let lengthM = 0;
		let seconds = 0;
		legs.forEach((leg, i) => {
			const a = points[i];
			const b = points[i + 1];
			const straight = distanceM(a, b);
			if (leg && leg.coords.length > 1 && leg.lengthM <= Math.max(straight * 3, straight + 1500)) {
				coords.push(...leg.coords);
				lengthM += leg.lengthM;
				seconds += leg.seconds;
			} else {
				coords.push([a.lon, a.lat], [b.lon, b.lat]);
				lengthM += straight;
				seconds += straight / mps;
			}
		});
		this.shapes = { ...this.shapes, [id]: coords };
		const minutes = Math.round(seconds / 60 + stops.length * STOP_MINUTES);
		this.#store.value = this.#store.value.map((t) => (t.id === id ? { ...t, lengthM: Math.round(lengthM), minutes } : t));
	}

	get list(): Trip[] {
		return this.#store.value;
	}
	byId(id: string): Trip | undefined {
		return this.#store.value.find((t) => t.id === id);
	}
	active = $derived(this.activeId ? (this.byId(this.activeId) ?? null) : null);

	/** Plan from the wizard answers and save. Returns the trip, or null when no places were found. */
	create(plan: TripPlan): Trip | null {
		const route = planTrip(plan, app.places);
		if (route.stops.length < 2) return null;
		const trip: Trip = {
			id: `t${Date.now().toString(36)}`,
			name: plan.startName ? `${MOOD_META[plan.mood].label}, ${plan.startName}` : MOOD_META[plan.mood].label,
			createdAt: new Date().toISOString(),
			plan,
			stops: route.stops.map((p) => p.id),
			lengthM: route.lengthM,
			minutes: route.minutes
		};
		this.#store.value = [trip, ...this.#store.value];
		return trip;
	}
	/** Re-plan an existing trip with the same answers (new random variety). */
	reroll(id: string): Trip | null {
		const old = this.byId(id);
		if (!old) return null;
		const route = planTrip(old.plan, app.places);
		if (route.stops.length < 2) return null;
		const next: Trip = { ...old, stops: route.stops.map((p) => p.id), lengthM: route.lengthM, minutes: route.minutes };
		this.#store.value = this.#store.value.map((t) => (t.id === id ? next : t));
		const { [id]: _, ...rest } = this.shapes;
		this.shapes = rest;
		return next;
	}
	rename(id: string, name: string) {
		this.#store.value = this.#store.value.map((t) => (t.id === id ? { ...t, name } : t));
	}
	remove(id: string) {
		this.#store.value = this.#store.value.filter((t) => t.id !== id);
		if (this.activeId === id) this.activeId = null;
	}
	/** Resolved stops of a trip (places that still exist in the data). */
	stopsOf(trip: Trip): Place[] {
		return trip.stops.map((id) => app.byId(id)).filter((p): p is Place => !!p);
	}
}
export const trips = new TripsState();
