import { create } from "zustand";
import { toLatinDigits } from "../../lib/digits";
import { storage, type PersistedAuth } from "../../lib/storage";

export type LoginCredentials = {
  email: string;
  password: string;
};

export type ProfileInput = {
  displayName: string;
  email: string;
};

export type FieldErrors = Record<string, string>;

export type Result<T = void> =
  | { ok: true; value: T }
  | { ok: false; errors: FieldErrors };

export type AuthState = {
  session: PersistedAuth | null;
  login: (credentials: LoginCredentials) => void;
  logout: () => void;
  updateProfile: (input: ProfileInput) => Result;
};

function normalizeEmail(value: string): string {
  return toLatinDigits(value).trim().toLowerCase();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function displayNameFromEmail(email: string): string {
  const localPart = email.split("@", 1)[0]?.trim();
  return localPart || email;
}

function createToken(): string {
  try {
    return globalThis.crypto.randomUUID();
  } catch {
    return `fake-session-${Date.now().toString(36)}`;
  }
}

function hydrateSession(): PersistedAuth | null {
  return storage.read("auth");
}

export const authStore = create<AuthState>((set) => ({
  session: hydrateSession(),
  login: (credentials) => {
    const candidate = asRecord(credentials as unknown);
    const email =
      typeof candidate?.email === "string"
        ? normalizeEmail(candidate.email)
        : "";
    const profileEmail = email || "کاربر@example.com";
    const session: PersistedAuth = {
      token: createToken(),
      profile: {
        displayName: displayNameFromEmail(profileEmail),
        email: profileEmail,
      },
    };

    set({ session });
    storage.write("auth", session);
  },
  logout: () => {
    set({ session: null });
    storage.write("auth", null);
  },
  updateProfile: (input) => {
    const session = authStore.getState().session;
    if (!session) {
      return { ok: false, errors: { form: "ابتدا وارد حساب کاربری شوید" } };
    }

    const candidate = asRecord(input as unknown);
    const displayName =
      typeof candidate?.displayName === "string"
        ? candidate.displayName.trim()
        : "";
    const email =
      typeof candidate?.email === "string"
        ? normalizeEmail(candidate.email)
        : "";
    const errors: FieldErrors = {};

    if (!displayName) {
      errors.displayName = "نام نمایشی الزامی است";
    }
    if (!email) {
      errors.email = "ایمیل الزامی است";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "ایمیل معتبر نیست";
    }

    if (Object.keys(errors).length > 0) {
      return { ok: false, errors };
    }

    const updatedSession: PersistedAuth = {
      ...session,
      profile: { displayName, email },
    };
    set({ session: updatedSession });
    storage.write("auth", updatedSession);
    return { ok: true, value: undefined };
  },
}));

export const useAuthStore = authStore;
