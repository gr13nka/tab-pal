import { NavLink, Outlet } from "react-router-dom";

import { useHistory } from "@/core/store/hooks";
import { Button } from "@/shared/ui/Button";
import { cn } from "@/shared/ui/cn";
import { TOOLS } from "./navigation/manifest";

export function AppLayout() {
  const { undo, redo, canUndo, canRedo } = useHistory();

  return (
    <div className="flex h-full flex-col bg-neutral-50 text-neutral-900">
      <header className="flex items-center gap-4 border-b border-neutral-200 bg-white px-4 py-2">
        <span className="text-base font-semibold tracking-tight">tab-pal</span>
        <nav className="flex gap-1">
          {TOOLS.map((tool) => (
            <NavLink
              key={tool.id}
              to={tool.route}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100",
                )
              }
            >
              <tool.icon className="h-4 w-4" />
              {tool.title}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex gap-1">
          <Button variant="ghost" onClick={() => undo()} disabled={!canUndo}>
            Undo
          </Button>
          <Button variant="ghost" onClick={() => redo()} disabled={!canRedo}>
            Redo
          </Button>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
