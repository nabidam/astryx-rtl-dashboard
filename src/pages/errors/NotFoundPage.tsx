import { Center } from "@astryxdesign/core/Center";
import { Link } from "@astryxdesign/core/Link";
import { Heading, Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { Link as RouterLink } from "react-router";

export function NotFoundPage() {
  return (
    <Center minHeight="100dvh" width="100%">
      <VStack gap={4} hAlign="center">
        <VStack gap={1} hAlign="center">
          <Heading level={1}>صفحه پیدا نشد</Heading>
          <Text as="p" type="supporting">
            نشانی واردشده معتبر نیست.
          </Text>
        </VStack>
        <Link as={RouterLink} href="/overview" isStandalone>
          بازگشت به نمای کلی
        </Link>
      </VStack>
    </Center>
  );
}
