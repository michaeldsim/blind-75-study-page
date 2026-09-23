"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False during SSR and the hydration pass, true afterwards.
 *
 * Anything derived from the viewer's clock or timezone has to wait for this:
 * the server runs UTC, so "due today" can legitimately differ by a day from
 * what the browser computes, and rendering that difference is a hydration
 * mismatch. useSyncExternalStore gives React an explicit server snapshot, so
 * this is a clean re-render rather than a mismatch.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
