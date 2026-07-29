import { useEffect } from "react";
import { Heading, Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  useLocation,
} from "react-router";
import { useAuthStore } from "../features/auth/authStore";
import { LoginPage } from "../features/auth/LoginPage";
import { UsersPage } from "../features/users/UsersPage";
import { AppShell } from "./shell/AppShell";
import { RtlProbe } from "./shell/RtlProbe";

export function RouterRoot() {
  useEffect(() => {
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "fa";
  }, []);

  return <LoginPage />;
}

export function RequireSession() {
  const session = useAuthStore((state) => state.session);
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

function RedirectAuthenticatedUser() {
  const session = useAuthStore((state) => state.session);

  return session ? <Navigate to="/overview" replace /> : <RouterRoot />;
}

function OverviewPlaceholder() {
  return (
    <VStack gap={2}>
      <Heading level={1}>نمای کلی</Heading>
      <Text type="supporting">
        خلاصهٔ فعالیت‌ها در این بخش نمایش داده می‌شود.
      </Text>
    </VStack>
  );
}

function SettingsRoute() {
  return (
    <VStack gap={2}>
      <Heading level={1}>تنظیمات</Heading>
      <Text type="supporting">تنظیمات حساب و ظاهر در این بخش قرار دارد.</Text>
    </VStack>
  );
}

function NotFoundRoute() {
  return (
    <VStack gap={2}>
      <Heading level={1}>صفحه پیدا نشد</Heading>
      <Text type="supporting">نشانی واردشده معتبر نیست.</Text>
    </VStack>
  );
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <RedirectAuthenticatedUser />,
  },
  {
    path: "/__rtl-spike",
    element: <RtlProbe />,
  },
  {
    path: "/",
    element: <RequireSession />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="overview" replace /> },
          {
            path: "overview",
            lazy: () => Promise.resolve({ Component: OverviewPlaceholder }),
          },
          {
            path: "users",
            lazy: () => Promise.resolve({ Component: UsersPage }),
          },
          {
            path: "settings",
            lazy: () => Promise.resolve({ Component: SettingsRoute }),
          },
          {
            path: "*",
            lazy: () => Promise.resolve({ Component: NotFoundRoute }),
          },
        ],
      },
    ],
  },
]);
