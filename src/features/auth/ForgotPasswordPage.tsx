import { useState, type FormEvent } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Center } from "@astryxdesign/core/Center";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Link } from "@astryxdesign/core/Link";
import { Heading, Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";
import { Link as RouterLink } from "react-router";

const authCardWidth = "min(100%, calc(var(--spacing-12) * 10))";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setEmailError("ایمیل الزامی است");
      setIsSubmitted(false);
      return;
    }

    setEmailError("");
    setIsSubmitted(true);
  }

  return (
    <Center minHeight="100dvh" width="100%">
      <Card elevation="low" padding={6} width={authCardWidth}>
        <VStack gap={6}>
          <VStack gap={2}>
            <Heading level={1}>بازیابی گذرواژه</Heading>
            <Text as="p" type="supporting">
              نشانی ایمیل خود را وارد کنید تا راهنمای بازیابی را نمایش دهیم.
            </Text>
          </VStack>
          {isSubmitted ? (
            <VStack gap={3}>
              <Text as="p" type="supporting">
                اگر حسابی با این ایمیل وجود داشته باشد، راهنمای بازیابی برای آن
                ارسال می‌شود.
              </Text>
              <Link as={RouterLink} href="/login" isStandalone>
                بازگشت به ورود
              </Link>
            </VStack>
          ) : (
            <form noValidate onSubmit={handleSubmit}>
              <FormLayout>
                <TextInput
                  hasAutoFocus
                  htmlName="email"
                  label="ایمیل"
                  onChange={(value) => {
                    setEmail(value);
                    setEmailError("");
                  }}
                  placeholder="name@example.com"
                  status={
                    emailError
                      ? { type: "error", message: emailError }
                      : undefined
                  }
                  type="email"
                  value={email}
                  width="100%"
                />
                <Button
                  label="ادامه"
                  type="submit"
                  variant="primary"
                  width="100%"
                />
              </FormLayout>
            </form>
          )}
          {!isSubmitted ? (
            <Link as={RouterLink} href="/login" isStandalone>
              بازگشت به ورود
            </Link>
          ) : null}
        </VStack>
      </Card>
    </Center>
  );
}
