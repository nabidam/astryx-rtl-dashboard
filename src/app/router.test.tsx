import { render, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { RouterRoot } from "./router";

describe("router root contract", () => {
  it("sets the document direction and language for the Persian app", async () => {
    const memoryRouter = createMemoryRouter([
      { path: "*", element: <RouterRoot /> },
    ]);

    render(<RouterProvider router={memoryRouter} />);

    await waitFor(() => {
      expect(document.documentElement.getAttribute("dir")).toBe("rtl");
      expect(document.documentElement.getAttribute("lang")).toBe("fa");
    });
  });
});
