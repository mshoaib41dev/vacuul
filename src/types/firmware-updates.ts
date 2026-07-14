interface FirmwareUpdates {
    id: string;
    file: string;
    fileName?: string;
    debianRevision: number;
    upstreamVersion: string;
    uploadedBy: string;
    createdAt?: unknown;
    updatedAt?: unknown;
}

interface UseFirmwareUpdates {
    firmwareUpdates: FirmwareUpdates[];
    loading: boolean;
    error: Error | null;
    count: number | null;
    countLoading: boolean;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    getFirmwareUpdate: (firmwareUpdateId: string) => Promise<FirmwareUpdates | null>;
    uploadFirmwareUpdate: (file: File, metadata: { debianRevision: number; upstreamVersion: string }, onProgress: (progress: number) => void) => Promise<FirmwareUpdates>;
    updateFirmwareUpdate: (firmwareUpdateId: string, updates: { debianRevision?: number; upstreamVersion?: string }) => Promise<void>;
    deleteFirmwareUpdate: (firmwareUpdateId: string) => Promise<void>;
    searchResults: FirmwareUpdates[];
    searchLoading: boolean;
    searchError: string | null;
    searchTotalHits: number;
    searchFirmwareUpdates: (query: string) => Promise<void>;
    clearSearch: () => void;
}

export type { FirmwareUpdates, UseFirmwareUpdates };
