import type { LngLat } from '$lib/types';

const R = 6371000;
/** Great-circle distance in metres. */
export function distanceM(a: LngLat, b: LngLat): number {
	const toRad = (d: number) => (d * Math.PI) / 180;
	const dLat = toRad(b.lat - a.lat);
	const dLon = toRad(b.lon - a.lon);
	const s =
		Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(s));
}

/** "350 m" or "2,4 km" with a non-breaking space. */
export function formatDistance(m: number): string {
	if (m < 1000) return `${Math.round(m / 10) * 10} m`;
	return `${new Intl.NumberFormat('fi-FI', { maximumFractionDigits: 1 }).format(m / 1000)} km`;
}
