import { DocumentReference, FirestoreError, Timestamp } from "firebase/firestore";

interface FirmwareUpdates {
    id: string;
    file: string;
    debianRevision: number;
    upstreamVersion: string;
    uploadedBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

interface UseFirmwareUpdates {
    firmwareUpdates: FirmwareUpdates[];
    loading: boolean;
    error: FirestoreError | null;
    count: number | null;
    countLoading: boolean;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    getFirmwareUpdate: (firmwareUpdateId: string) => Promise<FirmwareUpdates | null>;
    uploadFirmwareUpdate: (file: File, metadata: { debianRevision: number; upstreamVersion: string }, onProgress: (progress: number) => void) => Promise<DocumentReference<FirmwareUpdates>>;
    updateFirmwareUpdate: (firmwareUpdateId: string, updates: { debianRevision?: number; upstreamVersion?: string }) => Promise<void>;
    deleteFirmwareUpdate: (firmwareUpdateId: string) => Promise<void>;
    // Algolia search functionality
    searchResults: FirmwareUpdates[];
    searchLoading: boolean;
    searchError: string | null;
    searchTotalHits: number;
    searchFirmwareUpdates: (query: string) => Promise<void>;
    clearSearch: () => void;
}

export type { FirmwareUpdates, UseFirmwareUpdates };