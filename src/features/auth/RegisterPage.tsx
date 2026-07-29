import { useState, type FormEvent } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Center } from "@astryxdesign/core/Center";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Link } from "@astryxdesign/core/Link";
import { Heading, Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";
import { Link as RouterLink, useNavigate } from "react-router";
import type { FieldErrors } from "./authStore";

const authCardWidth = "min(100%, calc(var(--spacing-12) * 10))";

type RegisterFields = {
  displayName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
};

function validateRegistration(fields: RegisterFields): FieldErrors {
  const errors: FieldErrors = {};

  if (!fields.displayName.trim()) {
    errors.displayName = "نام الزامی است";
  }
  if (!fields.email.trim()) {
    errors.email = "ایمیل الزامی است";
  } else if (!/^\S+@\S+\.\S+$/.test(fields.email)) {
    errors.email = "نشانی ایمیل معتبر نیست";
  }
  if (!fields.password) {
    errors.password = "گذرواژه الزامی است";
  }
  if (!fields.passwordConfirmation) {
    errors.passwordConfirmation = "تکرار گذرواژه الزامی است";
  } else if (fields.password !== fields.passwordConfirmation) {
    errors.passwordConfirmation = "گذرواژه‌ها یکسان نیستند";
  }

  return errors;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [fields, setFields] = useState<RegisterFields>({
    displayName: "",
    email: "",
    password: "",
    passwordConfirmation: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  function updateField(field: keyof RegisterFields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateRegistration(fields);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    void navigate("/login", { replace: true });
  }

  return (
    <Center minHeight="100dvh" width="100%">
      <Card elevation="low" padding={6} width={authCardWidth}>
        <VStack gap={6}>
          <VStack gap={2}>
            <Heading level={1}>ساخت حساب کاربری</Heading>
            <Text as="p" type="supporting">
              برای ساخت حساب، اطلاعات زیر را وارد کنید.
            </Text>
          </VStack>
          <form noValidate onSubmit={handleSubmit}>
            <FormLayout>
              <TextInput
                hasAutoFocus
                htmlName="displayName"
                label="نام"
                onChange={(value) => {
                  updateField("displayName", value);
                }}
                status={
                  errors.displayName
                    ? { type: "error", message: errors.displayName }
                    : undefined
                }
                value={fields.displayName}
                width="100%"
              />
              <TextInput
                htmlName="email"
                label="ایمیل"
                onChange={(value) => {
                  updateField("email", value);
                }}
                placeholder="name@example.com"
                status={
                  errors.email
                    ? { type: "error", message: errors.email }
                    : undefined
                }
                type="email"
                value={fields.email}
                width="100%"
              />
              <TextInput
                htmlName="password"
                label="گذرواژه"
                onChange={(value) => {
                  updateField("password", value);
                }}
                status={
                  errors.password
                    ? { type: "error", message: errors.password }
                    : undefined
                }
                type="password"
                value={fields.password}
                width="100%"
              />
              <TextInput
                htmlName="passwordConfirmation"
                label="تکرار گذرواژه"
                onChange={(value) => {
                  updateField("passwordConfirmation", value);
                }}
                status={
                  errors.passwordConfirmation
                    ? {
                        type: "error",
                        message: errors.passwordConfirmation,
                      }
                    : undefined
                }
                type="password"
                value={fields.passwordConfirmation}
                width="100%"
              />
              <Button
                label="ساخت حساب"
                type="submit"
                variant="primary"
                width="100%"
              />
            </FormLayout>
          </form>
          <Link as={RouterLink} href="/login" isStandalone>
            ورود به حساب کاربری
          </Link>
        </VStack>
      </Card>
    </Center>
  );
}
