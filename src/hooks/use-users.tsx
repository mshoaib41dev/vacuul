import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { uploadsApi } from "@/api/uploads";
import { usersApi } from "@/api/users";
import type { UseUser, User } from "@/types/user";

interface UseUserOptions {
    limit?: number;
    page?: number;
}

const usersQueryKey = "users";

const useUser = (options?: UseUserOptions): UseUser => {
    const queryClient = useQueryClient();
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const [searchQuery, setSearchQuery] = useState("");

    const usersQuery = useQuery({
        queryKey: [usersQueryKey, "list", { page, limit }],
        queryFn: () => usersApi.listUsers({ page, limit }),
    });

    const searchUsersQuery = useQuery({
        queryKey: [usersQueryKey, "search", { search: searchQuery, limit: 20 }],
        queryFn: () => usersApi.listUsers({ search: searchQuery, page: 1, limit: 20 }),
        enabled: searchQuery.trim().length >= 2,
    });

    const createUserMutation = useMutation({
        mutationFn: usersApi.createUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [usersQueryKey] });
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: usersApi.updateUserStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [usersQueryKey] });
        },
    });

    const updateUserMutation = useMutation({
        mutationFn: usersApi.updateUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [usersQueryKey] });
        },
    });

    const deleteUserMutation = useMutation({
        mutationFn: usersApi.deleteUserAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [usersQueryKey] });
        },
    });

    const createUser = useCallback(
        async (user: { displayName: string; email: string; password: string; roleId?: string | null }): Promise<void> => {
            await createUserMutation.mutateAsync(user);
        },
        [createUserMutation],
    );

    const disableUser = useCallback(
        async (uid: string): Promise<void> => {
            await updateStatusMutation.mutateAsync({ uid, disabled: true });
        },
        [updateStatusMutation],
    );

    const enableUser = useCallback(
        async (uid: string): Promise<void> => {
            await updateStatusMutation.mutateAsync({ uid, disabled: false });
        },
        [updateStatusMutation],
    );

    const getUser = useCallback(
        async (userId: string) => {
            const cachedUsers = queryClient.getQueriesData<Awaited<ReturnType<typeof usersApi.listUsers>>>({ queryKey: [usersQueryKey] });
            const cachedUser = cachedUsers.flatMap(([, data]) => data?.users ?? []).find((user) => user.id === userId);

            if (cachedUser) {
                return cachedUser;
            }

            return usersApi.getUser(userId);
        },
        [queryClient],
    );

    const updateUser = useCallback(
        async (userId: string, user: Omit<Partial<User>, "id" | "createdAt" | "lastUpdated">, selectedFile?: File): Promise<void> => {
            const photoURL = selectedFile ? (await uploadsApi.uploadProfilePhoto(selectedFile)).url : user.photoURL;

            await updateUserMutation.mutateAsync({
                uid: userId,
                displayName: user.displayName,
                sessions: user.sessions,
                roleId: user.roleId,
                photoURL,
                disabled: user.disabled,
            });
        },
        [updateUserMutation],
    );

    const deleteUserAccount = useCallback(
        async (userId: string): Promise<void> => {
            await deleteUserMutation.mutateAsync(userId);
        },
        [deleteUserMutation],
    );

    const searchUsers = useCallback(async (query: string): Promise<void> => {
        setSearchQuery(query.trim());
    }, []);

    const clearSearch = useCallback(() => {
        setSearchQuery("");
    }, []);

    const total = usersQuery.data?.total ?? null;
    const totalPages = usersQuery.data?.totalPages ?? 0;
    const currentPage = usersQuery.data?.page ?? page;
    const searchError = searchUsersQuery.error instanceof Error ? searchUsersQuery.error.message : null;

    return {
        users: usersQuery.data?.users ?? [],
        loading: usersQuery.isLoading || usersQuery.isFetching,
        error: usersQuery.error instanceof Error ? usersQuery.error : null,
        count: total,
        countLoading: usersQuery.isLoading || usersQuery.isFetching,
        totalPages,
        currentPage,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
        getUser,
        createUser,
        updateUser,
        disableUser,
        enableUser,
        deleteUserAccount,
        searchResults: searchUsersQuery.data?.users ?? [],
        searchLoading: searchUsersQuery.isLoading || searchUsersQuery.isFetching,
        searchError,
        searchTotalHits: searchUsersQuery.data?.total ?? 0,
        searchUsers,
        clearSearch,
    };
};

export default useUser;
