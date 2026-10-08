// src/lib/map-colors.ts
// The map library cannot read CSS variables. This file is the map's only colour source.
// Values mirror the Tailwind theme (map-*, status-*, algae-* tokens). Do not edit by hand.

export const MAP = {
  water: '#d1e7f4',   // background / sea
  land: '#f8f4ec',    // land fill (= page)
  outline: '#95a1af', // area outlines, coastline, 1px
  muted: '#b7c2ce',   // no data / filtered out
  select: '#0d255d',  // selected area outline, 3px, never a fill
  here: '#ac7225',    // "you are here" dot, 12px
  halo: '#fefbf5',    // 2px halo around points and the here-dot
  label: '#424e5c',   // place labels, with a 1.5px land-coloured halo
} as const;

export const FILL_OPACITY = 0.6;

export const STATUS_ORDER = ['high', 'good', 'moderate', 'poor', 'bad'] as const;
export type Status = (typeof STATUS_ORDER)[number];
export const STATUS: Record<Status, string> = {
  high: '#5fa5de',
  good: '#65d3a7',
  moderate: '#f7df69',
  poor: '#f8a052',
  bad: '#e85f61',
};
export const STATUS_LABEL_FI: Record<Status, string> = {
  high: 'Erinomainen', good: 'Hyvä', moderate: 'Tyydyttävä', poor: 'Välttävä', bad: 'Huono',
};

export const ALGAE = ['#c7f1ce', '#dbd856', '#e29936', '#b67b56'] as const; // index = level 0..3
export const ALGAE_LABEL_FI = ['Ei sinilevää', 'Vähän sinilevää', 'Runsaasti sinilevää', 'Erittäin runsaasti sinilevää'] as const;
