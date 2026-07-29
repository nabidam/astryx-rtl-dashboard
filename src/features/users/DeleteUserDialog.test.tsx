import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";
import { Theme, defineTheme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import faMessages from "../../locale/fa.json";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { fixtures } from "./fixtures";
import { usersStore } from "./usersStore";

const testTheme = defineTheme({
  name: "delete-user-dialog-test",
  extends: neutralTheme,
});

function renderDialog(onClose = vi.fn()) {
  render(
    <Theme theme={testTheme} mode="light">
      <InternationalizationProvider locale="fa" messages={{ fa: faMessages }}>
        <DeleteUserDialog onClose={onClose} user={fixtures[0]} />
      </InternationalizationProvider>
    </Theme>,
  );

  return onClose;
}

describe("DeleteUserDialog", () => {
  beforeEach(() => {
    Object.assign(globalThis, {
      CSS: { escape: (value: string) => value },
    });
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function close() {
      this.open = false;
    };
    usersStore.setState({ users: fixtures.map((user) => ({ ...user })) });
  });

  afterEach(cleanup);

  it("cancels without changing the user list", () => {
    const onClose = renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "انصراف" }));

    expect(usersStore.getState().users).toHaveLength(fixtures.length);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("removes the selected user and closes after confirmation", () => {
    const onClose = renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "حذف کاربر" }));

    expect(
      usersStore.getState().users.some((user) => user.id === fixtures[0].id),
    ).toBe(false);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
