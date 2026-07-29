import { useState, type FormEvent } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Link } from "@astryxdesign/core/Link";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@astryxdesign/core/SegmentedControl";
import { Section } from "@astryxdesign/core/Section";
import { Heading, Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";
import {
  useAuthStore,
  type FieldErrors,
  type ProfileInput,
} from "../auth/authStore";
import { useThemeStore } from "../../app/shell/themeStore";

const emptyProfile: ProfileInput = {
  displayName: "",
  email: "",
};

function inputStatus(error?: string) {
  return error ? { type: "error" as const, message: error } : undefined;
}

export function SettingsPage() {
  const profile = useAuthStore((state) => state.session?.profile);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const mode = useThemeStore((state) => state.mode);
  const toggle = useThemeStore((state) => state.toggle);
  const [values, setValues] = useState<ProfileInput>(
    () => profile ?? emptyProfile,
  );
  const [errors, setErrors] = useState<FieldErrors>({});

  function updateValue(key: keyof ProfileInput, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "", form: "" }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = updateProfile(values);

    if (!result.ok) {
      setErrors(result.errors);
    }
  }

  return (
    <VStack gap={6}>
      <VStack gap={1}>
        <Heading level={1}>تنظیمات</Heading>
        <Text type="supporting">
          حساب کاربری و ظاهر داشبورد را مدیریت کنید.
        </Text>
      </VStack>
      <Section padding={0}>
        <Card elevation="low" padding={6}>
          <VStack gap={4}>
            <VStack gap={1}>
              <Heading level={2}>پروفایل</Heading>
              <Text type="supporting">
                این اطلاعات بلافاصله در سربرگ داشبورد نمایش داده می‌شود.
              </Text>
            </VStack>
            <form noValidate onSubmit={handleSubmit}>
              <FormLayout direction="horizontal-labels">
                <TextInput
                  isRequired
                  label="نام نمایشی"
                  onChange={(value) => {
                    updateValue("displayName", value);
                  }}
                  status={inputStatus(errors.displayName)}
                  value={values.displayName}
                  width="100%"
                />
                <TextInput
                  isRequired
                  label="ایمیل"
                  onChange={(value) => {
                    updateValue("email", value);
                  }}
                  status={inputStatus(errors.email)}
                  type="email"
                  value={values.email}
                  width="100%"
                />
                {errors.form ? (
                  <Text type="supporting">{errors.form}</Text>
                ) : null}
                <Button
                  label="ذخیرهٔ تغییرات"
                  type="submit"
                  variant="primary"
                />
              </FormLayout>
            </form>
          </VStack>
        </Card>
      </Section>
      <Section padding={0}>
        <Card elevation="low" padding={6}>
          <VStack gap={4}>
            <VStack gap={1}>
              <Heading level={2}>ظاهر</Heading>
              <Text type="supporting">
                حالت رنگی دلخواهتان را انتخاب کنید؛ این انتخاب پس از بارگذاری
                دوباره نیز حفظ می‌شود.
              </Text>
            </VStack>
            <SegmentedControl
              label="حالت نمایش"
              layout="fill"
              onChange={(nextMode) => {
                if (nextMode !== mode) {
                  toggle();
                }
              }}
              value={mode}
            >
              <SegmentedControlItem label="روشن" value="light" />
              <SegmentedControlItem label="تاریک" value="dark" />
            </SegmentedControl>
            <Link
              href="https://github.com/nabidam/astryx-rtl-dashboard#readme"
              isExternalLink
              isStandalone
            >
              راهنمای شخصی‌سازی برند و تم در README
            </Link>
          </VStack>
        </Card>
      </Section>
    </VStack>
  );
}
