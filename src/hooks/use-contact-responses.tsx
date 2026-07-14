import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { contactUsApi } from "@/api/contact-us";
import type { ContactResponses, UseContactResponses } from "@/types/contact-responses";

interface UseContactResponsesOptions {
    limit?: number;
    page?: number;
}

const contactResponsesQueryKey = "contact-responses";

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

const matchesSearch = (response: ContactResponses, query: string): boolean => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return true;

    return [response.id, response.uid, response.name, response.email, response.message]
        .filter((value) => value !== undefined && value !== null)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
};

const useContactResponses = (options?: UseContactResponsesOptions): UseContactResponses => {
    const queryClient = useQueryClient();
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const [searchQuery, setSearchQuery] = useState("");

    const contactResponsesQuery = useQuery({
        queryKey: [contactResponsesQueryKey, "list"],
        queryFn: contactUsApi.listContactResponses,
    });

    const allResponses = useMemo(() => {
        return [...(contactResponsesQuery.data?.responses ?? [])].sort((a, b) => toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt));
    }, [contactResponsesQuery.data?.responses]);
    const count = allResponses.length;
    const totalPages = count > 0 ? Math.ceil(count / limit) : 0;
    const currentPage = Math.min(page, totalPages || 1);

    const paginatedResponses = useMemo(() => {
        const start = (currentPage - 1) * limit;
        return allResponses.slice(start, start + limit);
    }, [allResponses, currentPage, limit]);

    const searchResults = useMemo(() => {
        return searchQuery.trim().length >= 2 ? allResponses.filter((response) => matchesSearch(response, searchQuery)) : [];
    }, [allResponses, searchQuery]);

    const deleteMutation = useMutation({
        mutationFn: contactUsApi.deleteContactResponse,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [contactResponsesQueryKey] });
        },
    });

    const updateContactResponse = useCallback(async (): Promise<void> => {
        throw new Error("Updating contact responses is not supported by the Node API.");
    }, []);

    const deleteContactResponse = useCallback(
        async (id: string): Promise<void> => {
            await deleteMutation.mutateAsync(id);
        },
        [deleteMutation],
    );

    const searchContactResponses = useCallback(async (query: string): Promise<void> => {
        setSearchQuery(query.trim());
    }, []);

    const clearSearch = useCallback(() => {
        setSearchQuery("");
    }, []);

    return {
        responses: paginatedResponses,
        loading: contactResponsesQuery.isLoading || contactResponsesQuery.isFetching,
        error: contactResponsesQuery.error instanceof Error ? contactResponsesQuery.error : null,
        count,
        countLoading: contactResponsesQuery.isLoading || contactResponsesQuery.isFetching,
        totalPages,
        currentPage,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
        updateContactResponse,
        deleteContactResponse,
        searchResults,
        searchLoading: false,
        searchError: null,
        searchTotalHits: searchResults.length,
        searchContactResponses,
        clearSearch,
    };
};

export default useContactResponses;
