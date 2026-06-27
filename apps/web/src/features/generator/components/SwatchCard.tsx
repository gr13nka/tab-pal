import { bestTextColor } from "@tab-pal/engine";

import type { Color } from "@/core/domain/color";
import { CopyIcon, LockIcon, UnlockIcon } from "@/shared/ui/icons";

export function SwatchCard({
  color,
  locked,
  onToggleLock,
}: {
  color: Color;
  locked: boolean;
  onToggleLock: () => void;
}) {
  const fg = bestTextColor(color.hex);
  const copy = () => void navigator.clipboard?.writeText(color.hex);

  return (
    <div
      className="group relative flex flex-1 flex-col items-center justify-end pb-10"
      style={{ backgroundColor: color.hex, color: fg }}
    >
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          aria-label={locked ? "Unlock colour" : "Lock colour"}
          aria-pressed={locked}
          onClick={onToggleLock}
          className="rounded p-1 hover:bg-black/10"
          style={{ color: fg }}
        >
          {locked ? <LockIcon className="h-4 w-4" /> : <UnlockIcon className="h-4 w-4" />}
        </button>
        <button
          aria-label="Copy hex"
          onClick={copy}
          className="rounded p-1 hover:bg-black/10"
          style={{ color: fg }}
        >
          <CopyIcon className="h-4 w-4" />
        </button>
      </div>
      <span className="font-mono text-sm font-semibold uppercase tracking-wide">
        {color.hex.replace("#", "")}
      </span>
      {locked && (
        <span className="mt-1 text-[10px] uppercase tracking-widest opacity-80">locked</span>
      )}
    </div>
  );
}
