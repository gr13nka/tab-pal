import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import { App } from "./App";

describe("App (smoke)", () => {
  it("mounts, shows the tool nav, and lazy-loads the generator", async () => {
    render(<App />);

    // Nav is a projection of the tool manifest — all four tools appear.
    expect(await screen.findByRole("link", { name: /Generator/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Library/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Contrast/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Export/i })).toBeInTheDocument();

    // Default route redirects to the generator, which lazy-loads and seeds a palette.
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Regenerate/i })).toBeInTheDocument(),
    );

    // Seeding produced swatches with hex labels (engine -> store -> UI all wired).
    await waitFor(() =>
      expect(screen.getAllByText(/^[0-9a-f]{6}$/i).length).toBeGreaterThan(0),
    );
  });
});
