"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface AsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export interface UseAsyncResult<T> extends AsyncState<T> {
  /** Re-run the async function (e.g. after a mutation). */
  reload: () => Promise<void>;
}

/**
 * Runs an async function on mount and whenever `deps` change, exposing
 * { data, error, loading } plus a `reload`. Ignores results from stale runs
 * (component unmounted or deps changed), so there are no race conditions or
 * state-after-unmount updates.
 */
export const useAsync = <T>(fn: () => Promise<T>, deps: unknown[]): UseAsyncResult<T> => {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    loading: true,
  });

  const fnRef = useRef(fn);
  fnRef.current = fn;
  const runIdRef = useRef(0);

  const run = useCallback(async () => {
    const runId = ++runIdRef.current;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fnRef.current();
      if (runId === runIdRef.current) setState({ data, error: null, loading: false });
    } catch (err) {
      if (runId === runIdRef.current) {
        setState({
          data: null,
          error: err instanceof Error ? err.message : "Something went wrong",
          loading: false,
        });
      }
    }
  }, []);

  useEffect(() => {
    void run();
    // Invalidate the in-flight run when deps change or the component unmounts.
    return () => {
      runIdRef.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, reload: run };
}
