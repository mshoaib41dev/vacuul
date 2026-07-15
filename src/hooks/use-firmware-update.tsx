import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { firmwareApi } from "@/api/firmware";
import type { FirmwareUpdates, UseFirmwareUpdates } from "@/types/firmware-updates";

interface UseFirmwareUpdatesOptions {
    limit?: number;
    page?: number;
}

const firmwareQueryKey = "firmware";

const matchesSearch = (firmware: FirmwareUpdates, query: string): boolean => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return true;

    return [firmware.id, firmware.fileName, firmware.file, firmware.debianRevision, firmware.upstreamVersion, firmware.uploadedBy]
        .filter((value) => value !== undefined && value !== null)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
};

const useFirmwareUpdates = (options?: UseFirmwareUpdatesOptions): UseFirmwareUpdates => {
    const queryClient = useQueryClient();
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const [searchQuery, setSearchQuery] = useState("");

    const firmwareQuery = useQuery({
        queryKey: [firmwareQueryKey, "list"],
        queryFn: firmwareApi.listFirmware,
    });

    const updateFirmwareMutation = useMutation({
        mutationFn: firmwareApi.updateFirmware,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [firmwareQueryKey] });
        },
    });

    const deleteFirmwareMutation = useMutation({
        mutationFn: firmwareApi.deleteFirmware,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [firmwareQueryKey] });
        },
    });

    const allFirmware = firmwareQuery.data?.firmwareUpdates ?? [];
    const totalPages = Math.ceil(allFirmware.length / limit);
    const paginatedFirmware = useMemo(() => {
        const start = (page - 1) * limit;
        return allFirmware.slice(start, start + limit);
    }, [allFirmware, limit, page]);

    const searchResults = useMemo(() => {
        return searchQuery.trim().length >= 2 ? allFirmware.filter((firmware) => matchesSearch(firmware, searchQuery)) : [];
    }, [allFirmware, searchQuery]);

    const getFirmwareUpdate = useCallback(
        async (firmwareUpdateId: string): Promise<FirmwareUpdates | null> => {
            if (!firmwareUpdateId.trim()) {
                throw new Error("Firmware ID is required.");
            }

            const currentFirmware =
                firmwareQuery.data?.firmwareUpdates ??
                (
                    await queryClient.fetchQuery({
                        queryKey: [firmwareQueryKey, "list"],
                        queryFn: firmwareApi.listFirmware,
                    })
                ).firmwareUpdates;

            return currentFirmware.find((firmware) => firmware.id === firmwareUpdateId) ?? null;
        },
        [firmwareQuery.data?.firmwareUpdates, queryClient],
    );

    const uploadFirmwareUpdate = useCallback(
        async (file: File, metadata: { debianRevision: number; upstreamVersion: string }, onProgress: (progress: number) => void): Promise<FirmwareUpdates> => {
            onProgress(0);
            const firmware = await firmwareApi.uploadFirmware(file, metadata);
            onProgress(100);
            await queryClient.invalidateQueries({ queryKey: [firmwareQueryKey] });
            return firmware;
        },
        [queryClient],
    );

    const updateFirmwareUpdate = useCallback(
        async (firmwareUpdateId: string, updates: { debianRevision?: number; upstreamVersion?: string }): Promise<void> => {
            await updateFirmwareMutation.mutateAsync({ id: firmwareUpdateId, firmware: updates });
        },
        [updateFirmwareMutation],
    );

    const deleteFirmwareUpdate = useCallback(
        async (firmwareUpdateId: string): Promise<void> => {
            await deleteFirmwareMutation.mutateAsync(firmwareUpdateId);
        },
        [deleteFirmwareMutation],
    );

    const searchFirmwareUpdates = useCallback(async (query: string): Promise<void> => {
        setSearchQuery(query.trim());
    }, []);

    const clearSearch = useCallback(() => {
        setSearchQuery("");
    }, []);

    return {
        firmwareUpdates: paginatedFirmware,
        loading: firmwareQuery.isLoading || firmwareQuery.isFetching,
        error: firmwareQuery.error instanceof Error ? firmwareQuery.error : null,
        count: allFirmware.length,
        countLoading: firmwareQuery.isLoading || firmwareQuery.isFetching,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        getFirmwareUpdate,
        uploadFirmwareUpdate,
        updateFirmwareUpdate,
        deleteFirmwareUpdate,
        searchResults,
        searchLoading: false,
        searchError: null,
        searchTotalHits: searchResults.length,
        searchFirmwareUpdates,
        clearSearch,
    };
};

export default useFirmwareUpdates;
