import { CATEGORIES, type Category, type LoadStatus, type Place, type Story, type LngLat } from '$lib/types';
import { loadPlaces } from '$lib/data/places';
import { fetchStory } from '$lib/data/story';
import { distanceM } from '$lib/data/geo';

/** App-wide state: the place list, category filter, selection and the selected place's story. */
export class AppState {
	places = $state.raw<Place[]>([]);
	status = $state<LoadStatus>('idle');
	active = $state<Category[]>([...CATEGORIES]);
	rareOnly = $state(false);
	selectedId = $state<string | null>(null);
	story = $state<Story | null>(null);
	storyStatus = $state<LoadStatus>('idle');

	#byId = $derived(new Map(this.places.map((p) => [p.id, p])));
	selected = $derived(this.selectedId ? (this.#byId.get(this.selectedId) ?? null) : null);
	visible = $derived.by(() => {
		const set = new Set(this.active);
		const rare = this.rareOnly;
		return this.places.filter((p) => set.has(p.category) && (!rare || p.rare));
	});

	byId(id: string): Place | undefined {
		return this.#byId.get(id);
	}

	isActive(c: Category) {
		return this.active.includes(c);
	}
	toggleCategory(c: Category) {
		this.active = this.isActive(c) ? this.active.filter((x) => x !== c) : [...this.active, c];
	}
	setOnly(c: Category) {
		this.active = [c];
	}
	toggleRare() {
		this.rareOnly = !this.rareOnly;
	}
	showAll() {
		this.active = [...CATEGORIES];
	}

	async load() {
		if (this.status === 'loading' || this.status === 'ready') return;
		this.status = 'loading';
		try {
			this.places = await loadPlaces();
			this.status = this.places.length ? 'ready' : 'error';
		} catch {
			this.places = [];
			this.status = 'error';
		}
	}

	#storyToken = 0;
	async select(id: string | null) {
		this.selectedId = id;
		this.story = null;
		const token = ++this.#storyToken;
		const place = id ? this.#byId.get(id) : null;
		if (!place) {
			this.storyStatus = 'idle';
			return;
		}
		this.storyStatus = 'loading';
		try {
			const s = await fetchStory(place);
			if (token !== this.#storyToken) return;
			this.story = s;
			this.storyStatus = 'ready';
		} catch {
			if (token !== this.#storyToken) return;
			this.storyStatus = 'error';
		}
	}

	/** Pick a random visible place within radiusM of `from` (widening the radius if needed). Returns it or null. */
	surprise(from: LngLat, radiusM = 1500, exclude: string[] = []): Place | null {
		const ex = new Set(exclude);
		let r = radiusM;
		for (let i = 0; i < 6; i++) {
			const near = this.visible.filter((p) => !ex.has(p.id) && distanceM(from, p) <= r);
			const rare = near.filter((p) => p.rare);
			const pool = rare.length && Math.random() < 0.5 ? rare : near;
			if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
			r *= 2.5;
		}
		return null;
	}
}
export const app = new AppState();
