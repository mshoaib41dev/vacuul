type UserTimestamp = unknown;

interface User {
    id: string;
    displayName?: string;
    email?: string;
    lastUpdated?: UserTimestamp;
    photoURL?: string;
    sessions?: number;
    stripeId?: string;
    stripeLink?: string;
    roleId?: string | null;
    disabled?: boolean;
    createdAt?: UserTimestamp;
}

interface UseUser {
    users: User[];
    loading: boolean;
    error: Error | null;
    count: number | null;
    countLoading: boolean;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    getUser: (userId: string) => Promise<User | null>;
    createUser: (user: { displayName: string; email: string; password: string; roleId?: string | null }) => Promise<void>;
    updateUser: (userId: string, user: Omit<Partial<User>, "id" | "createdAt" | "lastUpdated">, selectedFile?: File | undefined) => Promise<void>;
    disableUser: (userId: string) => Promise<void>;
    enableUser: (userId: string) => Promise<void>;
    deleteUserAccount: (userId: string) => Promise<void>;
    // Search functionality
    searchResults: User[];
    searchLoading: boolean;
    searchError: string | null;
    searchTotalHits: number;
    searchUsers: (query: string) => Promise<void>;
    clearSearch: () => void;
}

export type { User, UseUser };
