import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pricingApi } from "@/api/pricing";
import type { Pricing, UsePricing } from "@/types/pricing";

interface UsePricingOptions {
    limit?: number;
    page?: number;
}

const pricingQueryKey = "pricing";

const toTimestampMs = (value: unknown): number => {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === "string") {
        const parsed = Date.parse(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    if (value && typeof value === "object") {
        const seconds = (value as { seconds?: unknown; _seconds?: unknown }).seconds ?? (value as { _seconds?: unknown })._seconds;
        const parsedSeconds = Number(seconds);
        return Number.isFinite(parsedSeconds) ? parsedSeconds * 1000 : 0;
    }

    return 0;
};

const matchesSearch = (pricing: Pricing, query: string): boolean => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return true;

    return [pricing.id, pricing.name, pricing.price, pricing.savings, pricing.sessions, pricing.currency]
        .filter((value) => value !== undefined && value !== null)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
};

export function usePricing(options?: UsePricingOptions): UsePricing {
    const queryClient = useQueryClient();
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const [searchQuery, setSearchQuery] = useState("");

    const pricingQuery = useQuery({
        queryKey: [pricingQueryKey, "list"],
        queryFn: pricingApi.listPricing,
    });

    const allPrices = useMemo(() => {
        return [...(pricingQuery.data?.prices ?? [])].sort((a, b) => toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt));
    }, [pricingQuery.data?.prices]);
    const count = allPrices.length;
    const totalPages = count > 0 ? Math.ceil(count / limit) : 0;
    const currentPage = Math.min(page, totalPages || 1);

    const paginatedPrices = useMemo(() => {
        const start = (currentPage - 1) * limit;
        return allPrices.slice(start, start + limit);
    }, [allPrices, currentPage, limit]);

    const searchResults = useMemo(() => {
        return searchQuery.trim().length >= 2 ? allPrices.filter((pricing) => matchesSearch(pricing, searchQuery)) : [];
    }, [allPrices, searchQuery]);

    const createMutation = useMutation({
        mutationFn: pricingApi.createPricing,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [pricingQueryKey] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: pricingApi.updatePricing,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [pricingQueryKey] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: pricingApi.deletePricing,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [pricingQueryKey] });
        },
    });

    const getPricing = useCallback(
        async (pricingId: string): Promise<Pricing | null> => {
            if (!pricingId.trim()) {
                throw new Error("Pricing ID is required.");
            }

            const currentPrices =
                pricingQuery.data?.prices ??
                (
                    await queryClient.fetchQuery({
                        queryKey: [pricingQueryKey, "list"],
                        queryFn: pricingApi.listPricing,
                    })
                ).prices;

            return currentPrices.find((pricing) => pricing.id === pricingId) ?? null;
        },
        [pricingQuery.data?.prices, queryClient],
    );

    const createPricing = useCallback(
        async (pricing: Omit<Pricing, "id" | "createdAt" | "updatedAt">): Promise<Pricing> => {
            return createMutation.mutateAsync(pricing);
        },
        [createMutation],
    );

    const updatePricing = useCallback(
        async (pricingId: string, pricing: Omit<Partial<Pricing>, "id" | "createdAt" | "updatedAt">): Promise<void> => {
            await updateMutation.mutateAsync({ id: pricingId, pricing });
        },
        [updateMutation],
    );

    const deletePricing = useCallback(
        async (pricingId: string): Promise<void> => {
            await deleteMutation.mutateAsync(pricingId);
        },
        [deleteMutation],
    );

    const searchPricing = useCallback(async (query: string): Promise<void> => {
        setSearchQuery(query.trim());
    }, []);

    const clearSearch = useCallback(() => {
        setSearchQuery("");
    }, []);

    return {
        prices: paginatedPrices,
        loading: pricingQuery.isLoading || pricingQuery.isFetching,
        error: pricingQuery.error instanceof Error ? pricingQuery.error : null,
        count,
        countLoading: pricingQuery.isLoading || pricingQuery.isFetching,
        totalPages,
        currentPage,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
        getPricing,
        createPricing,
        updatePricing,
        deletePricing,
        searchResults,
        searchLoading: false,
        searchError: null,
        searchTotalHits: searchResults.length,
        searchPricing,
        clearSearch,
    };
}
