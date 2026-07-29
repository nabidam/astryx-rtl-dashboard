import { useState, type FormEvent } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Field } from "@astryxdesign/core/Field";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { HStack } from "@astryxdesign/core/HStack";
import { Selector } from "@astryxdesign/core/Selector";
import { Heading, Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";
import { Navigate, useNavigate, useParams } from "react-router";
import { JalaliPicker } from "../../components/jalali-picker/JalaliPicker";
import { formatJalali, type JalaliDate } from "../../lib/date";
import { toLatinDigits } from "../../lib/digits";
import {
  useUsersStore,
  type FieldErrors,
  type User,
  type UserRole,
  type UserStatus,
} from "./usersStore";

type UserFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  birthDate: JalaliDate | null;
};

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: "admin", label: "مدیر" },
  { value: "editor", label: "ویرایشگر" },
  { value: "viewer", label: "بیننده" },
];

const statusOptions: Array<{ value: UserStatus; label: string }> = [
  { value: "active", label: "فعال" },
  { value: "inactive", label: "غیرفعال" },
];

const emptyValues: UserFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  role: "viewer",
  status: "active",
  birthDate: null,
};

function jalaliValue(iso: string): JalaliDate {
  const [year, month, day] = toLatinDigits(formatJalali(iso))
    .split("/")
    .map(Number);

  return { year, month, day };
}

function valuesFromUser(user: User): UserFormValues {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    status: user.status,
    birthDate: jalaliValue(user.birthDate),
  };
}

function inputStatus(error?: string) {
  return error ? { type: "error" as const, message: error } : undefined;
}

export function UserFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const users = useUsersStore((state) => state.users);
  const create = useUsersStore((state) => state.create);
  const update = useUsersStore((state) => state.update);
  const editingUser = id ? users.find((user) => user.id === id) : undefined;
  const isEditing = id !== undefined;
  const [values, setValues] = useState<UserFormValues>(() =>
    editingUser ? valuesFromUser(editingUser) : emptyValues,
  );
  const [errors, setErrors] = useState<FieldErrors>({});

  if (isEditing && !editingUser) {
    return <Navigate replace to="/users" />;
  }

  function updateValue<Key extends keyof UserFormValues>(
    key: Key,
    value: UserFormValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "", form: "" }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = { ...values, birthDate: values.birthDate };
    const result = isEditing
      ? update(id, input as Parameters<typeof update>[1])
      : create(input as Parameters<typeof create>[0]);

    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    void navigate("/users", { replace: true });
  }

  const title = isEditing ? "ویرایش کاربر" : "افزودن کاربر";

  return (
    <VStack gap={6}>
      <VStack gap={1}>
        <Heading level={1}>{title}</Heading>
        <Text type="supporting">
          اطلاعات کاربر را وارد کنید. تاریخ تولد بر پایهٔ تقویم جلالی است.
        </Text>
      </VStack>
      <form noValidate onSubmit={handleSubmit}>
        <FormLayout>
          <TextInput
            hasAutoFocus
            isRequired
            label="نام"
            onChange={(value) => {
              updateValue("firstName", value);
            }}
            status={inputStatus(errors.firstName)}
            value={values.firstName}
            width="100%"
          />
          <TextInput
            isRequired
            label="نام خانوادگی"
            onChange={(value) => {
              updateValue("lastName", value);
            }}
            status={inputStatus(errors.lastName)}
            value={values.lastName}
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
          <Selector
            isRequired
            label="نقش"
            onChange={(value) => {
              updateValue("role", value as UserRole);
            }}
            options={roleOptions}
            status={inputStatus(errors.role)}
            value={values.role}
          />
          <Selector
            isRequired
            label="وضعیت"
            onChange={(value) => {
              updateValue("status", value as UserStatus);
            }}
            options={statusOptions}
            status={inputStatus(errors.status)}
            value={values.status}
          />
          <Field
            inputID="birth-date"
            isRequired
            label="تاریخ تولد"
            status={inputStatus(errors.birthDate)}
            statusVariant="detached"
          >
            <JalaliPicker
              onChange={(date) => {
                updateValue("birthDate", date);
              }}
              value={values.birthDate}
            />
          </Field>
          {errors.form ? <Text type="supporting">{errors.form}</Text> : null}
          <HStack gap={2} hAlign="end">
            <Button
              label="انصراف"
              onClick={() => void navigate("/users")}
              type="button"
              variant="secondary"
            />
            <Button label="ذخیرهٔ کاربر" type="submit" variant="primary" />
          </HStack>
        </FormLayout>
      </form>
    </VStack>
  );
}
