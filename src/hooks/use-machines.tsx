import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { machinesApi } from "@/api/machines";
import type { Machine, UseMachine } from "@/types/machine";

interface UseMachineOptions {
    limit?: number;
    page?: number;
}

const machinesQueryKey = "machines";

const matchesSearch = (machine: Machine, query: string): boolean => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return true;

    return [machine.id, machine.commissionId, machine.name, machine.address, machine.status, machine.ownerUserId, machine.createdByUserId]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
};

const useMachine = (options?: UseMachineOptions): UseMachine => {
    const queryClient = useQueryClient();
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const [searchQuery, setSearchQuery] = useState("");

    const machinesQuery = useQuery({
        queryKey: [machinesQueryKey, "list"],
        queryFn: machinesApi.listMachines,
    });

    const allMachines = machinesQuery.data?.machines ?? [];
    const count = allMachines.length;
    const totalPages = count > 0 ? Math.ceil(count / limit) : 0;
    const currentPage = Math.min(page, totalPages || 1);
    const paginatedMachines = useMemo(() => {
        const start = (currentPage - 1) * limit;
        return allMachines.slice(start, start + limit);
    }, [allMachines, currentPage, limit]);

    const searchResults = useMemo(() => {
        return searchQuery.trim().length >= 2 ? allMachines.filter((machine) => matchesSearch(machine, searchQuery)) : [];
    }, [allMachines, searchQuery]);

    const registerMutation = useMutation({
        mutationFn: machinesApi.registerMachine,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [machinesQueryKey] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: machinesApi.updateMachine,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [machinesQueryKey] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: machinesApi.deleteMachine,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [machinesQueryKey] });
        },
    });

    const getMachine = useCallback(
        async (machineId: string): Promise<Machine | null> => {
            if (!machineId) {
                throw new Error("Machine ID is required.");
            }

            const currentMachines =
                machinesQuery.data?.machines ??
                (
                    await queryClient.fetchQuery({
                        queryKey: [machinesQueryKey, "list"],
                        queryFn: machinesApi.listMachines,
                    })
                ).machines;

            return currentMachines.find((machine) => machine.id === machineId) ?? null;
        },
        [machinesQuery.data?.machines, queryClient],
    );

    const registerMachine = useCallback(
        async (
            machine: Omit<
                Machine,
                "id" | "timezone" | "wifiCountry" | "languageCode" | "createdAt" | "updatedAt" | "lastOnline" | "volume" | "brightness" | "createdByUserId"
            >,
        ): Promise<Machine> => {
            return registerMutation.mutateAsync(machine);
        },
        [registerMutation],
    );

    const updateMachine = useCallback(
        async (machineId: string, machine: Omit<Partial<Machine>, "id" | "createdAt" | "updatedAt" | "lastOnline">): Promise<void> => {
            await updateMutation.mutateAsync({ id: machineId, machine });
        },
        [updateMutation],
    );

    const deleteMachine = useCallback(
        async (machineId: string): Promise<void> => {
            await deleteMutation.mutateAsync(machineId);
        },
        [deleteMutation],
    );

    const searchMachines = useCallback(async (query: string): Promise<void> => {
        setSearchQuery(query.trim());
    }, []);

    const clearSearch = useCallback(() => {
        setSearchQuery("");
    }, []);

    return {
        machines: paginatedMachines,
        loading: machinesQuery.isLoading || machinesQuery.isFetching,
        error: machinesQuery.error instanceof Error ? machinesQuery.error : null,
        count,
        countLoading: machinesQuery.isLoading || machinesQuery.isFetching,
        totalPages,
        currentPage,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
        getMachine,
        registerMachine,
        updateMachine,
        deleteMachine,
        searchResults,
        searchLoading: false,
        searchError: null,
        searchTotalHits: searchResults.length,
        searchMachines,
        clearSearch,
    };
};

export default useMachine;
