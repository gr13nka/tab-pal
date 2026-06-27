# CLAUDE.md — working in tab-pal

Guidance for AI assistants (and humans) working in this repo. Keep it accurate: update it when structure, conventions, or invariants change.

## What this is

tab-pal is a cross-platform **colour-palette tool** (web + desktop + mobile) — a Coolors-style app. It was rebuilt from a Python Textual TUI (archived in `legacy/python-tui/`, still on PyPI as `tab-pal`) into a TypeScript/React app sharing one codebase across all targets.

**Core idea:** a small stable core + independent feature modules behind fixed seams, so new features are additive (a new folder + one manifest line), never surgery on the core.

## Monorepo layout (pnpm workspaces)

```
packages/engine/        @tab-pal/engine — pure colour math (CIELAB/LCh), generators, presets, WCAG. ZERO DOM/app deps.
apps/web/               @tab-pal/web — React + Vite app (also the Tauri frontend) + PWA
  src/core/domain/      Color (immutable VO), Palette (document), serialization, migrations
  src/core/store/       Zustand + Immer + zundo history store (undo/redo)
  src/core/storage/     PaletteStore seam: IndexedDB (web) + Tauri fs (native) + sync/* (v3 stubs)
  src/shared/           ui primitives (Button, icons, cn) + types (ToolManifest)
  src/features/*/       independent tools: generator, library, contrast, export
  src/app/              shell: router + nav (projections of the TOOLS manifest), providers
  src-tauri/            Tauri 2 desktop/mobile shell (Rust)
legacy/python-tui/      the original Python app (kept as the cross-language parity oracle)
```

## Commands

Run from the repo root unless noted. Requires Node 22+ and pnpm.

```bash
pnpm install            # install workspace deps
pnpm dev                # web app (Vite) at http://localhost:5173
pnpm test               # all tests (engine + app, vitest)
pnpm typecheck          # all packages (tsc --noEmit)
pnpm --filter @tab-pal/web build      # production build (emits the PWA)
pnpm --filter @tab-pal/engine test:watch   # engine TDD loop
cd apps/web && pnpm tauri dev         # desktop (needs system libs — see src-tauri/README.md)
```

## Architecture invariant: the dependency rule

Imports point **inward only**: `engine → core/domain → core/store · core/storage → features → app`.

- **`@tab-pal/engine` imports nothing app-side** (no React, no DOM). It's a portable library. Keep it pure.
- **A feature must never import another feature.** Tools communicate only through the shared store + router. Example: the library tool "sends to generator" via `usePaletteStore.getState().loadPalette(...)` + `useNavigate("/generate")`, not by importing the generator.
- `core/domain` may import the engine; `core/store`/`core/storage` may import domain + engine; nothing core imports features.

## How to add a tool

1. Create `src/features/<tool>/` with: `manifest.ts` (exports `<tool>Tool: ToolManifest`, `component: lazy(() => import("./<Tool>Page"))`), `index.ts` (`export { <tool>Tool } from "./manifest"`), `<Tool>Page.tsx` (default export), `components/`, and pure logic in `<tool>.logic.ts` with a `<tool>.logic.test.ts`.
2. Add one line to `src/app/navigation/manifest.ts`'s `TOOLS` array. Router and nav update automatically.
   That's the whole wiring. Don't touch other features.

## Engine porting invariants (don't regress these)

The TS engine is a faithful port of `legacy/python-tui/tab_pal/colors.py`, guaranteed by **`packages/engine/test/parity.test.ts`** (asserts byte-for-byte agreement with Python over hundreds of cases). Three load-bearing details:

- **`roundHalfEven`** (math.ts) is used everywhere Python uses `round()` — JS `Math.round` is half-up and breaks the lossless Lab/LCh round-trip. Don't swap it for `Math.round`.
- **`mod360`** is used at every `% 360` site — JS `%` can be negative; Python's can't.
- Generators take an injectable `rng = Math.random` (used only when `baseHue` is omitted) so tests are deterministic.
- To regenerate parity fixtures after an intentional engine change: `python3 packages/engine/test/fixtures/generate_parity.py` (resolves the Python oracle from `legacy/`).

## Core gotchas

- **`Color` is immutable and atomic to Immer.** It's a class without Immer's `immerable` symbol, so Immer treats it as a value (never freezes it) and its lazy `lab`/`lch` cache stays valid. When assigning Colors/Palettes into the Immer draft in the store, wrap with `castDraft` (see `paletteStore.ts`). `Color.toJSON()` serializes only `{hex, alpha?, name?}` — derived fields can't leak.
- **Undo/redo is free per feature.** Only the `palette` document is historized (zundo `partialize`); transient `locks` are excluded via reference-equality (`a.palette === b.palette`). Any action that mutates the document gets one undo step; lock toggles get none. There's intentionally **no zundo debounce** (no continuous picker in the MVP) — add one if a drag-edit tool arrives.
- **Storage is a seam.** Tools use `useStorage()` (never a concrete store). `makePaletteStore()` picks IndexedDB vs Tauri fs by `isTauri()`. All reads go through `fromJSON` so schema **migrations** always run (bump `CURRENT_SCHEMA_VERSION` + add a step in `migrations.ts`). Cloud sync + accounts are pre-designed stubs in `core/storage/sync/` — implementing them is additive (a `SyncingPaletteStore` swap in the provider), no tool changes.
- The Tauri fs plugin is **dynamically imported** inside `TauriFsPaletteStore` methods so it never enters the web bundle.

## Verification expectations

Before claiming work is done: `pnpm typecheck` + `pnpm test` must be clean, and `pnpm --filter @tab-pal/web build` must succeed. Follow TDD for engine/domain/store/logic changes (tests first). The `src/app/App.test.tsx` smoke test mounts the whole app — keep it green.

## Tauri status

Desktop/mobile is scaffolded and dependency-resolved (Rust toolchain installed, `Cargo.lock` committed, `TauriFsPaletteStore` TS-verified). The native **compile** needs platform libs (Linux: `libwebkit2gtk-4.1-dev` via sudo) — see `apps/web/src-tauri/README.md`. It has not been compiled in CI/sandbox; verify on a machine with the libs.

## Roadmap (seams already in place)

- **v2** (more independent tools): gradient maker, image-to-palette, colour-blindness sim, shades/tints — each a new feature module + (if needed) an additive pure engine module (e.g. `engine/extract.ts`, `engine/cvd.ts`).
- **v3** (accounts + cloud sync): implement `core/storage/sync/*` + a `features/account` module; the engine and existing tools don't change.
- Engine has a `spaces/registry.ts` seam so OKLab/OKLCH/Display-P3 can be added later without touching callers (Lab stays the canonical hub).
