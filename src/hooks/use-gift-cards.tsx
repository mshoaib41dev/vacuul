import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { giftCardsApi } from "@/api/gift-cards";
import type { UseGiftCard, GiftCard } from "@/types/gift-card";

interface UseGiftCardOptions {
    limit?: number;
    page?: number;
}

const giftCardsQueryKey = "gift-cards";

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

const matchesSearch = (giftCard: GiftCard, query: string): boolean => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return true;

    return [
        giftCard.code,
        giftCard.paymentId,
        giftCard.amount,
        giftCard.currency,
        giftCard.sessions,
        giftCard.purchasedBy,
        giftCard.used ? "used" : "available",
        giftCard.usedBy,
    ]
        .filter((value) => value !== undefined && value !== null)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
};

const useGiftCard = (options?: UseGiftCardOptions): UseGiftCard => {
    const queryClient = useQueryClient();
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const [searchQuery, setSearchQuery] = useState("");

    const giftCardsQuery = useQuery({
        queryKey: [giftCardsQueryKey, "list"],
        queryFn: giftCardsApi.listGiftCards,
    });

    const allGiftCards = useMemo(() => {
        return [...(giftCardsQuery.data?.giftCards ?? [])].sort((a, b) => toTimestampMs(b.purchaseDate) - toTimestampMs(a.purchaseDate));
    }, [giftCardsQuery.data?.giftCards]);
    const count = allGiftCards.length;
    const totalPages = count > 0 ? Math.ceil(count / limit) : 0;
    const currentPage = Math.min(page, totalPages || 1);

    const paginatedGiftCards = useMemo(() => {
        const start = (currentPage - 1) * limit;
        return allGiftCards.slice(start, start + limit);
    }, [allGiftCards, currentPage, limit]);

    const searchResults = useMemo(() => {
        return searchQuery.trim().length >= 2 ? allGiftCards.filter((giftCard) => matchesSearch(giftCard, searchQuery)) : [];
    }, [allGiftCards, searchQuery]);

    const createMutation = useMutation({
        mutationFn: giftCardsApi.createGiftCard,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [giftCardsQueryKey] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: giftCardsApi.deleteGiftCard,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [giftCardsQueryKey] });
        },
    });

    const getGiftCard = useCallback(
        async (code: string): Promise<GiftCard | null> => {
            if (!code.trim()) {
                throw new Error("Gift card code is required.");
            }

            const currentGiftCards =
                giftCardsQuery.data?.giftCards ??
                (
                    await queryClient.fetchQuery({
                        queryKey: [giftCardsQueryKey, "list"],
                        queryFn: giftCardsApi.listGiftCards,
                    })
                ).giftCards;

            return currentGiftCards.find((giftCard) => giftCard.code === code) ?? null;
        },
        [giftCardsQuery.data?.giftCards, queryClient],
    );

    const createGiftCard = useCallback(
        async (sessions: number): Promise<GiftCard | null> => {
            return createMutation.mutateAsync({ sessions });
        },
        [createMutation],
    );

    const deleteGiftCard = useCallback(
        async (code: string): Promise<void> => {
            await deleteMutation.mutateAsync(code);
        },
        [deleteMutation],
    );

    const searchGiftCards = useCallback(async (query: string): Promise<void> => {
        setSearchQuery(query.trim());
    }, []);

    const clearSearch = useCallback(() => {
        setSearchQuery("");
    }, []);

    return {
        giftCards: paginatedGiftCards,
        loading: giftCardsQuery.isLoading || giftCardsQuery.isFetching,
        error: giftCardsQuery.error instanceof Error ? giftCardsQuery.error : null,
        count,
        countLoading: giftCardsQuery.isLoading || giftCardsQuery.isFetching,
        totalPages,
        currentPage,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
        getGiftCard,
        createGiftCard,
        deleteGiftCard,
        searchResults,
        searchLoading: false,
        searchError: null,
        searchTotalHits: searchResults.length,
        searchGiftCards,
        clearSearch,
    };
};

export default useGiftCard;
