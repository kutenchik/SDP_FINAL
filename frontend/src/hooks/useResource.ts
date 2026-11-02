import { useCallback, useEffect, useRef, useState } from "react";
import { failure } from "../api/client";
export function useResource<T>(
  loader: () => Promise<T>,
  deps: unknown[] = [],
  refreshKey?: unknown,
) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const sequence = useRef(0);
  const hasData = useRef(false);
  const previousRefresh = useRef(refreshKey);
  const reload = useCallback(async () => {
    const current = ++sequence.current;
    if (!hasData.current) setLoading(true);
    setError("");
    try {
      const result = await loaderRef.current();
      if (current === sequence.current) {
        hasData.current = true;
        setData(result);
      }
    } catch (e) {
      if (current === sequence.current) setError(failure(e).message);
    } finally {
      if (current === sequence.current) setLoading(false);
    }
  }, deps);
  useEffect(() => {
    hasData.current = false;
    setData(undefined);
    setLoading(true);
    void reload();
    return () => {
      sequence.current++;
    };
  }, [reload]);
  // Revalidate the same resource after writes without unmounting active forms.
  useEffect(() => {
    if (previousRefresh.current === refreshKey) return;
    previousRefresh.current = refreshKey;
    void reload();
  }, [refreshKey, reload]);
  return { data, error, loading, reload };
}
