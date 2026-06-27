# tab-pal desktop & mobile (Tauri 2)

This wraps the same web build (`apps/web/dist`) into native desktop and mobile apps. One Rust shell; the UI is identical across web/desktop/mobile.

## Status

Fully scaffolded and dependency-resolved (`Cargo.lock` committed; Rust toolchain 1.96 installed). The **native compile** requires platform system libraries that need `sudo`, so it must be run on your machine — everything else is in place.

## Prerequisites

- **Rust** ≥ 1.77.2 (installed here via `rustup`; if missing: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`).
- **Linux system libs** (the one step that needs sudo):

  ```bash
  sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
    libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
  ```

  (macOS: Xcode Command Line Tools. Windows: WebView2 + MSVC build tools.)

## Run / build (desktop)

From `apps/web`:

```bash
pnpm tauri dev     # launches the desktop app against the Vite dev server
pnpm tauri build   # produces installers (.deb/.AppImage, .dmg, .msi/NSIS)
```

`beforeDevCommand`/`beforeBuildCommand` in `tauri.conf.json` run the web `dev`/`build` automatically.

## Mobile (v1.x)

```bash
pnpm tauri android init && pnpm tauri android dev   # needs Android SDK/NDK + JDK
pnpm tauri ios init && pnpm tauri ios dev           # macOS + Xcode only
```

## Notes

- **Storage**: on native, palettes are written by `TauriFsPaletteStore` to the app-data dir as `<id>.json` (canonical) plus `<name>.txt` (legacy one-hex-per-line, for interop with the original Python `tab-pal`). The web build uses IndexedDB; both sit behind the same `PaletteStore` interface, selected by `isTauri()`.
- **Icons**: regenerate the full platform set (incl. `.icns`) with `pnpm tauri icon ./src-tauri/icons/icon.png`.
- **Capabilities**: `capabilities/default.json` grants scoped app-data fs + dialog access. If Tauri reports a missing permission at runtime, it prints the exact identifier to add.
