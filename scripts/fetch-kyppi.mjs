// Pulls the "Kuvaus" paragraph of every Museovirasto place from kyppi.fi once and stores it as the
// `kuvaus` property in static/data/<category>.geojson. Time-capped: whatever arrived is kept.
// Usage: node scripts/fetch-kyppi.mjs [minutes=9] [concurrency=8]
import { readFile, writeFile } from 'node:fs/promises';

const MINUTES = Number(process.argv[2] ?? 9);
const CONC = Number(process.argv[3] ?? 8);
const FILES = ['ancient', 'maritime'].map((c) => `static/data/${c}.geojson`);
const deadline = Date.now() + MINUTES * 60_000;

const data = new Map();
const jobs = [];
for (const f of FILES) {
	const col = JSON.parse(await readFile(f, 'utf8'));
	data.set(f, col);
	for (const feat of col.features) {
		const p = feat.properties;
		if (p.src === 'museovirasto' && !p.kuvaus) jobs.push(p);
	}
}
console.log(`${jobs.length} pages to fetch, ${MINUTES} min cap`);

function clean(html) {
	const m = html.match(/<span id="kuvaus"[^>]*>([\s\S]*?)<\/span>/);
	if (!m) return undefined;
	let text = m[1]
		.replace(/Luonti:[\s\S]*$/, '')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&auml;/g, 'ä').replace(/&ouml;/g, 'ö').replace(/&Auml;/g, 'Ä').replace(/&Ouml;/g, 'Ö')
		.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#\d+;/g, '')
		.replace(/\s+/g, ' ')
		.trim();
	if (text.length < 20) return undefined;
	if (text.length > 700) {
		const cut = text.slice(0, 700);
		const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('.'));
		text = end > 200 ? cut.slice(0, end + 1) : cut.trimEnd() + '…';
	}
	return text;
}

let done = 0;
let got = 0;
let fails = 0;
async function worker() {
	while (jobs.length && Date.now() < deadline) {
		const p = jobs.shift();
		const id = p.id.replace('mv/', '');
		try {
			const ctrl = new AbortController();
			const t = setTimeout(() => ctrl.abort(), 10_000);
			const res = await fetch(`https://www.kyppi.fi/palveluikkuna/mjreki/read/asp/r_kohde_det.aspx?KOHDE_ID=${id}`, {
				signal: ctrl.signal,
				headers: { 'User-Agent': 'arjen-aarteet/1.0 (softamestari)' }
			});
			clearTimeout(t);
			if (!res.ok) throw new Error(String(res.status));
			const text = clean(await res.text());
			if (text) {
				p.kuvaus = text;
				got++;
			}
		} catch {
			fails++;
		}
		done++;
		if (done % 500 === 0) {
			console.log(`${done} done, ${got} with text, ${fails} failed`);
			await save();
		}
	}
}

async function save() {
	for (const [f, col] of data) await writeFile(f, JSON.stringify(col));
}

await Promise.all(Array.from({ length: CONC }, worker));
await save();
console.log(`finished: ${done} done, ${got} with text, ${fails} failed, ${jobs.length} left`);
