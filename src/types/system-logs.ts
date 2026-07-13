import { FirestoreError, Timestamp } from "@firebase/firestore";

interface SystemLog {
    id: string;
    machineId: string;
    sessionId?: string;
    error: {
        code: string;
        message: string;
        severity: string;
        timestamp: Timestamp;
    };
}

interface UseSystemLogs {
    systemLogs: SystemLog[];
    loading: boolean;
    error: FirestoreError | null;
    count: number | null;
    countLoading: boolean;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    // Algolia search functionality
    searchResults: SystemLog[];
    searchLoading: boolean;
    searchError: string | null;
    searchTotalHits: number;
    searchSystemLogs: (query: string) => Promise<void>;
    clearSearch: () => void;
}

export type { SystemLog, UseSystemLogs };
