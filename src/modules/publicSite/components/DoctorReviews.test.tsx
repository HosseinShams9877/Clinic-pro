import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DoctorReviews } from "./DoctorReviews";

describe("DoctorReviews", () => {
  it("requires a star rating exactly like the demo", () => {
    render(<DoctorReviews locale="fa" />);
    fireEvent.click(screen.getByRole("button", { name: "ثبت نظر" }));
    expect(screen.getByRole("status")).toHaveTextContent("لطفاً امتیاز را انتخاب کنید.");
  });

  it("shows the pending-approval toast and resets after submission", () => {
    const { container } = render(<DoctorReviews locale="fa" />);
    fireEvent.click(screen.getByRole("button", { name: "4" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "تجربه خوب" } });
    fireEvent.click(screen.getByRole("button", { name: "ثبت نظر" }));
    expect(screen.getByRole("status")).toHaveTextContent("سپاس! نظر شما پس از تأیید منتشر می‌شود.");
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(container.querySelectorAll(".rate .on")).toHaveLength(0);
  });
});
