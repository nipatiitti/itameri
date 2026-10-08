import type { LngLat } from '$lib/types';

export interface FlyRequest {
	target: LngLat;
	zoom?: number;
	seq: number;
}

/** Map state shared between the map component and the UI. Owned by map-worker; shape fixed by lead. */
export class MapState {
	/** Current map centre, updated by the map on moveend. Finland default. */
	center = $state<LngLat>({ lon: 24.94, lat: 60.17 });
	zoom = $state(13);
	/** Visible extent [west, south, east, north], updated by the map on moveend. */
	bounds = $state<[number, number, number, number] | null>(null);
	/** User position from geolocation, null if unknown or denied. */
	here = $state<LngLat | null>(null);
	locating = $state(false);
	/** Latest fly request; the map component reacts to `seq` changes. */
	fly = $state<FlyRequest | null>(null);
	/** Last fly `seq` the map has executed, so a remounted map does not replay an old request. */
	handledSeq = 0;

	flyTo(target: LngLat, zoom?: number) {
		this.fly = { target, zoom, seq: (this.fly?.seq ?? 0) + 1 };
	}

	/** Origin for "near me": the user's position if known, else the map centre. */
	get origin(): LngLat {
		return this.here ?? this.center;
	}

	locate() {
		if (!('geolocation' in navigator) || this.locating) return;
		this.locating = true;
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				this.here = { lon: pos.coords.longitude, lat: pos.coords.latitude };
				this.locating = false;
				this.flyTo(this.here, 14);
			},
			() => {
				this.locating = false;
			},
			{ enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
		);
	}
}
export const map = new MapState();
