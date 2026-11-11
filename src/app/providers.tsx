/**
 * providers.tsx — the client-side provider tree (P1-13).
 *
 * TanStack React Query is used for exactly one thing in the implemented
 * scope: the live admissions badge (REC-2). The client instance is created
 * once per browser tab and reused (Next.js App Router docs pattern): the
 * server pass gets a fresh instance per request — never shared across
 * users — and the browser caches the singleton so client-side navigation
 * preserves the query cache.
 *
 * The shared configuration lives in core/query/client.ts (makeQueryClient).
 */

"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

import { makeQueryClient } from "@/core/query/client";

let browserQueryClient: QueryClient | undefined;

/** Server: brand-new client per request. Browser: the tab-wide singleton. */
function getQueryClient(): QueryClient {
  if (typeof window === "undefined") return makeQueryClient();
  if (browserQueryClient === undefined) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: ReactNode }) {
  // useState guarantees the client is created once per component lifecycle,
  // not on every render of this wrapper.
  const [queryClient] = useState(getQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
