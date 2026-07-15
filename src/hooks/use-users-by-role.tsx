import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/api/users";
import type { User } from "@/types/user";

interface UseUsersByRoleOptions {
    roleId?: string;
}

interface UseUsersByRoleReturn {
    users: User[];
    loading: boolean;
    error: Error | null;
}

const usersByRoleQueryKey = "users-by-role";

const useUsersByRole = (options?: UseUsersByRoleOptions): UseUsersByRoleReturn => {
    const roleId = options?.roleId?.trim();

    const usersQuery = useQuery({
        queryKey: [usersByRoleQueryKey, { roleId }],
        queryFn: () => usersApi.listUsers({ page: 1, limit: 5000 }),
    });

    const users = useMemo(() => {
        const allUsers = usersQuery.data?.users ?? [];
        const filteredUsers = roleId ? allUsers.filter((user) => user.roleId === roleId) : allUsers;

        return [...filteredUsers].sort((firstUser, secondUser) =>
            (firstUser.displayName ?? firstUser.email ?? "").localeCompare(secondUser.displayName ?? secondUser.email ?? ""),
        );
    }, [roleId, usersQuery.data?.users]);

    return {
        users,
        loading: usersQuery.isLoading,
        error: usersQuery.error instanceof Error ? usersQuery.error : null,
    };
};

export default useUsersByRole;
