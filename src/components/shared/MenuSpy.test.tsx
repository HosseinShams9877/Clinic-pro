/**
 * MenuSpy.test.tsx — the scroll-spy island (B-6), under test.
 *
 * Contract (mirror of پلتفرم/assets/js/main.js, "Active menu link on
 * scroll"): on the home route, a menu link whose hash target straddles the
 * mid-screen line (innerHeight * 0.45) is the one active link; with no
 * section at the mid-line and scrollY < 300 the home link is active. On any
 * other route the spy arms nothing and never touches the server-rendered
 * current-section active class — the reference's selector finds no
 * same-page hash links on its inner pages either.
 *
 * jsdom has no layout, so the target's rect is stubbed per test; the
 * viewport (768) and scrollY are jsdom's defaults unless pinned.
 */

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MenuSpy } from "./MenuSpy";

const { pathname } = vi.hoisted(() => ({ pathname: { current: "/" } }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

/** Stub a section's rect so the spy sees it where the test wants it. */
function stubRect(id: string, top: number, height: number) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} missing from the fixture`);
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
    top,
    height,
    bottom: top + height,
    left: 0,
    right: 0,
    width: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
}

/** The reference's menu fixture: home + contact hash link, plus the target. */
function fixture() {
  document.body.innerHTML = `
    <ul id="menu">
      <li><a href="/">خانه</a></li>
      <li><a href="/services">خدمات</a></li>
      <li><a href="/#contact">تماس با ما</a></li>
    </ul>
    <section id="contact">contact</section>
  `;
}

describe("MenuSpy", () => {
  beforeEach(() => {
    pathname.current = "/";
    fixture();
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("marks the home link active at the top of the home page (scrollY < 300)", () => {
    // No section at the mid-line: the contact section sits far below it.
    stubRect("contact", 600, 200);
    render(<MenuSpy />);

    expect(document.querySelector('a[href="/"]')?.classList.contains("active")).toBe(true);
    expect(document.querySelector('a[href="/#contact"]')?.classList.contains("active")).toBe(false);
  });

  it("moves .active to the hash link whose section straddles the mid-line", () => {
    // Viewport is 768 tall, so the mid-line is 345.6; a section spanning
    // 300..400 straddles it, exactly like #contact crossing mid-screen.
    stubRect("contact", 300, 100);
    render(<MenuSpy />);
    fireEvent.scroll(window);

    expect(document.querySelector('a[href="/#contact"]')?.classList.contains("active")).toBe(true);
    expect(document.querySelector('a[href="/"]')?.classList.contains("active")).toBe(false);
  });

  it("hands .active back to the home link once the section is past the mid-line", () => {
    // Same run, then the section scrolls past: only the mid-line rule
    // changes, the scrollY < 300 fallback stays armed.
    stubRect("contact", 300, 100);
    const { unmount } = render(<MenuSpy />);
    fireEvent.scroll(window);
    expect(document.querySelector('a[href="/#contact"]')?.classList.contains("active")).toBe(true);

    stubRect("contact", 100, 100); // top=100, bottom=200 — fully above the line
    fireEvent.scroll(window);
    expect(document.querySelector('a[href="/#contact"]')?.classList.contains("active")).toBe(false);
    // scrollY is still 0 (< 300), so the home link takes over.
    expect(document.querySelector('a[href="/"]')?.classList.contains("active")).toBe(true);
    unmount();
  });

  it("is inert on non-home routes — the reference's inner pages have no spy", () => {
    pathname.current = "/services";
    // The services link carries the server-rendered active state; the spy
    // must neither add nor remove it.
    document.querySelector('a[href="/services"]')?.classList.add("active");
    stubRect("contact", 600, 200);
    render(<MenuSpy />);
    fireEvent.scroll(window);

    expect(document.querySelector('a[href="/services"]')?.classList.contains("active")).toBe(true);
    expect(document.querySelector('a[href="/"]')?.classList.contains("active")).toBe(false);
    expect(document.querySelector('a[href="/#contact"]')?.classList.contains("active")).toBe(false);
  });
});
