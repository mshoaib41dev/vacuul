import { DocumentReference, FirestoreError, Timestamp } from "firebase/firestore";

export interface Role {
    id: string;
    name: string;
    // Collection-specific CRUD permissions
    permissions: PermissionMap;
    isSystemRole: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface CrudPermissions {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
}

// All collections in your system - add/remove as needed
export type CollectionName =
    | "users"
    | "roles"
    | "machines"
    | "time_slots"
    | "gift_cards"
    | "system_logs"
    | "content"
    | "pricing"
    | "bookings"
    | "sessions"
    | "contact_us"
    | "firmware_packages";

export type PermissionMap = {
    [K in CollectionName]: CrudPermissions;
};

export type PartialPermissionMap = {
    [K in CollectionName]?: Partial<CrudPermissions>;
};

// Helper function to create empty permission map (all permissions false)
export function createEmptyPermissionMap(): PermissionMap {
    const collections: CollectionName[] = [
        "users",
        "roles",
        "machines",
        "time_slots",
        "gift_cards",
        "system_logs",
        "content",
        "pricing",
        "bookings",
        "sessions",
        "contact_us",
        "firmware_packages",
    ];

    return collections.reduce((map, collection) => {
        map[collection] = { create: false, read: false, update: false, delete: false };
        return map;
    }, {} as PermissionMap);
}

export interface UseRole {
    roles: Role[];
    loading: boolean;
    error: FirestoreError | null;
    count: number | null;
    countLoading: boolean;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    getRole: (roleId: string) => Promise<Role | null>;
    createRole: (role: Omit<Role, "id" | "createdAt" | "updatedAt">) => Promise<DocumentReference<Role>>;
    updateRole: (roleId: string, role: Omit<Partial<Role>, "id" | "createdAt" | "updatedAt">) => Promise<void>;
    deleteRole: (roleId: string) => Promise<void>;
}
