import { Button } from "@astryxdesign/core/Button";
import { Center } from "@astryxdesign/core/Center";
import { Heading, Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { storage } from "../../lib/storage";

type ErrorFallbackProps = {
  onReload?: () => void;
};

function reloadPage() {
  window.location.reload();
}

export function ErrorFallback({ onReload = reloadPage }: ErrorFallbackProps) {
  function clearSavedData() {
    storage.clearAll();
    onReload();
  }

  return (
    <Center minHeight="100dvh" width="100%">
      <VStack gap={4} hAlign="center">
        <VStack gap={1} hAlign="center">
          <Heading level={1}>خطایی در برنامه رخ داد</Heading>
          <Text as="p" type="supporting">
            می‌توانید دوباره تلاش کنید یا داده‌های ذخیره‌شده را پاک کنید و از
            ابتدا شروع کنید.
          </Text>
        </VStack>
        <VStack gap={2} hAlign="center">
          <Button label="تلاش دوباره" variant="secondary" onClick={onReload} />
          <Button
            label="پاک‌کردن داده‌های ذخیره‌شده و شروع دوباره"
            variant="destructive"
            onClick={clearSavedData}
          />
        </VStack>
      </VStack>
    </Center>
  );
}
