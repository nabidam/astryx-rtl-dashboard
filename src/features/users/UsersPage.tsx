import { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { HStack } from "@astryxdesign/core/HStack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { useNavigate } from "react-router";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { UsersTable } from "./UsersTable";
import { useUsersStore, type User } from "./usersStore";

export function UsersPage() {
  const navigate = useNavigate();
  const users = useUsersStore((state) => state.users);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  return (
    <VStack gap={4}>
      <HStack hAlign="between" vAlign="end">
        <VStack gap={1}>
          <Heading level={1}>کاربران</Heading>
          <Text type="supporting">جست‌وجو، مرتب‌سازی و مدیریت کاربران</Text>
        </VStack>
        <Button
          label="افزودن کاربر"
          onClick={() => void navigate("/users/new")}
          variant="primary"
        />
      </HStack>
      <UsersTable
        onCreate={() => void navigate("/users/new")}
        onDelete={(user) => {
          setUserToDelete(user);
        }}
        onEdit={(user) => {
          void navigate(`/users/${user.id}/edit`);
        }}
      />
      <DeleteUserDialog
        onClose={() => {
          setUserToDelete(null);
        }}
        user={
          userToDelete
            ? (users.find((user) => user.id === userToDelete.id) ?? null)
            : null
        }
      />
    </VStack>
  );
}
