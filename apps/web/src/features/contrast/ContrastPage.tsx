import { useMemo, useState } from "react";

import { Button } from "@/shared/ui/Button";
import { evaluate, formatRatio } from "./contrast.logic";
import { ColorField } from "./components/ColorField";
import { LevelBadge } from "./components/LevelBadge";

interface Pair {
  fg: string;
  bg: string;
}

export default function ContrastPage() {
  const [{ fg, bg }, setPair] = useState<Pair>({ fg: "#111111", bg: "#ffffff" });

  const result = useMemo(() => evaluate(fg, bg), [fg, bg]);

  const swap = () => setPair((p) => ({ fg: p.bg, bg: p.fg }));

  return (
    <div className="h-full overflow-auto bg-neutral-50">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
        {/* Inputs */}
        <section className="flex flex-wrap items-end gap-4 rounded-md border border-neutral-200 bg-white p-4">
          <ColorField
            label="Foreground"
            value={fg}
            onChange={(next) => setPair((p) => ({ ...p, fg: next }))}
          />
          <ColorField
            label="Background"
            value={bg}
            onChange={(next) => setPair((p) => ({ ...p, bg: next }))}
          />
          <Button onClick={swap} className="ml-auto" aria-label="Swap foreground and background">
            Swap
          </Button>
        </section>

        {/* Verdict */}
        <section className="flex flex-wrap items-center gap-x-10 gap-y-4 rounded-md border border-neutral-200 bg-white p-6">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-neutral-500">Contrast ratio</span>
            <span className="font-mono text-4xl font-semibold tabular-nums text-neutral-900">
              {formatRatio(result.ratio)}
            </span>
          </div>
          <div className="flex gap-8">
            <LevelBadge label="Normal text" level={result.normal} />
            <LevelBadge label="Large text" level={result.large} />
          </div>
        </section>

        {/* Live preview */}
        <section
          className="flex flex-col gap-3 rounded-md border border-neutral-200 p-6"
          style={{ backgroundColor: bg, color: fg }}
        >
          <span className="text-3xl font-bold">The quick brown fox</span>
          <span className="text-base">
            The quick brown fox jumps over the lazy dog. 0123456789
          </span>
          <span className="text-sm opacity-90">
            Foreground {fg.toUpperCase()} on background {bg.toUpperCase()}
          </span>
        </section>
      </div>
    </div>
  );
}
