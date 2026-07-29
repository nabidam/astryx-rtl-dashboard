import { Heading, Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { UsersTable } from "./UsersTable";

export function UsersPage() {
  return (
    <VStack gap={4}>
      <VStack gap={1}>
        <Heading level={1}>کاربران</Heading>
        <Text type="supporting">جست‌وجو، مرتب‌سازی و مدیریت کاربران</Text>
      </VStack>
      <UsersTable />
    </VStack>
  );
}
