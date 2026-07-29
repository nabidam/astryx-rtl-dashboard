import { Banner } from "@astryxdesign/core/Banner";
import { VStack } from "@astryxdesign/core/VStack";
import { storage } from "../../lib/storage";

export function StorageBanner() {
  if (!storage.recovered && !storage.memoryOnly) {
    return null;
  }

  return (
    <VStack gap={1}>
      {storage.recovered ? (
        <Banner
          container="section"
          status="info"
          title="داده‌های ذخیره‌شده بازنشانی شد"
        />
      ) : null}
      {storage.memoryOnly ? (
        <Banner
          container="section"
          description="برنامه در حافظه اجرا می‌شود؛ با بارگذاری دوباره، تغییرات از دست می‌روند."
          status="warning"
          title="ذخیره‌سازی در دسترس نیست"
        />
      ) : null}
    </VStack>
  );
}
