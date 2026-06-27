import type { ToolManifest } from "@/shared/types/tool";
import { generatorTool } from "@/features/generator";
import { libraryTool } from "@/features/library";
import { contrastTool } from "@/features/contrast";
import { exportTool } from "@/features/export";

/**
 * The single registry of tools. Router and nav are projections of this list.
 * Add a tool by appending its manifest here — nothing else in the app changes.
 */
export const TOOLS: ToolManifest[] = [generatorTool, libraryTool, contrastTool, exportTool];
