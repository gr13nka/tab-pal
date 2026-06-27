import { lazy } from "react";

import type { ToolManifest } from "@/shared/types/tool";
import { GridIcon } from "@/shared/ui/icons";

export const libraryTool: ToolManifest = {
  id: "library",
  title: "Library",
  route: "/library",
  icon: GridIcon,
  component: lazy(() => import("./LibraryPage")),
  navGroup: "library",
};
