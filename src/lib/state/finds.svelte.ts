import type { Find } from '$lib/types';
import { persisted } from './persisted.svelte';

/** Places the user has marked as visited. Persisted. */
export class FindsState {
	#store = persisted<Find[]>('loytoretki.finds', []);
	get list(): Find[] {
		return this.#store.value;
	}
	get count(): number {
		return this.#store.value.length;
	}
	has(id: string): boolean {
		return this.#store.value.some((f) => f.id === id);
	}
	add(id: string) {
		if (this.has(id)) return;
		this.#store.value = [{ id, at: new Date().toISOString() }, ...this.#store.value];
	}
	remove(id: string) {
		this.#store.value = this.#store.value.filter((f) => f.id !== id);
	}
	toggle(id: string) {
		if (this.has(id)) this.remove(id);
		else this.add(id);
	}
}
export const finds = new FindsState();
