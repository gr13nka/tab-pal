# tab-pal

A cross-platform **colour-palette tool** — generate, browse, and check palettes — built as one web/desktop/mobile codebase around a pure, perceptually-uniform colour engine. A [Coolors](https://coolors.co)-style app, offline-first.

> tab-pal began as a Python [Textual](https://textual.textualize.io/) TUI (still on PyPI as `tab-pal`, archived here under [`legacy/python-tui/`](./legacy/python-tui/)). This repo is the rebuild: a TypeScript port of the original colour engine, wrapped in a React app that ships to the browser (PWA), desktop, and mobile.

## What it does (v1)

- **Generator** — harmony-based palette generation (complementary, analogous, triadic, …) and curated presets, with per-swatch **lock + regenerate** (press <kbd>Space</kbd>). Global **undo/redo**.
- **Library** — browse 27 curated presets (Tableau, ColorBrewer, viridis family) and send any to the generator.
- **Contrast** — WCAG 2.x contrast checker with AA/AAA badges for normal and large text, and a live preview.
- **Export** — copy/download palettes as a hex list (`.txt`), JSON, or CSS variables.
- **Local-first** — palettes are saved in your browser (IndexedDB) or on disk (native), no account required. The storage layer is designed so cloud sync + accounts can be added without touching any tool.

## Architecture

A pnpm monorepo with a strict, lint-enforced **inward-only dependency rule** (engine → domain → store/storage → features → app):

| Path | What |
|------|------|
| `packages/engine` | `@tab-pal/engine` — pure colour math (CIELAB/LCh), generators, presets, WCAG. **Zero DOM/app deps.** A faithful, parity-tested port of `legacy/python-tui/tab_pal/colors.py`. |
| `apps/web/src/core` | Domain model (immutable `Color`/`Palette`), the Zustand + Immer + zundo history store, and the `PaletteStore` storage seam (IndexedDB now; Tauri fs + cloud sync designed-for). |
| `apps/web/src/features/*` | Independent tool modules (generator, library, contrast, export). A tool never imports another; the app's router/nav are projections of a single `TOOLS` manifest — adding a tool is one new folder + one line. |
| `apps/web/src/app` | Shell: router, nav, providers, undo/redo. |

The TS engine is verified against the Python original by a **cross-language parity test** (`packages/engine/test/parity.test.ts`) that asserts byte-for-byte agreement over hundreds of cases.

## Develop

Requires Node 22+ and pnpm.

```bash
pnpm install            # install workspace deps
pnpm dev                # run the web app (Vite) at http://localhost:5173
pnpm test               # run all tests (engine + app)
pnpm typecheck          # typecheck all packages
pnpm --filter @tab-pal/web build   # production build (PWA)
```

Desktop/mobile packaging uses [Tauri 2](https://tauri.app) (one Rust shell for all native targets). Mobile store builds are planned for v1.x.

## Roadmap

v2 adds more independent tools (gradient maker, image-to-palette, colour-blindness simulation, shades/tints); v3 adds accounts + cloud sync. The architecture is built so each lands as additive modules behind existing seams.

## License

MIT. The colour engine is derived from the original `tab-pal` by Ben Nour (see `legacy/python-tui/`).
