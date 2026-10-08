import type { Find, Place } from '$lib/types';
import { persisted } from './persisted.svelte';

/** Places the user has marked as visited. Persisted. */
export class FindsState {
	#store = persisted<Find[]>('arjen-aarteet.finds', []);
	get list(): Find[] {
		return this.#store.value;
	}
	get count(): number {
		return this.#store.value.length;
	}
	has(id: string): boolean {
		return this.#store.value.some((f) => f.id === id);
	}
	add(place: Place) {
		if (this.has(place.id)) return;
		this.#store.value = [
			{ id: place.id, name: place.name, category: place.category, at: new Date().toISOString() },
			...this.#store.value
		];
	}
	remove(id: string) {
		this.#store.value = this.#store.value.filter((f) => f.id !== id);
	}
	toggle(place: Place) {
		if (this.has(place.id)) this.remove(place.id);
		else this.add(place);
	}
}
export const finds = new FindsState();
