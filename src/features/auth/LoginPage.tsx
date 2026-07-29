import { useState, type FormEvent } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Center } from "@astryxdesign/core/Center";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Heading, Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";
import { useNavigate } from "react-router";
import { useAuthStore, type FieldErrors } from "./authStore";

const loginCardWidth = "min(100%, calc(var(--spacing-12) * 10))";

function validateCredentials(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};

  if (!email.trim()) {
    errors.email = "ایمیل الزامی است";
  }
  if (!password.trim()) {
    errors.password = "گذرواژه الزامی است";
  }

  return errors;
}

export function LoginPage() {
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateCredentials(email, password);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    login({ email, password });
    void navigate("/overview", { replace: true });
  }

  return (
    <Center minHeight="100dvh" width="100%">
      <Card elevation="low" padding={6} width={loginCardWidth}>
        <VStack gap={6}>
          <VStack gap={2}>
            <Heading level={1}>ورود به حساب کاربری</Heading>
            <Text as="p" type="supporting">
              برای ادامه به داشبورد مدیریت وارد شوید.
            </Text>
          </VStack>
          <form noValidate onSubmit={handleSubmit}>
            <FormLayout>
              <TextInput
                hasAutoFocus
                htmlName="email"
                label="ایمیل"
                onChange={(value) => {
                  setEmail(value);
                  setErrors((current) => ({ ...current, email: "" }));
                }}
                placeholder="name@example.com"
                status={
                  errors.email
                    ? { type: "error", message: errors.email }
                    : undefined
                }
                type="text"
                value={email}
                width="100%"
              />
              <TextInput
                htmlName="password"
                label="گذرواژه"
                onChange={(value) => {
                  setPassword(value);
                  setErrors((current) => ({ ...current, password: "" }));
                }}
                status={
                  errors.password
                    ? { type: "error", message: errors.password }
                    : undefined
                }
                type="password"
                value={password}
                width="100%"
              />
              <Button
                label="ورود به داشبورد"
                type="submit"
                variant="primary"
                width="100%"
              />
            </FormLayout>
          </form>
        </VStack>
      </Card>
    </Center>
  );
}
