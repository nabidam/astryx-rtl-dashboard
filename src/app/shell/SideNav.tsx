import {
  SideNav as AstryxSideNav,
  SideNavHeading,
  SideNavItem,
  SideNavSection,
} from "@astryxdesign/core/SideNav";
import { useLocation, useNavigate } from "react-router";

const routes = [
  { href: "/overview", label: "نمای کلی" },
  { href: "/overview-2", label: "نمای کلی ۲" },
  { href: "/users", label: "کاربران" },
  { href: "/settings", label: "تنظیمات" },
] as const;

export function SideNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <AstryxSideNav
      collapsible={{ buttonLabel: "جمع‌کردن نوار کناری" }}
      header={
        <SideNavHeading heading="داشبورد آستریکس" headingHref="/overview" />
      }
    >
      <SideNavSection title="مدیریت">
        {routes.map((route) => (
          <SideNavItem
            key={route.href}
            href={route.href}
            isSelected={location.pathname === route.href}
            label={route.label}
            onClick={(event) => {
              event.preventDefault();
              void navigate(route.href);
            }}
          />
        ))}
      </SideNavSection>
    </AstryxSideNav>
  );
}
