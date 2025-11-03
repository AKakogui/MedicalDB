
'use client';

import { useMemo, type DependencyList } from 'react';

// A trick to add a hidden property to the memoized object, which we can check for in our hooks.
type MemoFirebase<T> = T & { __memo?: boolean };

/**
 * A custom version of React's `useMemo` that "tags" the memoized value.
 * This allows our custom hooks (`useCollection`, `useDoc`) to verify that the
 * query or reference passed to them has been correctly memoized, preventing
 * infinite loops and unnecessary re-renders.
 *
 * @param factory The function that creates the value to be memoized.
 * @param deps The dependency array for the `useMemo` hook.
 * @returns The memoized value, tagged for our internal checks.
 */
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoized = useMemo(factory, deps);

  // We only tag objects, as they are the source of reference-equality issues.
  if (typeof memoized !== 'object' || memoized === null) {
    return memoized;
  }

  // Add the internal tag. This does not affect the object's properties.
  (memoized as MemoFirebase<T>).__memo = true;

  return memoized;
}
