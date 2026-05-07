import { DocumentReference } from "firebase/firestore";
import { kDebugMode } from "@/config";
// Import Algolia search hook
import useAlgoliaSearch from "@/hooks/use-algolia-search";
// Import Firebase storage hook
import useFirebaseStorage from "@/hooks/use-firebase-storage";
// Import the generic hook
import useFirestoreCollection, { FirestoreQueryConstraints } from "@/hooks/use-firestore-collection";
// Import the Content type
import type { Content, UseContent } from "@/types/content";
import { useAuth } from "./use-auth";

// Define the specific collection path
const CONTENTS_COLLECTION = "contents";
// Define the Algolia index name (adjust as needed based on your Firebase extension config)
const CONTENTS_INDEX = "contents";

interface UseContentOptions extends FirestoreQueryConstraints {
    // Add any content-specific options here if needed
}

/**
 * Custom Hook specifically for managing CRUD operations for the 'contents'
 * Firestore collection with real-time updates, pagination, search, and file upload support.
 *
 * This hook uses useFirestoreCollection, useAlgoliaSearch, and useFirebaseStorage.
 *
 * @param options - Query options including pagination parameters
 * @returns {UseContent} An object containing content state and functions.
 */
const useContent = (options?: UseContentOptions): UseContent => {
    const { user } = useAuth();

    // Call the generic hook with the specific type (Content) and collection path
    const { docs, loading, error, count, countLoading, totalPages, currentPage, hasNextPage, hasPreviousPage, getDocument, addDocument, deleteDocument } =
        useFirestoreCollection<Content>(CONTENTS_COLLECTION, {
            orderByField: "createdAt",
            orderByDirection: "desc",
            getCount: true,
            ...options,
        });

    // Initialize Algolia search hook
    const { searchResults, loading: searchLoading, error: searchError, totalHits: searchTotalHits, search, clearSearch } = useAlgoliaSearch<Content>();

    // Initialize Firebase storage hook for file uploads
    const { uploadFile, deleteFile } = useFirebaseStorage();

    const getContent = async (contentId: string): Promise<Content | null> => {
        try {
            const doc = await getDocument(contentId);
            return doc as Content | null;
        } catch (err) {
            if (kDebugMode) {
                console.error("[useContent] Error getting content:", err);
            }
            throw err;
        }
    };

    // Upload content file and create Firestore document
    const uploadContent = async (file: File, onProgress: (progress: number) => void): Promise<DocumentReference<Content>> => {
        try {
            // Upload file to Firebase Storage with progress tracking
            const { uploadPromise } = uploadFile(file, "contents", onProgress);

            // Upload completed successfully
            const downloadURL = await uploadPromise;

            if (!downloadURL) {
                throw new Error("Upload failed - no download URL returned");
            }

            // Create Firestore document with file metadata
            return await addDocument({
                name: file.name,
                url: downloadURL,
                type: file.type,
                size: file.size,
                uploadedBy: user?.id || "unknown",
            } as Content);
        } catch (err) {
            if (kDebugMode) {
                console.error("[useContent] Error uploading content:", err);
            }
            throw err;
        }
    };

    // Delete a content file (both Firestore document and Storage file)
    const deleteContent = async (contentId: string): Promise<void> => {
        try {
            // First get the content to obtain the storage path
            const content = await getDocument(contentId);
            if (content) {
                // Delete from Storage if URL exists
                if (content.url) {
                    // Extract path from URL or use stored path
                    // This is a simplified approach - you might need to adjust based on your storage structure
                    try {
                        // Note: You might need to implement deleteFile in useFirebaseStorage hook
                        // or handle storage deletion here based on your setup
                        await deleteFile(content.url);
                    } catch (storageErr) {
                        if (kDebugMode) {
                            console.warn("[useContent] Error deleting storage file:", storageErr);
                        }
                    }
                }

                // Delete Firestore document
                await deleteDocument(contentId);
            }
        } catch (err) {
            if (kDebugMode) {
                console.error("[useContent] Error deleting content:", err);
            }
            throw err;
        }
    };

    // Search contents using Algolia
    const searchContents = async (query: string): Promise<void> => {
        try {
            await search(query, CONTENTS_INDEX, {
                attributesToRetrieve: ["objectID", "name", "type", "size", "uploadedBy", "createdAt"],
                hitsPerPage: 20,
            });
        } catch (err) {
            if (kDebugMode) {
                console.error("[useContent] Error searching contents:", err);
            }
            throw err;
        }
    };

    return {
        contents: docs,
        loading: loading,
        error,
        count,
        countLoading,
        totalPages,
        currentPage,
        hasNextPage,
        hasPreviousPage,
        getContent,
        uploadContent,
        deleteContent,
        // Algolia search functionality
        searchResults,
        searchLoading,
        searchError,
        searchTotalHits,
        searchContents,
        clearSearch,
    };
};

export default useContent;
