import { lazy } from "react";

import type { ToolManifest } from "@/shared/types/tool";
import { ContrastIcon } from "@/shared/ui/icons";

export const contrastTool: ToolManifest = {
  id: "contrast",
  title: "Contrast",
  route: "/contrast",
  icon: ContrastIcon,
  component: lazy(() => import("./ContrastPage")),
};
