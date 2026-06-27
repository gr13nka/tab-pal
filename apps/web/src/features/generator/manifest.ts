import { lazy } from "react";

import type { ToolManifest } from "@/shared/types/tool";
import { PaletteIcon } from "@/shared/ui/icons";

export const generatorTool: ToolManifest = {
  id: "generator",
  title: "Generator",
  route: "/generate",
  icon: PaletteIcon,
  component: lazy(() => import("./GeneratorPage")),
};
