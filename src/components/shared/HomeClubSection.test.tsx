import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { HomeClubSection } from "./HomeClubSection";

afterEach(() => localStorage.clear());

describe("HomeClubSection", () => {
  it("rejects an invalid mobile number", () => {
    render(<HomeClubSection locale="fa" />);
    const mobile = screen.getByLabelText("شماره موبایل");
    fireEvent.change(mobile, { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: "عضویت رایگان" }));
    expect(screen.getByText(/شماره موبایل را درست وارد کنید/)).toBeVisible();
    expect(mobile).toHaveFocus();
  });

  it("stores the demo membership client-side and shows the success state", () => {
    const { container } = render(<HomeClubSection locale="fa" />);
    fireEvent.change(screen.getByLabelText("شماره موبایل"), { target: { value: "۰۹۱۲۱۲۳۴۵۶۷" } });
    fireEvent.click(screen.getByRole("button", { name: "عضویت رایگان" }));
    const saved = JSON.parse(localStorage.getItem("kh-club-members") || "[]");
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ mobile: "09121234567", tier: "bronze" });
    expect(container.querySelector(".cb-ok")).not.toHaveAttribute("hidden");
  });
});
