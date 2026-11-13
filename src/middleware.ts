/**
 * middleware.ts — locale persistence for the `?lang=` override
 * (LOCALIZATION_AND_CALENDAR.md §1, approved Q7).
 *
 * The root layout cannot see the URL search params (Next.js passes them only
 * to pages), so a `?lang=en` link would bake the *cookie* locale into
 * <html lang> and miss the override. This middleware mirrors a valid
 * `?lang=` value into the `lang` cookie on both the request (so the very
 * same render sees it via next/headers `cookies()`) and the response (so the
 * choice survives navigation), then lets the request through unchanged.
 *
 * No locale-prefixed routes exist and none are introduced here.
 *
 * One addition beyond locale persistence: every response also carries the
 * request pathname as the `x-pathname` request header (see the body) so the
 * server-rendered header can mark the current section's menu link active,
 * the way the reference does in static markup.
 */

import { NextResponse, type NextRequest } from "next/server";

import { DEFAULT_LOCALE, LOCALES, isLocale } from "@/core/i18n/locales";
import { LOCALE_COOKIE, LOCALE_QUERY_PARAM } from "@/core/i18n/getLocale";

export function middleware(request: NextRequest): NextResponse {
  // Forward the current path as a request header so server components that
  // render on every route (the root layout → SiteHeader) can see which page
  // they are rendering. The reference marks the current section's menu link
  // active in static markup (index.html L101, services.html L77); this is the
  // server-side half of that. Safe to set on every request: it is a verbatim
  // copy of `nextUrl.pathname`, nothing synthesized.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  const forward = () => NextResponse.next({ request: { headers: requestHeaders } });

  const queryValue = request.nextUrl.searchParams.get(LOCALE_QUERY_PARAM);
if (isLocale(queryValue)) requestHeaders.set("x-locale", queryValue);

  if (!isLocale(queryValue)) return forward();

  // Persist the choice: response cookie for the browser…
  const response = forward();
  response.cookies.set(LOCALE_COOKIE, queryValue, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  // …and request cookie, so `cookies()` inside this same render returns it.
  request.cookies.set(LOCALE_COOKIE, queryValue);
  return response;
}

export const config = {
  /** Everything except static assets, Next internals, image optimizer, API. */
  matcher: ["/((?!api|_next/static|_next/image|img|favicon.ico|robots.txt|sitemap.xml).*)"],
};

/** Kept handy for tooling that needs the full set; Locale type is in core/i18n. */
export { DEFAULT_LOCALE, LOCALES };
