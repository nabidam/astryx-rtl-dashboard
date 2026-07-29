import { format, formatISO, isValid, newDate, parseISO } from "date-fns-jalali";
import { toPersianDigits } from "./digits";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Jalali months are 1-based to match calendar notation and picker values.
export type JalaliDate = {
  year: number;
  month: number;
  day: number;
};

function isoDateFrom(date: Date): string {
  return formatISO(date, { representation: "date" });
}

function parseIsoDate(iso: string): Date | null {
  if (!ISO_DATE_PATTERN.test(iso)) {
    return null;
  }

  const date = parseISO(iso);
  return isValid(date) && isoDateFrom(date) === iso ? date : null;
}

function jalaliDateKey(value: JalaliDate): string {
  return `${value.year.toString().padStart(4, "0")}-${value.month
    .toString()
    .padStart(2, "0")}-${value.day.toString().padStart(2, "0")}`;
}

export function isValidIsoDate(iso: string): boolean {
  return parseIsoDate(iso) !== null;
}

export function isValidJalaliDate(value: JalaliDate): boolean {
  if (
    !Number.isInteger(value.year) ||
    !Number.isInteger(value.month) ||
    !Number.isInteger(value.day) ||
    value.month < 1 ||
    value.month > 12 ||
    value.day < 1
  ) {
    return false;
  }

  const date = newDate(value.year, value.month - 1, value.day);
  return isValid(date) && format(date, "yyyy-MM-dd") === jalaliDateKey(value);
}

export function formatJalali(iso: string): string {
  const date = parseIsoDate(iso);

  if (!date) {
    throw new RangeError("تاریخ میلادی نامعتبر است");
  }

  return toPersianDigits(format(date, "yyyy/MM/dd"));
}

export function jalaliToIso(value: JalaliDate): string {
  if (!isValidJalaliDate(value)) {
    throw new RangeError("تاریخ جلالی نامعتبر است");
  }

  return isoDateFrom(newDate(value.year, value.month - 1, value.day));
}
