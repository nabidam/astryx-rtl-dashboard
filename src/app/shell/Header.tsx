import { IconButton } from "@astryxdesign/core/IconButton";
import { Icon } from "@astryxdesign/core/Icon";
import { HStack } from "@astryxdesign/core/HStack";
import { TopNav, TopNavHeading } from "@astryxdesign/core/TopNav";
import { Text } from "@astryxdesign/core/Text";
import { useNavigate } from "react-router";
import { useAuthStore } from "../../features/auth/authStore";
import { useThemeStore } from "./themeStore";

export function Header() {
  const navigate = useNavigate();
  const displayName = useAuthStore(
    (state) => state.session?.profile.displayName ?? "کاربر",
  );
  const logout = useAuthStore((state) => state.logout);
  const mode = useThemeStore((state) => state.mode);
  const toggle = useThemeStore((state) => state.toggle);
  const nextModeLabel =
    mode === "light" ? "تغییر به حالت تاریک" : "تغییر به حالت روشن";

  return (
    <TopNav
      endContent={
        <HStack gap={2} vAlign="center">
          <Text type="label">{displayName}</Text>
          <IconButton
            icon={<Icon icon={mode === "light" ? "eyeSlash" : "viewColumns"} />}
            label={nextModeLabel}
            tooltip={nextModeLabel}
            variant="ghost"
            onClick={toggle}
          />
          <IconButton
            icon={<Icon icon="close" />}
            label="خروج از حساب"
            tooltip="خروج از حساب"
            variant="ghost"
            onClick={() => {
              logout();
              void navigate("/login", { replace: true });
            }}
          />
        </HStack>
      }
      heading={<TopNavHeading heading="مدیریت" headingHref="/overview" />}
      label="ناوبری داشبورد"
    />
  );
}
