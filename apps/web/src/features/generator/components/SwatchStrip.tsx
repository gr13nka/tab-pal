import { usePaletteStore } from "@/core/store/paletteStore";
import { SwatchCard } from "./SwatchCard";

export function SwatchStrip() {
  const colors = usePaletteStore((s) => s.palette.colors);
  const locks = usePaletteStore((s) => s.locks);
  const toggleLock = usePaletteStore((s) => s.toggleLock);

  if (colors.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-400">
        No colours yet — generate a palette.
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col sm:flex-row">
      {colors.map((color, i) => (
        <SwatchCard
          key={i}
          color={color}
          locked={locks[i] ?? false}
          onToggleLock={() => toggleLock(i)}
        />
      ))}
    </div>
  );
}
