import type { LngLat, Transport } from '$lib/types';

/** A road-following route from Valhalla (FOSSGIS public server). */
export interface RouteShape {
	coords: [number, number][]; // [lon, lat]
	lengthM: number;
	seconds: number;
}

const COSTING: Record<Transport, string> = { walk: 'pedestrian', bike: 'bicycle', car: 'auto' };

/** Route through the points in order. Resolves to null on any failure; the caller keeps its straight line. */
export async function fetchShape(points: LngLat[], transport: Transport): Promise<RouteShape | null> {
	if (points.length < 2) return null;
	const ctrl = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), 12000);
	try {
		const res = await fetch('https://valhalla1.openstreetmap.de/route', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			signal: ctrl.signal,
			body: JSON.stringify({
				locations: points.map((p) => ({ lat: p.lat, lon: p.lon, type: 'break' })),
				costing: COSTING[transport],
				units: 'kilometers'
			})
		});
		if (!res.ok) return null;
		const data = (await res.json()) as {
			trip?: { legs?: { shape: string }[]; summary?: { length: number; time: number } };
		};
		const legs = data.trip?.legs ?? [];
		const coords = legs.flatMap((leg) => decode(leg.shape));
		if (coords.length < 2) return null;
		return {
			coords,
			lengthM: Math.round((data.trip?.summary?.length ?? 0) * 1000),
			seconds: Math.round(data.trip?.summary?.time ?? 0)
		};
	} catch {
		return null;
	} finally {
		clearTimeout(timer);
	}
}

/** Google polyline with 6 decimals, as Valhalla encodes it. */
function decode(str: string): [number, number][] {
	const out: [number, number][] = [];
	let i = 0;
	let lat = 0;
	let lon = 0;
	while (i < str.length) {
		for (const k of [0, 1]) {
			let shift = 0;
			let result = 0;
			let b: number;
			do {
				b = str.charCodeAt(i++) - 63;
				result |= (b & 0x1f) << shift;
				shift += 5;
			} while (b >= 0x20);
			const d = result & 1 ? ~(result >> 1) : result >> 1;
			if (k === 0) lat += d;
			else lon += d;
		}
		out.push([lon / 1e6, lat / 1e6]);
	}
	return out;
}
