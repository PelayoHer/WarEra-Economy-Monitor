'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for type-safe localStorage with SSR support
 * Prevents hydration mismatches by initializing with default value
 * Supports cross-component updates within the same tab using custom events
 */
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
    // Initialize with default value (SSR-safe)
    const [storedValue, setStoredValue] = useState<T>(defaultValue);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load from localStorage after mount (client-side only)
    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                setStoredValue(JSON.parse(item));
            }
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
        }
        setIsInitialized(true);
    }, [key]);

    // Return a wrapped version of useState's setter function that persists the new value to localStorage.
    const setValue = useCallback((value: T | ((val: T) => T)) => {
        try {
            // Allow value to be a function so we have same API as useState
            const valueToStore =
                value instanceof Function ? value(storedValue) : value;

            // Save state
            setStoredValue(valueToStore);

            // Save to local storage
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));

                // Dispatch a custom event so other components in the same tab update
                window.dispatchEvent(new CustomEvent('local-storage-update', {
                    detail: { key, newValue: valueToStore }
                }));
            }
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    // Listen for changes from other components
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleStorageChange = (e: CustomEvent) => {
            if (e.detail?.key === key) {
                setStoredValue(e.detail.newValue);
            }
        };

        // Listen for our custom event
        window.addEventListener('local-storage-update', handleStorageChange as EventListener);

        // Listen for storage events (cross-tab)
        const handleCrossTabStorage = (e: StorageEvent) => {
            if (e.key === key && e.newValue) {
                setStoredValue(JSON.parse(e.newValue));
            }
        };
        window.addEventListener('storage', handleCrossTabStorage);

        return () => {
            window.removeEventListener('local-storage-update', handleStorageChange as EventListener);
            window.removeEventListener('storage', handleCrossTabStorage);
        };
    }, [key]);

    return [storedValue, setValue];
}
