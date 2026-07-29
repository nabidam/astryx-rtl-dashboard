import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { useUsersStore, type User } from "./usersStore";

type DeleteUserDialogProps = {
  user: User | null;
  onClose: () => void;
};

export function DeleteUserDialog({ user, onClose }: DeleteUserDialogProps) {
  const remove = useUsersStore((state) => state.remove);

  if (!user) {
    return null;
  }

  return (
    <AlertDialog
      actionLabel="حذف کاربر"
      cancelLabel="انصراف"
      description={`کاربر «${user.firstName} ${user.lastName}» و اطلاعات او حذف می‌شود. این عمل قابل بازگشت نیست.`}
      isOpen
      onAction={() => {
        remove(user.id);
        onClose();
      }}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
      title="حذف کاربر؟"
    />
  );
}
