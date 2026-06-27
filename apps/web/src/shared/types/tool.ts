import type { ComponentType, LazyExoticComponent } from "react";

/**
 * A tool's self-description. The app's router and nav are pure projections of the
 * list of these (see app/navigation/manifest.ts). Adding a tool = create its
 * feature folder + add one entry to TOOLS. Tools never reference each other.
 */
export interface ToolManifest {
  id: string;
  title: string;
  /** Absolute route path, e.g. "/generate". */
  route: string;
  icon: ComponentType<{ className?: string }>;
  /** Lazily-loaded route component (code-split per tool). */
  component: LazyExoticComponent<ComponentType>;
  navGroup?: "tools" | "library";
  /** Optional feature-flag seam (interface only in v1). */
  enabled?: () => boolean;
}
