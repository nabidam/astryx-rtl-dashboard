import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";
import { defineTheme, Theme } from "@astryxdesign/core/theme";
import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";
import "@astryxdesign/theme-neutral/theme.css";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import "vazirmatn/Vazirmatn-Variable-font-face.css";
import { router } from "./app/router";

const root = document.getElementById("root");

if (!root) {
  throw new Error("ریشه برنامه پیدا نشد");
}

document.documentElement.dir = "rtl";
document.documentElement.lang = "fa";
const rtlTheme = defineTheme({
  name: "astryx-rtl-dashboard",
  extends: neutralTheme,
  typography: {
    body: { family: "Vazirmatn", fallbacks: "sans-serif" },
    heading: { family: "Vazirmatn", fallbacks: "sans-serif" },
    code: { family: "ui-monospace", fallbacks: "monospace" },
  },
});

createRoot(root).render(
  <StrictMode>
    <Theme theme={rtlTheme} mode="light">
      <RouterProvider router={router} />
    </Theme>
  </StrictMode>,
);
