import { lazy } from "react";

import type { ToolManifest } from "@/shared/types/tool";
import { DownloadIcon } from "@/shared/ui/icons";

export const exportTool: ToolManifest = {
  id: "export",
  title: "Export",
  route: "/export",
  icon: DownloadIcon,
  component: lazy(() => import("./ExportPage")),
};
