import { useEffect, useState } from "react";

const DEFAULT_DEBOUNCE_MS = 300;
const DEFAULT_MIN_SEARCH_LENGTH = 1;

type SearchHandler = (query: string) => Promise<void> | void;

type UseDebouncedSearchOptions = {
    query: string;
    search: SearchHandler;
    clearSearch: () => void;
    delayMs?: number;
    minLength?: number;
    onError?: (error: unknown) => void;
};

export const useDebounce = <T>(value: T, delayMs = DEFAULT_DEBOUNCE_MS): T => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedValue(value);
        }, delayMs);

        return () => window.clearTimeout(timeoutId);
    }, [delayMs, value]);

    return debouncedValue;
};

export const useDebouncedSearch = ({
    query,
    search,
    clearSearch,
    delayMs = DEFAULT_DEBOUNCE_MS,
    minLength = DEFAULT_MIN_SEARCH_LENGTH,
    onError,
}: UseDebouncedSearchOptions): string => {
    const debouncedQuery = useDebounce(query, delayMs);

    useEffect(() => {
        const normalizedQuery = debouncedQuery.trim();

        if (normalizedQuery.length < minLength) {
            clearSearch();
            return;
        }

        let isActive = true;

        void Promise.resolve(search(normalizedQuery)).catch((error) => {
            if (!isActive) return;

            if (onError) {
                onError(error);
                return;
            }

            console.error("Search failed:", error);
        });

        return () => {
            isActive = false;
        };
    }, [clearSearch, debouncedQuery, minLength, onError, search]);

    return debouncedQuery;
};
