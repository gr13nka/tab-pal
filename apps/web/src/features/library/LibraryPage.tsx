import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { PaletteType } from "@tab-pal/engine";

import { Color } from "@/core/domain/color";
import { createPalette } from "@/core/domain/palette";
import { usePaletteStore } from "@/core/store/paletteStore";
import { listPresets, PALETTE_TYPES, type PresetPreview } from "./library.logic";
import { PresetCard } from "./components/PresetCard";

const TYPE_LABELS: Record<PaletteType, string> = {
  regular: "Categorical",
  "ordered-sequential": "Sequential",
  "ordered-diverging": "Diverging",
};

export default function LibraryPage() {
  const [count, setCount] = useState(6);
  const navigate = useNavigate();

  const presets = useMemo(() => listPresets(count), [count]);

  // Decoupling rule: hand the preset to the active palette via the shared store,
  // then navigate by route. We never import the generator feature directly.
  const usePreset = (preset: PresetPreview) => {
    const colors = preset.colors.map((hex) => Color.of(hex));
    usePaletteStore
      .getState()
      .loadPalette(createPalette({ name: preset.name, type: preset.type, colors }));
    navigate("/generate");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-end gap-4 border-b border-neutral-200 bg-white px-4 py-3">
        <div>
          <h1 className="text-sm font-semibold text-neutral-900">Library</h1>
          <p className="text-xs text-neutral-500">
            Browse curated presets and send one to the generator.
          </p>
        </div>
        <label className="ml-auto flex flex-col text-xs font-medium text-neutral-500">
          Preview colours: {count}
          <input
            type="range"
            min={3}
            max={12}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="mt-2 w-32 accent-neutral-900"
          />
        </label>
      </div>

      <div className="flex-1 space-y-8 px-4 py-6">
        {PALETTE_TYPES.map((type) => {
          const items = presets.filter((p) => p.type === type);
          if (items.length === 0) return null;
          return (
            <section key={type}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {TYPE_LABELS[type]}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((preset) => (
                  <PresetCard
                    key={`${preset.type}:${preset.name}`}
                    name={preset.name}
                    colors={preset.colors}
                    onUse={() => usePreset(preset)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
