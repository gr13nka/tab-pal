import { Suspense } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";

import { AppLayout } from "./AppLayout";
import { TOOLS } from "./navigation/manifest";

const Fallback = <div className="p-6 text-sm text-neutral-500">Loading…</div>;

// Module-local: not exported, so its (un-nameable) router type never leaks.
const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to={TOOLS[0].route} replace /> },
      ...TOOLS.map((tool) => ({
        path: tool.route.replace(/^\//, ""),
        element: <Suspense fallback={Fallback}>{<tool.component />}</Suspense>,
      })),
    ],
  },
], {
  future: { v7_relativeSplatPath: true },
});

export function AppRouter() {
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />;
}
