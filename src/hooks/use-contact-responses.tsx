import { kDebugMode } from "@/config";
// Import Algolia search hook
import useAlgoliaSearch from "@/hooks/use-algolia-search";
// Import the generic hook
import useFirestoreCollection, { FirestoreQueryConstraints } from "@/hooks/use-firestore-collection";
// Import the Contact Responses type
import type { ContactResponses, UseContactResponses } from "@/types/contact-responses";

// Define the specific collection path
const CONTACT_COLLECTION = "contact_us";
// Define the Algolia index name (adjust as needed based on your Firebase extension config)
const CONTACT_INDEX = "contact_us";

interface UseContactResponsesOptions extends FirestoreQueryConstraints {
    // Add any machine-specific options here if needed
}

/**
 * Custom Hook specifically for managing CRUD operations for the 'contact_us'
 * Firestore collection with real-time updates and pagination support.
 *
 * This hook uses useFirestoreCollection.
 *
 * @param options - Query options including pagination parameters
 * @returns {UseContactResponses} An object containing contact response state and functions.
 */
const useContactResponses = (options?: UseContactResponsesOptions): UseContactResponses => {
    // Call the generic hook with the specific type (Machine) and collection path
    const { docs, loading, error, count, countLoading, totalPages, currentPage, hasNextPage, hasPreviousPage, updateDocument, deleteDocument } =
        useFirestoreCollection<ContactResponses>(CONTACT_COLLECTION, {
            orderByField: "createdAt",
            orderByDirection: "desc",
            getCount: true,
            ...options,
        });

    // Initialize Algolia search hook
    const { searchResults, loading: searchLoading, error: searchError, totalHits: searchTotalHits, search, clearSearch } = useAlgoliaSearch<ContactResponses>();

    // Update an existing contact response
    const updateContactResponse = async (
        contactResponseId: string,
        contactResponse: Omit<Partial<ContactResponses>, "id" | "createdAt" | "updatedAt">,
    ): Promise<void> => {
        try {
            await updateDocument(contactResponseId, { ...contactResponse });
        } catch (err) {
            if (kDebugMode) {
                console.error("[useContactResponses] Error updating contact responses:", err);
            }
            throw err;
        }
    };

    // Delete a contact response
    const deleteContactResponse = async (docId: string): Promise<void> => {
        try {
            await deleteDocument(docId);
        } catch (err) {
            console.error("[useContactResponses] Error deleting contact responses:", err);
            throw err;
        }
    };

    // Search contact_us using Algolia
    const searchContactResponses = async (query: string): Promise<void> => {
        try {
            await search(query, CONTACT_INDEX, {
                hitsPerPage: 20,
            });
        } catch (err) {
            if (kDebugMode) {
                console.error("[useContactResponses] Error searching contact responses:", err);
            }
            throw err;
        }
    };

    return {
        responses: docs,
        loading: loading,
        error,
        count,
        countLoading,
        totalPages,
        currentPage,
        hasNextPage,
        hasPreviousPage,
        updateContactResponse,
        deleteContactResponse,
        // Algolia search functionality
        searchResults,
        searchLoading,
        searchError,
        searchTotalHits,
        searchContactResponses,
        clearSearch,
    };
};

export default useContactResponses;
