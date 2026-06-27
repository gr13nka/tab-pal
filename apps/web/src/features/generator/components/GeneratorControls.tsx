import { modesFor, presetNames, type PaletteType } from "@tab-pal/engine";

import type { Source } from "../generator.logic";

export interface ControlsValue {
  type: PaletteType;
  source: Source;
  mode: string;
  count: number;
  presetName: string | null;
}

const TYPE_LABELS: Record<PaletteType, string> = {
  regular: "Categorical",
  "ordered-sequential": "Sequential",
  "ordered-diverging": "Diverging",
};

const fieldCls = "flex flex-col text-xs font-medium text-neutral-500";
const selectCls = "mt-1 rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900";

export function GeneratorControls({
  value,
  onChange,
}: {
  value: ControlsValue;
  onChange: (next: ControlsValue) => void;
}) {
  const modes = modesFor(value.type);
  const presets = presetNames(value.type);

  const changeType = (type: PaletteType) => {
    const nextModes = modesFor(type);
    const nextPresets = presetNames(type);
    onChange({
      ...value,
      type,
      mode: nextModes.includes(value.mode) ? value.mode : nextModes[0],
      presetName: nextPresets[0] ?? null,
    });
  };

  return (
    <>
      <label className={fieldCls}>
        Type
        <select
          className={selectCls}
          value={value.type}
          onChange={(e) => changeType(e.target.value as PaletteType)}
        >
          {(Object.keys(TYPE_LABELS) as PaletteType[]).map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </label>

      <label className={fieldCls}>
        Source
        <select
          className={selectCls}
          value={value.source}
          onChange={(e) => onChange({ ...value, source: e.target.value as Source })}
        >
          <option value="harmony">Harmony</option>
          <option value="preset">Preset</option>
        </select>
      </label>

      {value.source === "harmony" ? (
        <label className={fieldCls}>
          Mode
          <select
            className={selectCls}
            value={value.mode}
            onChange={(e) => onChange({ ...value, mode: e.target.value })}
          >
            {modes.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label className={fieldCls}>
          Preset
          <select
            className={selectCls}
            value={value.presetName ?? ""}
            onChange={(e) => onChange({ ...value, presetName: e.target.value })}
          >
            {presets.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className={fieldCls}>
        Count: {value.count}
        <input
          type="range"
          min={3}
          max={10}
          value={value.count}
          onChange={(e) => onChange({ ...value, count: Number(e.target.value) })}
          className="mt-2 w-32 accent-neutral-900"
        />
      </label>
    </>
  );
}
