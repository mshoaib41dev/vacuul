import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { contentsApi } from "@/api/contents";
import type { Content, UseContent } from "@/types/content";

interface UseContentOptions {
    limit?: number;
    page?: number;
}

const contentsQueryKey = "contents";

const matchesSearch = (content: Content, query: string): boolean => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return true;

    return [content.id, content.name, content.type, content.uploadedBy]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
};

const useContent = (options?: UseContentOptions): UseContent => {
    const queryClient = useQueryClient();
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const [searchQuery, setSearchQuery] = useState("");

    const contentsQuery = useQuery({
        queryKey: [contentsQueryKey, "list", { page, limit }],
        queryFn: () => contentsApi.listContents({ page, limit }),
    });

    const deleteContentMutation = useMutation({
        mutationFn: contentsApi.deleteContent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [contentsQueryKey] });
        },
    });

    const allContents = contentsQuery.data?.contents ?? [];
    const searchResults = useMemo(() => {
        return searchQuery.trim().length >= 2 ? allContents.filter((content) => matchesSearch(content, searchQuery)) : [];
    }, [allContents, searchQuery]);

    const getContent = useCallback(
        async (contentId: string): Promise<Content | null> => {
            if (!contentId.trim()) {
                throw new Error("Content ID is required.");
            }

            const currentContents =
                contentsQuery.data?.contents ??
                (
                    await queryClient.fetchQuery({
                        queryKey: [contentsQueryKey, "list", { page, limit }],
                        queryFn: () => contentsApi.listContents({ page, limit }),
                    })
                ).contents;

            return currentContents.find((content) => content.id === contentId) ?? null;
        },
        [contentsQuery.data?.contents, limit, page, queryClient],
    );

    const uploadContent = useCallback(
        async (file: File, onProgress: (progress: number) => void): Promise<Content> => {
            onProgress(0);
            const content = await contentsApi.uploadContent(file);
            onProgress(100);
            await queryClient.invalidateQueries({ queryKey: [contentsQueryKey] });
            return content;
        },
        [queryClient],
    );

    const deleteContent = useCallback(
        async (contentId: string): Promise<void> => {
            await deleteContentMutation.mutateAsync(contentId);
        },
        [deleteContentMutation],
    );

    const searchContents = useCallback(async (query: string): Promise<void> => {
        setSearchQuery(query.trim());
    }, []);

    const clearSearch = useCallback(() => {
        setSearchQuery("");
    }, []);

    return {
        contents: allContents,
        loading: contentsQuery.isLoading || contentsQuery.isFetching,
        error: contentsQuery.error instanceof Error ? contentsQuery.error : null,
        count: contentsQuery.data?.total ?? null,
        countLoading: contentsQuery.isLoading || contentsQuery.isFetching,
        totalPages: contentsQuery.data?.totalPages ?? 0,
        currentPage: contentsQuery.data?.page ?? page,
        hasNextPage: (contentsQuery.data?.page ?? page) < (contentsQuery.data?.totalPages ?? 0),
        hasPreviousPage: (contentsQuery.data?.page ?? page) > 1,
        getContent,
        uploadContent,
        deleteContent,
        searchResults,
        searchLoading: false,
        searchError: null,
        searchTotalHits: searchResults.length,
        searchContents,
        clearSearch,
    };
};

export default useContent;
