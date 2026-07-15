import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type ListSystemLogsRequest, systemLogsApi } from "@/api/system-logs";
import type { SystemLog, UseSystemLogs } from "@/types/system-logs";

interface UseSystemLogsOptions {
    machineId?: string;
    page?: number;
    limit?: number;
}

const systemLogsQueryKey = "system-logs";

const buildListRequest = (machineId: string | undefined, page: number, limit: number): ListSystemLogsRequest => ({
    machineId: machineId || undefined,
    page,
    limit,
});

const normalizeSearchValue = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return String(value).toLowerCase();
    }
    return "";
};

const systemLogMatchesQuery = (log: SystemLog, query: string): boolean => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return false;

    const searchableValues = [log.id, log.machineId, log.sessionId, log.error.code, log.error.message, log.error.severity, log.error.timestamp];

    return searchableValues.some((value) => normalizeSearchValue(value).includes(normalizedQuery));
};

const useSystemLogs = (options?: UseSystemLogsOptions): UseSystemLogs => {
    const machineId = options?.machineId;
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
    const request = useMemo(() => buildListRequest(machineId, page, limit), [limit, machineId, page]);
    const searchRequest = useMemo(() => buildListRequest(machineId, 1, 500), [machineId]);
    const searchRequestId = useRef(0);
    const [searchResults, setSearchResults] = useState<SystemLog[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const systemLogsQuery = useQuery({
        queryKey: [systemLogsQueryKey, "list", request],
        queryFn: () => systemLogsApi.listSystemLogs(request),
        enabled: Boolean(machineId),
    });

    const searchSystemLogs = useCallback(
        async (query: string): Promise<void> => {
            const requestId = searchRequestId.current + 1;
            searchRequestId.current = requestId;
            const normalizedQuery = query.trim();
            setSearchError(null);

            if (!machineId || !normalizedQuery) {
                if (requestId === searchRequestId.current) {
                    setSearchResults([]);
                    setSearchLoading(false);
                }
                return;
            }

            try {
                setSearchLoading(true);
                const response = await systemLogsApi.listSystemLogs(searchRequest);

                if (requestId !== searchRequestId.current) {
                    return;
                }

                setSearchResults(response.logs.filter((log) => systemLogMatchesQuery(log, normalizedQuery)));
            } catch (error) {
                if (requestId !== searchRequestId.current) {
                    return;
                }

                const message = error instanceof Error ? error.message : "Search failed";
                setSearchError(message);
                setSearchResults([]);
                throw error;
            } finally {
                if (requestId === searchRequestId.current) {
                    setSearchLoading(false);
                }
            }
        },
        [machineId, searchRequest],
    );

    const clearSearch = useCallback(() => {
        searchRequestId.current += 1;
        setSearchResults([]);
        setSearchError(null);
        setSearchLoading(false);
    }, []);

    return {
        systemLogs: machineId ? (systemLogsQuery.data?.logs ?? []) : [],
        loading: Boolean(machineId) && (systemLogsQuery.isLoading || systemLogsQuery.isFetching),
        error: systemLogsQuery.error instanceof Error ? systemLogsQuery.error : null,
        count: machineId ? (systemLogsQuery.data?.total ?? null) : null,
        countLoading: Boolean(machineId) && (systemLogsQuery.isLoading || systemLogsQuery.isFetching),
        totalPages: machineId ? (systemLogsQuery.data?.totalPages ?? 0) : 0,
        currentPage: systemLogsQuery.data?.page ?? page,
        hasNextPage: Boolean(machineId) && (systemLogsQuery.data?.page ?? page) < (systemLogsQuery.data?.totalPages ?? 0),
        hasPreviousPage: Boolean(machineId) && (systemLogsQuery.data?.page ?? page) > 1,
        searchResults,
        searchLoading,
        searchError,
        searchTotalHits: searchResults.length,
        searchSystemLogs,
        clearSearch,
    };
};

export default useSystemLogs;
