import type { WcagLevel } from "@tab-pal/engine";

import { cn } from "@/shared/ui/cn";

/** Tailwind classes per WCAG level: green-ish for passes, amber for the large-only band, red for fails. */
const LEVEL_STYLES: Record<WcagLevel, string> = {
  AAA: "bg-green-100 text-green-800 border-green-300",
  AA: "bg-green-100 text-green-800 border-green-300",
  "AA Large": "bg-amber-100 text-amber-800 border-amber-300",
  Fail: "bg-red-100 text-red-800 border-red-300",
};

/** A labelled pill showing the WCAG verdict for one text size. */
export function LevelBadge({ label, level }: { label: string; level: WcagLevel }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-neutral-500">{label}</span>
      <span
        className={cn(
          "inline-flex w-fit items-center rounded-md border px-2.5 py-1 text-sm font-semibold",
          LEVEL_STYLES[level],
        )}
      >
        {level}
      </span>
    </div>
  );
}
