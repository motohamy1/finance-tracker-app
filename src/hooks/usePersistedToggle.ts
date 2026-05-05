import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hook to persist a boolean toggle state in AsyncStorage.
 * Returns the current value, a toggle function, and a set function.
 *
 * @param key      — AsyncStorage key for persistence
 * @param defaultValue — initial value before reading from storage
 */
export function usePersistedToggle(key: string, defaultValue: boolean): {
  value: boolean;
  toggle: () => void;
  setValue: (v: boolean) => void;
} {
  const [value, setValueState] = useState<boolean>(defaultValue);

  // Load persisted value on mount
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(key)
      .then((stored) => {
        if (cancelled) return;
        if (stored !== null) {
          setValueState(stored === 'true');
        }
      })
      .catch(() => {
        // Silently ignore read errors — fall back to default
      });
    return () => { cancelled = true; };
  }, [key]);

  // Persist whenever value changes
  useEffect(() => {
    AsyncStorage.setItem(key, String(value)).catch(() => {
      // Silently ignore write errors
    });
  }, [key, value]);

  const toggle = useCallback(() => {
    setValueState((prev) => !prev);
  }, []);

  const setValue = useCallback((v: boolean) => {
    setValueState(v);
  }, []);

  return { value, toggle, setValue };
}
