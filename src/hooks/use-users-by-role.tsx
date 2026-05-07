import { useMemo } from "react";
import { where } from "firebase/firestore";
import useFirestoreCollection from "@/hooks/use-firestore-collection";
import type { User } from "@/types/user";

const USERS_COLLECTION = "users";

interface UseUsersByRoleOptions {
    roleId?: string;
}

interface UseUsersByRoleReturn {
    users: User[];
    loading: boolean;
    error: any;
}

/**
 * Custom hook to get users filtered by roleId
 * Uses the extended useFirestoreCollection with where constraints
 */
const useUsersByRole = (options?: UseUsersByRoleOptions): UseUsersByRoleReturn => {
    const { roleId } = options || {};

    const whereConstraints = useMemo(() => {
        return roleId ? [where("roleId", "==", roleId)] : undefined;
    }, [roleId]);

    const queryOptions = useMemo(
        () => ({
            whereConstraints,
            limit: 5000,
            getCount: false,
            orderByField: "displayName",
            orderByDirection: "asc" as const,
        }),
        [whereConstraints],
    );

    const { docs, loading, error } = useFirestoreCollection<User>(USERS_COLLECTION, queryOptions);

    return {
        users: docs,
        loading,
        error,
    };
};

export default useUsersByRole;
