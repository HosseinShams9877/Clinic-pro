/**
 * error.test.tsx — the global error boundary render gates (Phase 2, item 4).
 *
 * The boundary is a client component by Next's requirement, so its locale comes
 * from <html lang> (baked server-side by the root layout) rather than from
 * getLocale(). These tests pin that contract:
 *   - it renders the localized title, body and "try again" action,
 *   - it reads <html lang> after mount and follows it (en/ar, not just fa),
 *   - an unexpected/absent lang falls back to fa (Persian-first, always),
 *   - reset() is wired to the button and the home link stays in-scope,
 *   - the raw error message never reaches the visitor.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";

import { makeQueryClient } from "@/core/query/client";
import { t } from "@/modules/i18n/messages";

const { default: ErrorBoundary } = await import("./error");

/** Render the boundary with a controlled locale and a reset spy. */
function renderError(locale: string) {
  document.documentElement.lang = locale;
  const reset = vi.fn();
  const queryClient = makeQueryClient();
  const view = render(
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary error={new Error("SECRET internal detail")} reset={reset} />
    </QueryClientProvider>,
  );
  return { ...view, reset };
}

afterEach(() => {
  document.documentElement.lang = "";
  vi.restoreAllMocks();
});

describe("the global error boundary", () => {
  it("renders the localized error copy and retry action, never the raw error", async () => {
    const { container, reset } = renderError("fa");
    expect(container.querySelector("h1")).toHaveTextContent(t("fa", "err.errorTitle"));
    expect(container.textContent).toContain(t("fa", "err.errorBody"));
    expect(screen.getByRole("button", { name: t("fa", "err.retry") })).toBeInTheDocument();
    expect(container.textContent).not.toContain("SECRET internal detail");
    screen.getByRole("button", { name: t("fa", "err.retry") }).click();
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("follows <html lang> when it is en or ar", async () => {
    for (const locale of ["en", "ar"] as const) {
      const { unmount, container } = renderError(locale);
      await waitFor(() => {
        expect(container.querySelector("h1")).toHaveTextContent(t(locale, "err.errorTitle"));
      });
      expect(container.textContent).toContain(t(locale, "err.errorBody"));
      unmount();
    }
  });

  it("falls back to fa when <html lang> is missing or unrecognized", async () => {
    for (const lang of ["", "de"]) {
      const { unmount, container } = renderError(lang);
      await waitFor(() => {
        expect(container.querySelector("h1")).toHaveTextContent(t("fa", "err.errorTitle"));
      });
      unmount();
    }
  });

  it("keeps the home link inside the implemented scope", () => {
    const { container } = renderError("fa");
    const hrefs = [...container.querySelectorAll("a[href]")].map((node) => node.getAttribute("href"));
    expect(hrefs).toEqual(["/"]);
  });
});
