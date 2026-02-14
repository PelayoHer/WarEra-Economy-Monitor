'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook for type-safe localStorage with SSR support
 * Prevents hydration mismatches by initializing with default value
 */
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
    // Initialize with default value (SSR-safe)
    const [value, setValue] = useState<T>(defaultValue);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load from localStorage after mount (client-side only)
    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            const stored = window.localStorage.getItem(key);
            if (stored !== null) {
                setValue(JSON.parse(stored));
            }
        } catch (error) {
            console.error(`Error loading from localStorage (${key}):`, error);
        }

        setIsInitialized(true);
    }, [key]);

    // Save to localStorage when value changes
    useEffect(() => {
        if (!isInitialized || typeof window === 'undefined') return;

        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error saving to localStorage (${key}):`, error);
        }
    }, [key, value, isInitialized]);

    return [value, setValue];
}
