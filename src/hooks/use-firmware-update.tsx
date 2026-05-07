import { DocumentReference } from "firebase/firestore";
import { kDebugMode } from "@/config";
// Import Algolia search hook
import useAlgoliaSearch from "@/hooks/use-algolia-search";
// Import Firebase storage hook
import useFirebaseStorage from "@/hooks/use-firebase-storage";
// Import the generic hook
import useFirestoreCollection, { FirestoreQueryConstraints } from "@/hooks/use-firestore-collection";
// Import the FirmwareUpdates type
import type { FirmwareUpdates, UseFirmwareUpdates } from "@/types/firmware-updates";
import { useAuth } from "./use-auth";

// Define the specific collection path
const FIRMWARE_UPDATES_COLLECTION = "firmware_packages";
// Define the Algolia index name
const FIRMWARE_UPDATES_INDEX = "firmware_packages";

interface UseFirmwareUpdatesOptions extends FirestoreQueryConstraints {
    // Add any firmware-specific options here if needed
}

/**
 * Custom Hook specifically for managing CRUD operations for the 'firmware_packages'
 * Firestore collection with real-time updates, pagination, search, and file upload support.
 *
 * This hook uses useFirestoreCollection, useAlgoliaSearch, and useFirebaseStorage.
 *
 * @param options - Query options including pagination parameters
 * @returns {UseFirmwareUpdates} An object containing firmware updates state and functions.
 */
const useFirmwareUpdates = (options?: UseFirmwareUpdatesOptions): UseFirmwareUpdates => {
    const { user } = useAuth();

    // Call the generic hook with the specific type (FirmwareUpdates) and collection path
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
        deleteDocument 
    } = useFirestoreCollection<FirmwareUpdates>(FIRMWARE_UPDATES_COLLECTION, {
        orderByField: "createdAt",
        orderByDirection: "desc",
        getCount: true,
        ...options,
    });

    // Initialize Algolia search hook
    const { searchResults, loading: searchLoading, error: searchError, totalHits: searchTotalHits, search, clearSearch } = useAlgoliaSearch<FirmwareUpdates>();

    // Initialize Firebase storage hook for file uploads
    const { uploadFile, deleteFile } = useFirebaseStorage();

    const getFirmwareUpdate = async (firmwareUpdateId: string): Promise<FirmwareUpdates | null> => {
        try {
            const doc = await getDocument(firmwareUpdateId);
            return doc as FirmwareUpdates | null;
        } catch (err) {
            if (kDebugMode) {
                console.error("[useFirmwareUpdates] Error getting firmware update:", err);
            }
            throw err;
        }
    };

    // Upload firmware file and create Firestore document
    const uploadFirmwareUpdate = async (
        file: File, 
        metadata: { debianRevision: number; upstreamVersion: string }, 
        onProgress: (progress: number) => void
    ): Promise<DocumentReference<FirmwareUpdates>> => {
        try {
            // Upload file to Firebase Storage with progress tracking
            const { uploadPromise } = uploadFile(file, "dfu", onProgress);

            // Upload completed successfully
            const downloadURL = await uploadPromise;

            if (!downloadURL) {
                throw new Error("Upload failed - no download URL returned");
            }

            // Create Firestore document with file metadata
            return await addDocument({
                file: downloadURL,
                debianRevision: metadata.debianRevision,
                upstreamVersion: metadata.upstreamVersion,
                uploadedBy: user?.id || "unknown",
            } as FirmwareUpdates);
        } catch (err) {
            if (kDebugMode) {
                console.error("[useFirmwareUpdates] Error uploading firmware update:", err);
            }
            throw err;
        }
    };

    // Update firmware update metadata (only debianRevision and upstreamVersion)
    const updateFirmwareUpdate = async (
        firmwareUpdateId: string, 
        updates: { debianRevision?: number; upstreamVersion?: string }
    ): Promise<void> => {
        try {
            await updateDocument(firmwareUpdateId, updates);
        } catch (err) {
            if (kDebugMode) {
                console.error("[useFirmwareUpdates] Error updating firmware update:", err);
            }
            throw err;
        }
    };

    // Delete a firmware update file (both Firestore document and Storage file)
    const deleteFirmwareUpdate = async (firmwareUpdateId: string): Promise<void> => {
        try {
            // First get the firmware update to obtain the storage path
            const firmwareUpdate = await getDocument(firmwareUpdateId);
            if (firmwareUpdate) {
                // Delete from Storage if file URL exists
                if (firmwareUpdate.file) {
                    try {
                        await deleteFile(firmwareUpdate.file);
                    } catch (storageErr) {
                        if (kDebugMode) {
                            console.warn("[useFirmwareUpdates] Error deleting storage file:", storageErr);
                        }
                    }
                }

                // Delete Firestore document
                await deleteDocument(firmwareUpdateId);
            }
        } catch (err) {
            if (kDebugMode) {
                console.error("[useFirmwareUpdates] Error deleting firmware update:", err);
            }
            throw err;
        }
    };

    // Search firmware updates using Algolia
    const searchFirmwareUpdates = async (query: string): Promise<void> => {
        try {
            await search(query, FIRMWARE_UPDATES_INDEX, {
                attributesToRetrieve: ["objectID", "file", "debianRevision", "upstreamVersion", "uploadedBy", "createdAt"],
                hitsPerPage: 20,
            });
        } catch (err) {
            if (kDebugMode) {
                console.error("[useFirmwareUpdates] Error searching firmware updates:", err);
            }
            throw err;
        }
    };

    return {
        firmwareUpdates: docs,
        loading: loading,
        error,
        count,
        countLoading,
        totalPages,
        currentPage,
        hasNextPage,
        hasPreviousPage,
        getFirmwareUpdate,
        uploadFirmwareUpdate,
        updateFirmwareUpdate,
        deleteFirmwareUpdate,
        // Algolia search functionality
        searchResults,
        searchLoading,
        searchError,
        searchTotalHits,
        searchFirmwareUpdates,
        clearSearch,
    };
};

export default useFirmwareUpdates;