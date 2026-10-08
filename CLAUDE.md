# Rules for every agent in this repo

Timed competition, 3 hours, one human testing in a browser. Speed first, then correctness.
Conventions and the toolchain are in STACK.md, data sources in APIS.md, facts in DOMAIN.md.

## Process

- Never run tests, lint, svelte-check, tsc, prettier, eslint, vitest, playwright, `pnpm dev` or
  `pnpm preview`. They are also denied in settings. The human tests in the browser.
- Never ask the user a question. Pick the option you would recommend, note it in one line, go on.
- Workers edit only the files listed in their task. Shared files are lead-only: `package.json`,
  `vite.config.ts`, `src/app.html`, `src/routes/layout.css`, `src/routes/+layout.svelte`,
  `src/routes/+layout.ts`, `src/lib/types.ts`. Need a change there: describe the exact snippet in
  your final reply.
- Workers never run git, `pnpm add` or `pnpm install`. The lead does.
- No refactors, no abstractions for one use, no TODO comments, no dead code, no console.log left in.
- Final reply, max 10 lines, no code: STATUS done|blocked · FILES CHANGED · EXPORTS · NEEDS FROM
  LEAD · RISKS. (The dot separator is fine here; it is a chat reply, not UI.)

## Code

- Svelte 5 runes, SvelteKit 2.63, Tailwind v4, TypeScript. Follow STACK.md sections 3 to 7
  exactly: client-only rendering, state as classes in `.svelte.ts` modules, `{@attach}` for the
  map, `class={[...]}` for conditional classes, `onclick` not `on:click`.
- The Itämeri design system is the only source of look. It is an artifact, read with the
  Artifact tool: `action: "read"`, `url: "https://claude.ai/artifact/1uvkVvur2xa4FDDphRGxRT"`, `path: "project/README.md"`
  (the brand book, read once), `path: "project/components/<Name>/README.md"` (a card; several
  at once with `paths`), `project/map.md`, `project/tailwind.md` (class cheat sheet at the end).
  Never copy its files into the repo except the three the lead installs. Build each UI piece
  from its card: copy the markup, change the words and data. Component classes (`btn-primary`, `card`, `chip`, `tag`, `list-row`, `sheet`,
  `panel`, `icon-btn`, `nav-item`, `field`, `notice`, `stat-value`) are finished: beside them
  only layout classes (`mt-4`, `w-full`, `flex-1`, grid placement), never colour, padding,
  radius, font or shadow classes. Otherwise role colours (`bg-surface`, `text-fg-muted`,
  `border-line-strong`) before ramp colours. Tailwind's default palette, sizes, radii and
  shadows are wiped: `text-gray-500`, `bg-blue-600`, `rounded-lg`, `shadow-md`, `text-2xl`
  render as nothing. Never edit `layout.css` values.
- Icons: Phosphor via `@iconify/svelte`, only the names listed in the system's `project/README.md`.
- Types in `src/lib/types.ts` are the contract. Do not redefine shapes locally.
- Data: never hand-edit provided or downloaded data files; transform in code. Fetch failures
  degrade to an empty state, never to a crash. External calls only to endpoints listed in APIS.md.
- Attribution for every data source goes to `src/lib/content/sources.ts` and shows on the About page.

## UI (these matter for the score)

- **No typographic separators.** Never join values with " · ", " - ", " | ", " / ", "•" or
  similar. Separate items with structure instead: separate elements, a `<dl>` for label and
  value pairs, size and weight difference, spacing, or a better sentence.
- **Semantic HTML first.** Landmarks (`header`, `nav`, `main`, `aside`, `footer`), one `h1` per
  page and headings in order, `ul`/`ol` for lists, `button` for actions, `a` for navigation,
  `dl` for facts, `table` for tabular data, `figure` for charts and images, `form` with `label`s.
  The page must read correctly and look acceptable with all CSS removed.
- **Flex and grid with `gap`** for layout; no margins between siblings, no absolute positioning
  except for map overlays.
- **One boundary per container.** A card has at most one border or background; its children use
  spacing and typography, never another box. No border inside a border inside a highlight.
- **No repeated information.** Each fact appears once per screen. No label that repeats the
  heading ("Name: Suomenlahti" under the heading Suomenlahti). Hide ids, raw codes, nulls,
  "undefined", empty sections and anything the user cannot act on or learn from.
- **Typography.** At most two text sizes per component, emphasis by weight. `<h1>`/`<h2>` are
  styled by the base layer; write semantic headings. Numbers via `Intl.NumberFormat('fi-FI')`,
  units with a non-breaking space (12 °C, 3,5 m, 240 kg).
- **Touch and access.** Targets at least 44 px, visible focus, contrast AA, every icon with text
  or an `aria-label`, images with `alt`.
- **States.** Every list and panel has loading, empty and error states from the States card,
  each with exactly one button; every screen has a title and a way back. Selected and current
  state lives in ARIA (`aria-pressed`, `aria-current`, `aria-selected`); the classes style it.
- **Mobile first.** Usable at 390 px, fine at 1440 px. Map overlays stay out of the thumb zone.
- **Copy.** Voice per the system's `project/README.md`: plain Finnish in _sinä_ form, calm facts, the smile
  only in empty states and thanks, no emoji, dates 8.10.2026, times klo 9.00, "Lähde: SYKE" near
  every data block. One primary button and one brass mark per screen.
