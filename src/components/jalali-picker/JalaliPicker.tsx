import { DayPicker, getDateLib } from "@daypicker/persian";
import { useEffect, useRef, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { HStack } from "@astryxdesign/core/HStack";
import { Popover } from "@astryxdesign/core/Popover";
import { Text } from "@astryxdesign/core/Text";
import { useDayPicker } from "react-day-picker";
import type {
  CaptionLabelProps,
  DayButtonProps,
  NavProps,
} from "react-day-picker";
import type { JalaliDate } from "../../lib/date";
import { toPersianDigits } from "../../lib/digits";

const jalaliDateLib = getDateLib();

type JalaliPickerProps = {
  value: JalaliDate | null;
  onChange: (date: JalaliDate) => void;
};

function formatValue(value: JalaliDate): string {
  return toPersianDigits(
    `${value.year.toString().padStart(4, "0")}/${value.month
      .toString()
      .padStart(2, "0")}/${value.day.toString().padStart(2, "0")}`,
  );
}

function toPickerDate(value: JalaliDate): Date {
  return jalaliDateLib.newDate(value.year, value.month - 1, value.day);
}

function toJalaliDate(value: Date): JalaliDate {
  // DayPicker owns the calendar DateLib, so use it to preserve Jalali semantics
  // instead of reading Gregorian fields from the underlying JavaScript Date.
  const [year, month, day] = jalaliDateLib
    .format(value, "yyyy-MM-dd")
    .split("-")
    .map(Number);

  return { year, month, day };
}

function CalendarDayButton({
  children,
  day,
  modifiers,
  ...props
}: DayButtonProps) {
  const { goToMonth } = useDayPicker();
  const ref = useRef<HTMLButtonElement>(null);
  const label = typeof children === "string" ? children : "روز";

  const moveFocus = (nextDate: Date) => {
    goToMonth(nextDate);
    requestAnimationFrame(() => {
      const dayKey = toPersianDigits(
        jalaliDateLib.format(nextDate, "yyyy-MM-dd"),
      );
      document
        .querySelector<HTMLButtonElement>(`[data-day="${dayKey}"] button`)
        ?.focus();
    });
  };

  useEffect(() => {
    if (modifiers.focused) {
      ref.current?.focus();
    }
  }, [modifiers.focused]);

  return (
    <Button
      {...props}
      label={label}
      ref={ref}
      size="sm"
      variant={modifiers.selected ? "primary" : "ghost"}
      onKeyDown={(event) => {
        const arrowDays =
          event.key === "ArrowLeft" ? 1 : event.key === "ArrowRight" ? -1 : 0;
        const arrowWeeks =
          event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;

        if (arrowDays !== 0 || arrowWeeks !== 0) {
          event.preventDefault();
          event.stopPropagation();
          moveFocus(
            arrowDays !== 0
              ? jalaliDateLib.addDays(day.date, arrowDays)
              : jalaliDateLib.addWeeks(day.date, arrowWeeks),
          );
          return;
        }

        if (event.key === "PageDown" || event.key === "PageUp") {
          event.preventDefault();
          event.stopPropagation();
          moveFocus(
            jalaliDateLib.addMonths(
              day.date,
              event.key === "PageDown" ? 1 : -1,
            ),
          );
          return;
        }

        props.onKeyDown?.(event);
      }}
    >
      {children}
    </Button>
  );
}

function CalendarNavigation({
  children: _children,
  nextMonth,
  onNextClick,
  onPreviousClick,
  previousMonth,
  ...props
}: NavProps) {
  void _children;

  return (
    <HStack {...props} gap={2} hAlign="between" vAlign="center">
      <Button
        label="ماه قبل"
        size="sm"
        variant="ghost"
        isDisabled={!previousMonth}
        onClick={onPreviousClick}
      />
      <Button
        label="ماه بعد"
        size="sm"
        variant="ghost"
        isDisabled={!nextMonth}
        onClick={onNextClick}
      />
    </HStack>
  );
}

function CalendarCaption({
  children,
  color: _color,
  ...props
}: CaptionLabelProps) {
  void _color;

  return (
    <Text {...props} type="body" weight="medium">
      {children}
    </Text>
  );
}

export function JalaliPicker({ value, onChange }: JalaliPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = value ? toPickerDate(value) : undefined;

  return (
    <Popover
      alignment="start"
      content={
        <DayPicker
          aria-label="تقویم تاریخ تولد"
          autoFocus
          components={{
            CaptionLabel: CalendarCaption,
            DayButton: CalendarDayButton,
            Nav: CalendarNavigation,
          }}
          defaultMonth={selected}
          dir="rtl"
          mode="single"
          onSelect={(date) => {
            if (date) {
              onChange(toJalaliDate(date));
              setIsOpen(false);
            }
          }}
          selected={selected}
          showOutsideDays={false}
        />
      }
      hasCloseButton={false}
      isOpen={isOpen}
      label="انتخاب تاریخ تولد"
      onOpenChange={setIsOpen}
      placement="below"
    >
      <Button
        label={value ? formatValue(value) : "انتخاب تاریخ تولد"}
        variant="secondary"
      />
    </Popover>
  );
}
