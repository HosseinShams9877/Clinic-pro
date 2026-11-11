/**
 * client.ts — the single TanStack React Query client configuration (P1-13).
 *
 * React Query is used for exactly one thing in the implemented scope: the live
 * admissions badge (REC-2). The client instance is created once per browser tab
 * and reused (Next.js App Router docs pattern): the server pass gets a fresh
 * instance per request — never shared across users — and the browser caches the
 * singleton so client-side navigation preserves the query cache.
 *
 * Kept out of the .tsx provider so tests can build the exact production client.
 */

import { QueryClient } from "@tanstack/react-query";

/** One shared configuration; no retries on the badge (a 61 s refill comes). */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  });
}
