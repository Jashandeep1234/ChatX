"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useThrottledCallback<T extends (...args: never[]) => void>(
  fn: T,
  delayMs: number
): T {
  const [last, setLast] = useState(0);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer) clearTimeout(timer);
  }, [timer]);

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - last >= delayMs) {
      setLast(now);
      fn(...args);
    } else if (!timer) {
      const t = setTimeout(() => {
        setLast(Date.now());
        setTimer(null);
        fn(...args);
      }, delayMs - (now - last));
      setTimer(t);
    }
  }) as T;
}

export function useDebouncedCallback<T extends (...args: never[]) => void>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );
  return useCallback(
    (...args: Parameters<T>) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fnRef.current(...args), delayMs);
    },
    [delayMs]
  );
}
