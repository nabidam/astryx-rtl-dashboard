import { useEffect } from "react";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  useLocation,
} from "react-router";
import { useAuthStore } from "../features/auth/authStore";
import { ForgotPasswordPage } from "../features/auth/ForgotPasswordPage";
import { LoginPage } from "../features/auth/LoginPage";
import { RegisterPage } from "../features/auth/RegisterPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { UsersPage } from "../features/users/UsersPage";
import { UserFormPage } from "../features/users/UserFormPage";
import { ErrorFallback } from "../pages/errors/ErrorFallback";
import { NotFoundPage } from "../pages/errors/NotFoundPage";
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

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <RedirectAuthenticatedUser />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/__rtl-spike",
    element: <RtlProbe />,
  },
  {
    path: "/",
    element: <RequireSession />,
    errorElement: <ErrorFallback />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="overview" replace /> },
          {
            path: "overview",
            lazy: () =>
              import("../features/overview/OverviewPage").then((module) => ({
                Component: module.OverviewPage,
              })),
          },
          {
            path: "overview-2",
            lazy: () =>
              import("../features/overview/OverviewTwoPage").then((module) => ({
                Component: module.OverviewTwoPage,
              })),
          },
          {
            path: "users",
            lazy: () => Promise.resolve({ Component: UsersPage }),
          },
          {
            path: "users/new",
            lazy: () => Promise.resolve({ Component: UserFormPage }),
          },
          {
            path: "users/:id/edit",
            lazy: () => Promise.resolve({ Component: UserFormPage }),
          },
          {
            path: "settings",
            lazy: () => Promise.resolve({ Component: SettingsPage }),
          },
          {
            path: "*",
            lazy: () => Promise.resolve({ Component: NotFoundPage }),
          },
        ],
      },
    ],
  },
]);
