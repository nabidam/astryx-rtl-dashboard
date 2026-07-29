import { isValidIsoDate } from "./date";

const PREFIX = "astryx-dash:";
const VERSION_KEY = `${PREFIX}v`;
const CURRENT_VERSION = 1;
const DATA_KEYS = ["auth", "theme", "users"] as const;

export type StorageKey = (typeof DATA_KEYS)[number];

export type PersistedAuth = {
  token: string;
  profile: {
    displayName: string;
    email: string;
  };
};

export type PersistedTheme = {
  mode: "light" | "dark";
};

export type PersistedUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  status: "active" | "inactive";
  birthDate: string;
  createdAt: string;
};

export type StorageValueMap = {
  auth: PersistedAuth | null;
  theme: PersistedTheme;
  users: PersistedUser[];
};

export type StorageKeyFor<T> = {
  [K in StorageKey]: StorageValueMap[K] extends T ? K : never;
}[StorageKey];

type DecodeResult<T> =
  | { ok: true; value: T; normalized?: string }
  | { ok: false };

let initialized = false;
let memoryOnly = false;
let recovered = false;
const memory = new Map<StorageKey, string>();

function keyFor(key: StorageKey): string {
  return `${PREFIX}${key}`;
}

function getBrowserStorage(): Storage | null {
  try {
    const candidate: unknown = Reflect.get(globalThis, "localStorage");
    return candidate instanceof Storage ? candidate : null;
  } catch {
    return null;
  }
}

function switchToMemoryOnly(): void {
  memoryOnly = true;
}

function removeKey(storage: Storage, key: string): boolean {
  try {
    storage.removeItem(key);
    return true;
  } catch {
    switchToMemoryOnly();
    return false;
  }
}

function resetPersistedState(storage: Storage): void {
  for (const key of [...DATA_KEYS.map(keyFor), VERSION_KEY]) {
    if (!removeKey(storage, key)) {
      return;
    }
  }

  try {
    storage.setItem(VERSION_KEY, JSON.stringify(CURRENT_VERSION));
  } catch {
    switchToMemoryOnly();
  }
}

function hasStoredData(storage: Storage): boolean {
  try {
    return DATA_KEYS.some((key) => storage.getItem(keyFor(key)) !== null);
  } catch {
    switchToMemoryOnly();
    return false;
  }
}

function isCurrentVersion(rawVersion: string): boolean {
  try {
    return JSON.parse(rawVersion) === CURRENT_VERSION;
  } catch {
    return false;
  }
}

function ensureInitialized(): void {
  if (initialized) {
    return;
  }

  initialized = true;
  const storage = getBrowserStorage();

  if (!storage) {
    switchToMemoryOnly();
    return;
  }

  let rawVersion: string | null;
  try {
    rawVersion = storage.getItem(VERSION_KEY);
  } catch {
    switchToMemoryOnly();
    return;
  }

  if (
    rawVersion === null ? hasStoredData(storage) : !isCurrentVersion(rawVersion)
  ) {
    recovered = true;
    resetPersistedState(storage);
    return;
  }

  if (rawVersion === null) {
    try {
      storage.setItem(VERSION_KEY, JSON.stringify(CURRENT_VERSION));
    } catch {
      switchToMemoryOnly();
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoDateTime(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T/.test(value) &&
    !Number.isNaN(Date.parse(value))
  );
}

function isPersistedAuth(value: unknown): value is PersistedAuth {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.token) ||
    !isRecord(value.profile)
  ) {
    return false;
  }

  return (
    isNonEmptyString(value.profile.displayName) &&
    isNonEmptyString(value.profile.email)
  );
}

function isPersistedTheme(value: unknown): value is PersistedTheme {
  return isRecord(value) && (value.mode === "light" || value.mode === "dark");
}

function isPersistedUser(value: unknown): value is PersistedUser {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.firstName) &&
    isNonEmptyString(value.lastName) &&
    isNonEmptyString(value.email) &&
    (value.role === "admin" ||
      value.role === "editor" ||
      value.role === "viewer") &&
    (value.status === "active" || value.status === "inactive") &&
    typeof value.birthDate === "string" &&
    isValidIsoDate(value.birthDate) &&
    isIsoDateTime(value.createdAt)
  );
}

function decodeAuth(value: unknown): DecodeResult<PersistedAuth | null> {
  return value === null || isPersistedAuth(value)
    ? { ok: true, value }
    : { ok: false };
}

function decodeTheme(value: unknown): DecodeResult<PersistedTheme> {
  return isPersistedTheme(value) ? { ok: true, value } : { ok: false };
}

function decodeUsers(value: unknown): DecodeResult<PersistedUser[]> {
  if (!Array.isArray(value)) {
    return { ok: false };
  }

  const users = value.filter(isPersistedUser);
  return {
    ok: true,
    value: users,
    normalized:
      users.length === value.length ? undefined : JSON.stringify(users),
  };
}

function decode(
  key: StorageKey,
  raw: string,
): DecodeResult<StorageValueMap[StorageKey]> {
  try {
    const value: unknown = JSON.parse(raw);

    switch (key) {
      case "auth":
        return decodeAuth(value);
      case "theme":
        return decodeTheme(value);
      case "users":
        return decodeUsers(value);
    }
  } catch {
    return { ok: false };
  }
}

function persistRaw(key: StorageKey, raw: string): void {
  memory.set(key, raw);

  if (memoryOnly) {
    return;
  }

  const storage = getBrowserStorage();
  if (!storage) {
    switchToMemoryOnly();
    return;
  }

  try {
    storage.setItem(keyFor(key), raw);
  } catch {
    switchToMemoryOnly();
  }
}

function resetKey(key: StorageKey): void {
  memory.delete(key);

  if (memoryOnly) {
    return;
  }

  const storage = getBrowserStorage();
  if (!storage || !removeKey(storage, keyFor(key))) {
    switchToMemoryOnly();
  }
}

export function read<K extends StorageKey>(key: K): StorageValueMap[K] | null;
export function read<T>(key: StorageKeyFor<T>): T | null;
export function read(key: StorageKey): StorageValueMap[StorageKey] | null {
  ensureInitialized();

  let raw = memory.get(key) ?? null;
  if (raw === null && !memoryOnly) {
    const storage = getBrowserStorage();
    if (!storage) {
      switchToMemoryOnly();
    } else {
      try {
        raw = storage.getItem(keyFor(key));
      } catch {
        switchToMemoryOnly();
      }
    }
  }

  if (raw === null) {
    return null;
  }

  const result = decode(key, raw);
  if (!result.ok) {
    recovered = true;
    resetKey(key);
    return null;
  }

  if (result.normalized) {
    persistRaw(key, result.normalized);
  }

  return result.value;
}

export function write(key: StorageKey, value: unknown): void {
  ensureInitialized();

  try {
    persistRaw(key, JSON.stringify(value));
  } catch {
    switchToMemoryOnly();
  }
}

export function clearAll(): void {
  memory.clear();
  recovered = false;
  initialized = false;

  if (memoryOnly) {
    return;
  }

  const storage = getBrowserStorage();
  if (!storage) {
    switchToMemoryOnly();
    return;
  }

  try {
    const keys = Array.from({ length: storage.length }, (_, index) =>
      storage.key(index),
    ).filter((key): key is string => key?.startsWith(PREFIX) ?? false);

    for (const key of keys) {
      storage.removeItem(key);
    }
  } catch {
    switchToMemoryOnly();
  }
}

export const storage = {
  get recovered(): boolean {
    return recovered;
  },
  get memoryOnly(): boolean {
    return memoryOnly;
  },
  read,
  write,
  clearAll,
};
