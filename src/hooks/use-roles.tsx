import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rolesApi } from "@/api/roles";
import type { Role, UseRole } from "@/types/role";

interface UseRoleOptions {
    limit?: number;
    page?: number;
}

const rolesQueryKey = "roles";

const useRoles = (options?: UseRoleOptions): UseRole => {
    const queryClient = useQueryClient();
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 100;

    const rolesQuery = useQuery({
        queryKey: [rolesQueryKey, "list"],
        queryFn: rolesApi.listRoles,
    });

    const allRoles = rolesQuery.data?.roles ?? [];
    const count = allRoles.length;
    const totalPages = count > 0 ? Math.ceil(count / limit) : 0;
    const currentPage = Math.min(page, totalPages || 1);
    const roles = allRoles.slice((currentPage - 1) * limit, currentPage * limit);

    const createRoleMutation = useMutation({
        mutationFn: rolesApi.createRole,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [rolesQueryKey] });
        },
    });

    const updateRoleMutation = useMutation({
        mutationFn: rolesApi.updateRole,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [rolesQueryKey] });
        },
    });

    const deleteRoleMutation = useMutation({
        mutationFn: rolesApi.deleteRole,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [rolesQueryKey] });
        },
    });

    const getRole = useCallback(
        async (roleId: string): Promise<Role | null> => {
            if (!roleId.trim()) {
                throw new Error("Role ID is required.");
            }

            const currentRoles =
                rolesQuery.data?.roles ??
                (
                    await queryClient.fetchQuery({
                        queryKey: [rolesQueryKey, "list"],
                        queryFn: rolesApi.listRoles,
                    })
                ).roles;

            return currentRoles.find((role) => role.id === roleId) ?? null;
        },
        [queryClient, rolesQuery.data?.roles],
    );

    const createRole = useCallback(
        async (role: Omit<Role, "id" | "createdAt" | "updatedAt">): Promise<Role> => {
            return createRoleMutation.mutateAsync(role);
        },
        [createRoleMutation],
    );

    const updateRole = useCallback(
        async (roleId: string, role: Omit<Partial<Role>, "id" | "createdAt" | "updatedAt">): Promise<void> => {
            await updateRoleMutation.mutateAsync({ id: roleId, role });
        },
        [updateRoleMutation],
    );

    const deleteRole = useCallback(
        async (roleId: string): Promise<void> => {
            await deleteRoleMutation.mutateAsync(roleId);
        },
        [deleteRoleMutation],
    );

    return {
        roles,
        loading: rolesQuery.isLoading || rolesQuery.isFetching,
        error: rolesQuery.error instanceof Error ? rolesQuery.error : null,
        count,
        countLoading: rolesQuery.isLoading || rolesQuery.isFetching,
        totalPages,
        currentPage,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
        getRole,
        createRole,
        updateRole,
        deleteRole,
    };
};

export default useRoles;
