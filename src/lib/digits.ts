const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const LATIN_DIGITS = "0123456789";
const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function replaceDigits(value: string, source: string, target: string): string {
  return value.replace(/[0-9۰-۹٠-٩]/g, (digit) => {
    const index = source.indexOf(digit);
    return index === -1 ? digit : (target[index] ?? digit);
  });
}

export function toPersianDigits(value: string): string {
  return replaceDigits(value, LATIN_DIGITS, PERSIAN_DIGITS).replace(
    /[٠-٩]/g,
    (digit) => PERSIAN_DIGITS[ARABIC_INDIC_DIGITS.indexOf(digit)] ?? digit,
  );
}

export function toLatinDigits(value: string): string {
  return value
    .replace(
      /[۰-۹]/g,
      (digit) => LATIN_DIGITS[PERSIAN_DIGITS.indexOf(digit)] ?? digit,
    )
    .replace(
      /[٠-٩]/g,
      (digit) => LATIN_DIGITS[ARABIC_INDIC_DIGITS.indexOf(digit)] ?? digit,
    );
}
