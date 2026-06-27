import { useCallback, useEffect, useState } from "react";
import { modesFor, presetNames } from "@tab-pal/engine";

import { usePaletteStore } from "@/core/store/paletteStore";
import { useStorage } from "@/core/storage/StorageProvider";
import { Button } from "@/shared/ui/Button";
import { buildColors } from "./generator.logic";
import { GeneratorControls, type ControlsValue } from "./components/GeneratorControls";
import { SwatchStrip } from "./components/SwatchStrip";

function defaultControls(): ControlsValue {
  return {
    type: "regular",
    source: "harmony",
    mode: modesFor("regular")[0],
    count: 5,
    presetName: presetNames("regular")[0] ?? null,
  };
}

export default function GeneratorPage() {
  const [controls, setControls] = useState<ControlsValue>(defaultControls);
  const setColors = usePaletteStore((s) => s.setColors);
  const replaceUnlocked = usePaletteStore((s) => s.replaceUnlocked);
  const setType = usePaletteStore((s) => s.setType);
  const rename = usePaletteStore((s) => s.rename);
  const name = usePaletteStore((s) => s.palette.name);
  const store = useStorage();

  const [draftName, setDraftName] = useState(name);
  const [saved, setSaved] = useState(false);

  useEffect(() => setDraftName(name), [name]);

  const applyFresh = useCallback(
    (c: ControlsValue) => {
      setType(c.type);
      setColors(buildColors(c, Math.random() * 360));
    },
    [setColors, setType],
  );

  const regenerate = useCallback(() => {
    replaceUnlocked(buildColors(controls, Math.random() * 360));
  }, [controls, replaceUnlocked]);

  // Seed an initial palette once (getState avoids a double-seed under StrictMode).
  useEffect(() => {
    if (usePaletteStore.getState().palette.colors.length === 0) applyFresh(controls);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Space regenerates (unless typing in a form control).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el instanceof HTMLInputElement || el instanceof HTMLSelectElement;
      if (e.code === "Space" && !typing) {
        e.preventDefault();
        regenerate();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [regenerate]);

  const onControlsChange = (next: ControlsValue) => {
    setControls(next);
    applyFresh(next);
  };

  const save = async () => {
    await store.put(usePaletteStore.getState().palette);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-end gap-4 border-b border-neutral-200 bg-white px-4 py-3">
        <GeneratorControls value={controls} onChange={onControlsChange} />
        <div className="ml-auto flex items-end gap-2">
          <label className="flex flex-col text-xs font-medium text-neutral-500">
            Name
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={() => rename(draftName)}
              className="mt-1 rounded-md border border-neutral-300 px-2 py-1 text-sm text-neutral-900"
            />
          </label>
          <Button variant="primary" onClick={regenerate}>
            Regenerate
          </Button>
          <Button onClick={() => void save()}>{saved ? "Saved ✓" : "Save"}</Button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <SwatchStrip />
      </div>

      <p className="border-t border-neutral-200 bg-white px-4 py-1.5 text-xs text-neutral-400">
        Press <kbd className="rounded border border-neutral-300 px-1">Space</kbd> to regenerate ·
        click a swatch&apos;s lock to keep it through regenerations
      </p>
    </div>
  );
}
