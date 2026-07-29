import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";
import { Theme, defineTheme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import { afterEach, describe, expect, it, vi } from "vitest";
import faMessages from "../../locale/fa.json";
import { JalaliPicker } from "./JalaliPicker";

const testTheme = defineTheme({
  name: "jalali-picker-test",
  extends: neutralTheme,
});

function renderPicker(onChange = vi.fn()) {
  const rendered = render(
    <Theme theme={testTheme} mode="light">
      <InternationalizationProvider locale="fa" messages={{ fa: faMessages }}>
        <JalaliPicker
          value={{ year: 1403, month: 12, day: 1 }}
          onChange={onChange}
        />
      </InternationalizationProvider>
    </Theme>,
  );

  return { ...rendered, onChange };
}

function dayButton(day: string): HTMLButtonElement {
  return screen
    .getAllByRole("button")
    .find((button) => button.textContent === day) as HTMLButtonElement;
}

describe("JalaliPicker", () => {
  afterEach(cleanup);

  it("selects Esfand 30 according to the Persian calendar adapter", () => {
    const { onChange } = renderPicker();

    fireEvent.click(screen.getByRole("button", { name: "۱۴۰۳/۱۲/۰۱" }));
    fireEvent.click(dayButton("۳۰"));

    expect(onChange).toHaveBeenCalledWith({ year: 1403, month: 12, day: 30 });
  });

  it("moves focus through the RTL grid and changes months with PageDown", async () => {
    renderPicker();

    fireEvent.click(screen.getByRole("button", { name: "۱۴۰۳/۱۲/۰۱" }));
    const firstDay = dayButton("۱");
    await waitFor(() => {
      expect(document.activeElement).toBe(firstDay);
    });

    fireEvent.keyDown(firstDay, { key: "ArrowLeft" });
    await waitFor(() => {
      expect(document.activeElement).toBe(dayButton("۲"));
    });

    fireEvent.keyDown(dayButton("۲"), { key: "PageDown" });
    await waitFor(() => {
      expect(screen.getByRole("grid", { name: "فروردین ۱۴۰۴" })).toBeTruthy();
    });
  });

  it("closes the popover when Escape is pressed", async () => {
    renderPicker();

    const trigger = screen.getByRole("button", { name: "۱۴۰۳/۱۲/۰۱" });
    fireEvent.click(trigger);
    expect(screen.getByLabelText("تقویم تاریخ تولد")).toBeTruthy();
    await waitFor(() => {
      expect(trigger.getAttribute("aria-expanded")).toBe("true");
    });

    fireEvent.keyDown(document, {
      key: "Escape",
    });

    await waitFor(() => {
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
    });
  });
});
