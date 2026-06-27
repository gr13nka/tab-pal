import { useEffect, useState } from "react";

import { isValidHex, normalizeHex } from "../contrast.logic";

/**
 * A labelled colour input pairing a native swatch picker with a hex text field.
 *
 * The two stay in sync via the committed `value` (always a canonical "#rrggbb").
 * The text field keeps its own draft so partial/invalid typing is tolerated, and
 * only commits upward when it forms a valid 6-digit hex.
 */
export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  // Re-sync the draft when the committed value changes externally (e.g. a swap).
  useEffect(() => setDraft(value), [value]);

  const commitDraft = (raw: string) => {
    setDraft(raw);
    if (isValidHex(raw)) onChange(normalizeHex(raw));
  };

  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
      {label}
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} colour picker`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded-md border border-neutral-300 bg-white p-0.5"
        />
        <input
          type="text"
          inputMode="text"
          spellCheck={false}
          aria-label={`${label} hex value`}
          value={draft}
          onChange={(e) => commitDraft(e.target.value)}
          onBlur={() => setDraft(value)}
          className="w-28 rounded-md border border-neutral-300 px-2 py-1 font-mono text-sm uppercase text-neutral-900"
        />
      </div>
    </label>
  );
}
