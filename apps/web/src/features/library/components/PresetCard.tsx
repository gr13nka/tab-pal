import { Button } from "@/shared/ui/Button";

/** Presentational preset tile: name, a horizontal mini swatch row, and a Use button. */
export function PresetCard({
  name,
  colors,
  onUse,
}: {
  name: string;
  colors: string[];
  onUse: () => void;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-neutral-200 bg-white">
      <div className="flex h-12 w-full" aria-hidden>
        {colors.map((hex, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: hex }} />
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="truncate text-sm font-medium text-neutral-900" title={name}>
          {name}
        </span>
        <Button variant="primary" onClick={onUse} className="shrink-0">
          Use
        </Button>
      </div>
    </div>
  );
}
