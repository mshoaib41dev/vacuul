interface SystemLog {
    id: string;
    machineId: string;
    sessionId?: string;
    error: {
        code: string;
        message: string;
        severity: string;
        timestamp: unknown;
    };
    createdAt?: unknown;
    updatedAt?: unknown;
}

interface UseSystemLogs {
    systemLogs: SystemLog[];
    loading: boolean;
    error: Error | null;
    count: number | null;
    countLoading: boolean;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    searchResults: SystemLog[];
    searchLoading: boolean;
    searchError: string | null;
    searchTotalHits: number;
    searchSystemLogs: (query: string) => Promise<void>;
    clearSearch: () => void;
}

export type { SystemLog, UseSystemLogs };
