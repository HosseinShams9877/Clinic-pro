# REACT_QUERY_V5_STRATEGY — client server-state, and when *not* to use it

> Phase 0 deliverable · Architecture layer · Scope note: Phase 1 is mostly Server Components with
> static content; React Query is used only where the client genuinely needs server-state.

---

## 1. Where React Query earns its place (Phase 1) — **scoped by REC-2**

| Use | Why client-side |
|---|---|
| Live open/closed badge | polled update (the reference re-checks every 60 s) |

Two earlier candidates were examined and **ruled out** for Phase 1:

- **Category switching** — with approved Q2 (path segments) it is route navigation between statically
  generated routes; there is no client fetch and no server snapshot to keep consistent.
- **Prefetched client navigation between categories** — static routes are prefetched by Next itself.

Where it does **not** earn its place: anything static — the initial server render, layout, navigation,
theme, locale switching (local state + URL), and all no-JS-critical content. The badge is the single
Phase 1 consumer; the pattern below stays the project's standing model for the surfaces that follow.

## 2. Architecture — the query layer (`modules/*/queries`)

```ts
// src/modules/services/queries/serviceCategories.ts
export const serviceKeys = {
  all:            ["services"] as const,
  categories:     () => [...serviceKeys.all, "categories"] as const,
  category: (s: string) => [...serviceKeys.all, "category", s] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: serviceKeys.categories(),
    queryFn: () => api.get<CategorySummary[]>("/api/services"),
    staleTime: ms("1h"),
  });
}
```

Rules:
1. **Query keys are hierarchical & colocated** with the module (`["services","category",slug]`) —
   invalidation is precise (`invalidateQueries({ queryKey: serviceKeys.all })`).
2. **`queryFn` calls the typed API client** (`core/api`), never `fetch` ad hoc.
3. **No business logic in queryFns** — the server remains the source of truth; client code only renders.
4. **Types come from the API contract** (`CategorySummary[]`), generated or hand-maintained in
   `modules/*/types` and matching `API_ARCHITECTURE.md`'s envelope (`data` unwrapped by the client).

## 3. v5 specifics (what changes from v4)

- `useQuery({ queryKey, queryFn, … })` object form only (v5 removed positional args).
- **`useSuspenseQuery` / `useSuspenseInfiniteQuery`** for stream-based rendering inside client islands;
  the error path handled with an error boundary, not `isLoading` branching.
- Optimistic updates via `queryClient.setQueryData` in mutation `onMutate` + `onError` rollback — first
  needed for the (out-of-scope) forms; the pattern is documented for Phase 5.
- `placeholderData` for category switch to keep the previous view while fetching (avoids the reference's
  hard swap; the reference uses a `.swap` animation class — we keep a motion cue, not a blank state).
- Default `retry` kept, but `throwOnError` at the boundary level, not per-query, so UIs degrade to a
  shared error state.
- **No `any`.** Keys and data are typed; v5 inference is strict enough to enforce this in review.

## 4. Prefetch strategy

- **Server components prefetch on request** for the initial route and write the dehydrated cache into
  the client provider (`HydrationBoundary`) — the first paint is server-rendered and the client starts
  warm.
- Inter-category navigation is **plain route navigation** (approved Q2 = path segments) between
  statically generated routes — no query, no prefetch needed.

## 5. Cache policy (defaults, tuned per query)

| Query | staleTime | gcTime | Notes |
|---|---|---|---|
| site status (open/closed) | 0 | default | refetchInterval 60 s only while visible — the reference polls at 60 s; we poll only on-screen to save battery. **The catalog has no query in Phase 1 (REC-2): it is server-rendered from content files.** |

Rule of thumb: **staleTime long for content, short for status; refetch only what the user can see.**

## 6. Client-side state that stays OUT of React Query

| State | Tool |
|---|---|
| active category (URL) | URL `/services/<slug>` or hash (`useSearchParams`) |
| locale | cookie + URL + context |
| menu/modal open states | local `useState` |
| motion capability flags | `useMediaQuery` hooks |
| theme | token attribute on `<html>` |

React Query is for *server* state; mixing local UI state into the cache is a review blocker.

## 7. Testing

- Hook tests with `@tanstack/react-query` `QueryClient` in test wrapper, mocked API client at the
  `core/api` boundary (not `fetch`).
- Component tests assert loading → success and loading → empty and error states (all three must exist
  for every query-backed island).
- Parallel tests share one cache isolation per test (new `QueryClient` per test).
