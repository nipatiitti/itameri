import type { Place, Trip, TripPlan } from '$lib/types';
import { persisted } from './persisted.svelte';
import { planTrip } from '$lib/data/route';
import { MOOD_META, STOP_MINUTES } from '$lib/content/trip';
import { fetchShape } from '$lib/data/routing';
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
		const shape = await fetchShape([trip.plan.start, ...stops, trip.plan.start], trip.plan.transport);
		if (!shape || this.#pending.get(id) !== key) return;
		this.shapes = { ...this.shapes, [id]: shape.coords };
		const minutes = Math.round(shape.seconds / 60 + stops.length * STOP_MINUTES);
		this.#store.value = this.#store.value.map((t) => (t.id === id ? { ...t, lengthM: shape.lengthM, minutes } : t));
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
