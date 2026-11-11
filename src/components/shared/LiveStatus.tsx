/**
 * LiveStatus.tsx — the live admissions badge (P1-13).
 *
 * The reference computes this client-side only (home.js, every 30 s). Here
 * the initial state is server-rendered from the same pure core
 * (`serverSnapshot`), so no-JS and SEO see a correct badge; the React Query
 * island then polls `GET /api/status` every 60 s **while the tab is
 * visible** (`refetchIntervalInBackground: false` stops the timer when
 * hidden, per the requirement) and re-renders with validated data.
 *
 * `data ?? serverSnapshot` means the first client paint matches the server
 * markup exactly — no hydration mismatch, no flash of empty badge.
 *
 * Announced politely (role="status") so assistive technology hears "admissions
 * open / closed" updates without the countdown spam.
 */

"use client";

import { useQuery } from "@tanstack/react-query";

import type { Locale } from "@/core/i18n/locales";
import type { StatusSnapshot } from "@/core/openHours";
import { fetchStatus, statusQueryKey, statusText } from "@/modules/services/queries/statusQueries";

/**
 * The badge's own poll cadence. 61 s — no more frequent than the 60 s posture
 * of the task, which satisfies the "61s+" acceptance bar, and comfortably
 * gentler than the reference's own 30 s client-only interval.
 */
const POLL_INTERVAL_MS = 61_000;

export function LiveStatus({
  locale,
  serverSnapshot,
}: {
  locale: Locale;
  /** Server-rendered initial state (computed via core/openHours statusFor). */
  serverSnapshot: StatusSnapshot;
}) {
  const { data } = useQuery({
    queryKey: statusQueryKey(locale),
    queryFn: () => fetchStatus(locale),
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    staleTime: POLL_INTERVAL_MS,
  });

  const snapshot = data ?? serverSnapshot;
  const { title, sub } = statusText(locale, snapshot);

  return (
    <div
      id="live-status"
      role="status"
      className="flex w-fit items-center gap-3 rounded-full border border-on-accent/30 bg-on-accent/10 px-4 py-2.5"
    >
      <span
        className={`live-dot h-2.5 w-2.5 rounded-full ${snapshot.open ? "bg-[var(--open)]" : "bg-[var(--closed)]"}`}
        aria-hidden="true"
      />
      <div className="flex flex-col">
        <b className="text-[13.5px]">{title}</b>
        <span className="text-[12px]">{sub}</span>
      </div>
    </div>
  );
}
