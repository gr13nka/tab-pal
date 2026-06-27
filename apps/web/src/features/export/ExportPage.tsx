import { useMemo, useState } from "react";

import { usePaletteStore } from "@/core/store/paletteStore";
import { Button } from "@/shared/ui/Button";
import { CopyIcon, DownloadIcon } from "@/shared/ui/icons";

import { downloadText } from "./download";
import { EXPORTERS } from "./exporters";

export default function ExportPage() {
  const palette = usePaletteStore((s) => s.palette);
  const [exporterId, setExporterId] = useState(EXPORTERS[0].id);
  const [copied, setCopied] = useState(false);

  const exporter = useMemo(
    () => EXPORTERS.find((e) => e.id === exporterId) ?? EXPORTERS[0],
    [exporterId],
  );

  const isEmpty = palette.colors.length === 0;
  const output = useMemo(
    () => (isEmpty ? "" : exporter.serialize(palette)),
    [exporter, palette, isEmpty],
  );

  const filename = `${palette.name.trim() || "palette"}.${exporter.ext}`;

  const copy = async () => {
    await navigator.clipboard?.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const download = () => downloadText(filename, exporter.mime, output);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-end gap-4 border-b border-neutral-200 bg-white px-4 py-3">
        <label className="flex flex-col text-xs font-medium text-neutral-500">
          Format
          <select
            className="mt-1 rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900"
            value={exporter.id}
            onChange={(e) => setExporterId(e.target.value)}
          >
            {EXPORTERS.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.label}
              </option>
            ))}
          </select>
        </label>

        <div className="ml-auto flex items-end gap-2">
          <Button onClick={() => void copy()} disabled={isEmpty}>
            <CopyIcon className="h-4 w-4" />
            {copied ? "Copied ✓" : "Copy"}
          </Button>
          <Button variant="primary" onClick={download} disabled={isEmpty}>
            <DownloadIcon className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {isEmpty ? (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            No colours to export. Generate or open a palette first.
          </div>
        ) : (
          <textarea
            readOnly
            value={output}
            spellCheck={false}
            className="h-full w-full resize-none rounded-md border border-neutral-200 bg-neutral-50 p-3 font-mono text-xs text-neutral-800"
          />
        )}
      </div>

      <p className="border-t border-neutral-200 bg-white px-4 py-1.5 text-xs text-neutral-400">
        Exporting <span className="font-mono">{filename}</span> · {palette.colors.length} colour
        {palette.colors.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}
