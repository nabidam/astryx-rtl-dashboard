import type { ReactNode } from "react";
import { AppShell as AstryxAppShell } from "@astryxdesign/core/AppShell";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";
import { Theme, defineTheme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import { Outlet } from "react-router";
import "../../features/users/usersStore";
import faMessages from "../../locale/fa.json";
import { useThemeStore } from "./themeStore";
import { Header } from "./Header";
import { SideNav } from "./SideNav";
import { StorageBanner } from "./StorageBanner";

const rtlTheme = defineTheme({
  name: "astryx-rtl-dashboard-shell",
  extends: neutralTheme,
  typography: {
    body: { family: "Vazirmatn", fallbacks: "sans-serif" },
    heading: { family: "Vazirmatn", fallbacks: "sans-serif" },
    code: { family: "ui-monospace", fallbacks: "monospace" },
  },
});

type ShellProps = {
  children?: ReactNode;
};

export function AppShell({ children }: ShellProps) {
  const mode = useThemeStore((state) => state.mode);

  return (
    <Theme theme={rtlTheme} mode={mode}>
      <InternationalizationProvider locale="fa" messages={{ fa: faMessages }}>
        <AstryxAppShell
          banner={<StorageBanner />}
          contentPadding={4}
          height="fill"
          mobileNav={{ breakpoint: "md" }}
          sideNav={<SideNav />}
          topNav={<Header />}
          variant="section"
        >
          {children ?? <OutletContent />}
        </AstryxAppShell>
      </InternationalizationProvider>
    </Theme>
  );
}

function OutletContent() {
  return <Outlet />;
}
