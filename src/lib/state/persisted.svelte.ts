/** A $state value mirrored to localStorage. Client-only app, so no guards needed. */
export function persisted<T>(key: string, initial: T) {
	let current = initial;
	try {
		const raw = localStorage.getItem(key);
		if (raw) current = JSON.parse(raw) as T;
	} catch {
		current = initial;
	}
	const box = $state({ value: current });
	return {
		get value() {
			return box.value;
		},
		set value(v: T) {
			box.value = v;
			try {
				localStorage.setItem(key, JSON.stringify(v));
			} catch {
				// storage unavailable: keep in memory only
			}
		}
	};
}
