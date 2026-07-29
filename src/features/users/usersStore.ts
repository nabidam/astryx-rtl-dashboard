import { create } from "zustand";
import {
  isValidJalaliDate,
  jalaliToIso,
  type JalaliDate,
} from "../../lib/date";
import { toLatinDigits } from "../../lib/digits";
import { storage, type PersistedUser } from "../../lib/storage";
import { fixtures } from "./fixtures";

export type User = PersistedUser;
export type UserRole = User["role"];
export type UserStatus = User["status"];

export type UserInput = {
  firstName: string;
  lastName: string;
  email: string;
  role?: UserRole;
  status?: UserStatus;
  birthDate: JalaliDate;
};

export type FieldErrors = Record<string, string>;

export type Result<T = void> =
  | { ok: true; value: T }
  | { ok: false; errors: FieldErrors };

export type SortField =
  | "name"
  | "firstName"
  | "lastName"
  | "email"
  | "birthDate"
  | "createdAt";

export type SortDirection = "asc" | "desc";

export type UserSort =
  | SortField
  | `${SortField}-${SortDirection}`
  | `${SortField}:${SortDirection}`
  | {
      field?: SortField;
      key?: SortField;
      by?: SortField;
      direction?: SortDirection;
      order?: SortDirection;
    };

export type UserFilter =
  | "all"
  | UserRole
  | UserStatus
  | {
      role?: UserRole | "all";
      status?: UserStatus | "all";
    };

export type UserQuery = {
  search?: string;
  sort?: UserSort;
  filter?: UserFilter;
  page?: number;
  pageSize?: number;
};

export type UsersState = {
  users: User[];
  create: (input: UserInput) => Result<User>;
  update: (id: string, input: UserInput) => Result<User>;
  remove: (id: string) => void;
  query: (options?: UserQuery) => User[];
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_PAGE_SIZE = 10;

function normalizeText(value: string): string {
  return toLatinDigits(value)
    .trim()
    .toLocaleLowerCase("fa")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u200c\u200e\u200f]/g, "");
}

function normalizeEmail(value: string): string {
  return normalizeText(value);
}

function isJalaliInput(value: unknown): value is JalaliDate {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.year === "number" &&
    typeof candidate.month === "number" &&
    typeof candidate.day === "number" &&
    isValidJalaliDate({
      year: candidate.year,
      month: candidate.month,
      day: candidate.day,
    })
  );
}

function isFutureIsoDate(iso: string): boolean {
  return Date.parse(`${iso}T00:00:00.000Z`) > Date.now();
}

function validateInput(
  input: unknown,
  users: User[],
  editingId?: string,
): Result<{
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  birthDate: string;
}> {
  const errors: FieldErrors = {};
  const candidate =
    typeof input === "object" && input !== null && !Array.isArray(input)
      ? (input as Partial<UserInput>)
      : {};
  const firstName =
    typeof candidate.firstName === "string" ? candidate.firstName.trim() : "";
  const lastName =
    typeof candidate.lastName === "string" ? candidate.lastName.trim() : "";
  const email =
    typeof candidate.email === "string" ? normalizeEmail(candidate.email) : "";

  if (!firstName) {
    errors.firstName = "نام الزامی است";
  }
  if (!lastName) {
    errors.lastName = "نام خانوادگی الزامی است";
  }
  if (!email) {
    errors.email = "ایمیل الزامی است";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "ایمیل معتبر نیست";
  } else if (
    users.some(
      (user) => user.id !== editingId && normalizeEmail(user.email) === email,
    )
  ) {
    errors.email = "این ایمیل قبلاً ثبت شده است";
  }

  let birthDate = "";
  if (!isJalaliInput(candidate.birthDate)) {
    errors.birthDate = "تاریخ تولد معتبر نیست";
  } else {
    try {
      birthDate = jalaliToIso(candidate.birthDate);
      if (isFutureIsoDate(birthDate)) {
        errors.birthDate = "تاریخ تولد نمی‌تواند در آینده باشد";
      }
    } catch {
      errors.birthDate = "تاریخ تولد معتبر نیست";
    }
  }

  const roleValue: unknown = candidate.role ?? "viewer";
  const role = roleValue;
  if (
    roleValue !== "admin" &&
    roleValue !== "editor" &&
    roleValue !== "viewer"
  ) {
    errors.role = "نقش کاربر معتبر نیست";
  }

  const statusValue: unknown = candidate.status ?? "active";
  const status = statusValue;
  if (statusValue !== "active" && statusValue !== "inactive") {
    errors.status = "وضعیت کاربر معتبر نیست";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      firstName,
      lastName,
      email,
      role: role as UserRole,
      status: status as UserStatus,
      birthDate,
    },
  };
}

function createId(): string {
  try {
    return globalThis.crypto.randomUUID();
  } catch {
    return `user-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2)}`;
  }
}

function hydrateUsers(): User[] {
  const persisted = storage.read("users");
  if (persisted !== null) {
    return persisted;
  }

  const seeded = fixtures.map((user) => ({ ...user }));
  storage.write("users", seeded);
  return seeded;
}

function persistUsers(users: User[]): void {
  storage.write("users", users);
}

function sortDetails(sort: UserSort): {
  field: SortField;
  direction: SortDirection;
} {
  if (typeof sort === "object") {
    return {
      field: sort.field ?? sort.key ?? sort.by ?? "name",
      direction: sort.direction ?? sort.order ?? "asc",
    };
  }

  const match = sort.match(/^(.+?)(?:[-:](asc|desc))?$/);
  const rawField = match?.[1] ?? "name";
  const field: SortField =
    rawField === "firstName" ||
    rawField === "lastName" ||
    rawField === "email" ||
    rawField === "birthDate" ||
    rawField === "createdAt"
      ? rawField
      : "name";

  return { field, direction: match?.[2] === "desc" ? "desc" : "asc" };
}

function sortValue(user: User, field: SortField): string {
  if (field === "name") {
    return normalizeText(`${user.firstName} ${user.lastName}`);
  }

  return normalizeText(user[field]);
}

function matchesFilter(user: User, filter: UserFilter): boolean {
  if (filter === "all") {
    return true;
  }
  if (typeof filter === "string") {
    return user.role === filter || user.status === filter;
  }

  return (
    (filter.role === undefined ||
      filter.role === "all" ||
      user.role === filter.role) &&
    (filter.status === undefined ||
      filter.status === "all" ||
      user.status === filter.status)
  );
}

export const usersStore = create<UsersState>((set, get) => ({
  users: hydrateUsers(),
  create: (input) => {
    const currentUsers = get().users;
    const validated = validateInput(input, currentUsers);
    if (!validated.ok) {
      return validated;
    }

    const user: User = {
      id: createId(),
      ...validated.value,
      createdAt: new Date().toISOString(),
    };
    const users = [...currentUsers, user];
    set({ users });
    persistUsers(users);
    return { ok: true, value: user };
  },
  update: (id, input) => {
    const currentUsers = get().users;
    const existingUser = currentUsers.find((user) => user.id === id);
    if (!existingUser) {
      return { ok: false, errors: { form: "کاربر یافت نشد" } };
    }

    const validated = validateInput(input, currentUsers, id);
    if (!validated.ok) {
      return validated;
    }

    const updatedUser: User = {
      id: existingUser.id,
      createdAt: existingUser.createdAt,
      ...validated.value,
    };
    const users = currentUsers.map((user) =>
      user.id === id ? updatedUser : user,
    );
    set({ users });
    persistUsers(users);
    return { ok: true, value: updatedUser };
  },
  remove: (id) => {
    const users = get().users.filter((user) => user.id !== id);
    if (users.length === get().users.length) {
      return;
    }

    set({ users });
    persistUsers(users);
  },
  query: (options = {}) => {
    const {
      search,
      filter,
      page,
      pageSize = DEFAULT_PAGE_SIZE,
      sort,
    } = options;
    const normalizedSearch = search === undefined ? "" : normalizeText(search);
    const filtered = get().users.filter((user) => {
      const searchable = normalizeText(
        `${user.firstName} ${user.lastName} ${user.email} ${user.role} ${user.status} ${user.birthDate}`,
      );
      return (
        (normalizedSearch === "" || searchable.includes(normalizedSearch)) &&
        (filter === undefined || matchesFilter(user, filter))
      );
    });

    const indexed = filtered.map((user, index) => ({ user, index }));
    if (sort !== undefined) {
      const details = sortDetails(sort);
      indexed.sort((left, right) => {
        const comparison = sortValue(left.user, details.field).localeCompare(
          sortValue(right.user, details.field),
          "fa",
        );
        if (comparison !== 0) {
          return details.direction === "desc" ? -comparison : comparison;
        }
        return left.index - right.index;
      });
    }

    const ordered = indexed.map(({ user }) => user);
    if (page === undefined) {
      return ordered;
    }

    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const safePageSize =
      Number.isInteger(pageSize) && pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE;
    const start = (safePage - 1) * safePageSize;
    return ordered.slice(start, start + safePageSize);
  },
}));

export const useUsersStore = usersStore;
