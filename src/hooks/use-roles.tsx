import { DocumentReference } from "firebase/firestore";
import { kDebugMode } from "@/config";
// Import the generic hook
import useFirestoreCollection, { FirestoreQueryConstraints } from "@/hooks/use-firestore-collection";
// Import the Role type
import type { Role } from "@/types/role";
import { UseRole } from "@/types/role";

// Define the specific collection path
const ROLES_COLLECTION = "roles";

interface UseRoleOptions extends FirestoreQueryConstraints {
    // Add any role-specific options here if needed
}

/**
 * Custom Hook specifically for managing CRUD operations for the 'roles'
 * Firestore collection with real-time updates and pagination support.
 *
 * This hook uses useFirestoreCollection.
 *
 * @param options - Query options including pagination parameters
 * @returns {UseRole} An object containing role state and functions.
 */
const useRoles = (options?: UseRoleOptions): UseRole => {
    // Call the generic hook with the specific type (Role) and collection path
    const {
        docs,
        loading,
        error,
        count,
        countLoading,
        totalPages,
        currentPage,
        hasNextPage,
        hasPreviousPage,
        getDocument,
        addDocument,
        updateDocument,
        deleteDocument,
    } = useFirestoreCollection<Role>(ROLES_COLLECTION, {
        orderByField: "createdAt",
        orderByDirection: "desc",
        getCount: false,
        ...options,
    });

    const getRole = async (roleId: string): Promise<Role | null> => {
        try {
            const doc = await getDocument(roleId);
            return doc as Role | null;
        } catch (err) {
            if (kDebugMode) {
                console.error("[useRoles] Error getting role:", err);
            }
            throw err;
        }
    };

    // Add a new role
    const createRole = async (role: Omit<Role, "id" | "createdAt" | "updatedAt">): Promise<DocumentReference<Role>> => {
        try {
            return await addDocument({
                ...role,
            } as Role);
        } catch (err) {
            if (kDebugMode) {
                console.error("[useRoles] Error creating role:", err);
            }
            throw err;
        }
    };

    // Update an existing role
    const updateRole = async (roleId: string, role: Omit<Partial<Role>, "id" | "createdAt" | "updatedAt">): Promise<void> => {
        try {
            await updateDocument(roleId, { ...role });
        } catch (err) {
            if (kDebugMode) {
                console.error("[useRoles] Error updating role:", err);
            }
            throw err;
        }
    };

    // Delete a role
    const deleteRole = async (roleId: string): Promise<void> => {
        try {
            await deleteDocument(roleId);
        } catch (err) {
            console.error("[useRoles] Error deleting role:", err);
            throw err;
        }
    };

    return {
        roles: docs,
        loading: loading,
        error,
        count,
        countLoading,
        totalPages,
        currentPage,
        hasNextPage,
        hasPreviousPage,
        getRole,
        createRole,
        updateRole,
        deleteRole,
    };
};

export default useRoles;
