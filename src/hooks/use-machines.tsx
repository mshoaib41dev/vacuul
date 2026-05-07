import { DocumentReference } from "firebase/firestore";
import { kDebugMode } from "@/config";
// Import Algolia search hook
import useAlgoliaSearch from "@/hooks/use-algolia-search";
// Import the generic hook
import useFirestoreCollection, { FirestoreQueryConstraints } from "@/hooks/use-firestore-collection";
// Import the Machine type
import type { Machine, UseMachine } from "@/types/machine";

// Define the specific collection path
const MACHINES_COLLECTION = "machines";
// Define the Algolia index name (adjust as needed based on your Firebase extension config)
const MACHINES_INDEX = "machines";

interface UseMachineOptions extends FirestoreQueryConstraints {
    // Add any machine-specific options here if needed
}

/**
 * Custom Hook specifically for managing CRUD operations for the 'machines'
 * Firestore collection with real-time updates and pagination support.
 *
 * This hook uses useFirestoreCollection.
 *
 * @param options - Query options including pagination parameters
 * @returns {UseMachine} An object containing machine state and functions.
 */
const useMachine = (options?: UseMachineOptions): UseMachine => {
    // Call the generic hook with the specific type (Machine) and collection path
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
    } = useFirestoreCollection<Machine>(MACHINES_COLLECTION, {
        orderByField: "createdAt",
        orderByDirection: "desc",
        getCount: true,
        ...options,
    });

    // Initialize Algolia search hook
    const { searchResults, loading: searchLoading, error: searchError, totalHits: searchTotalHits, search, clearSearch } = useAlgoliaSearch<Machine>();

    const getMachine = async (machineId: string): Promise<Machine | null> => {
        try {
            const doc = await getDocument(machineId);
            return doc as Machine | null;
        } catch (err) {
            if (kDebugMode) {
                console.error("[useMachine] Error getting machine:", err);
            }
            throw err;
        }
    };

    // Add a new machine
    const registerMachine = async (
        machine: Omit<Machine, "id" | "timezone" | "wifiCountry" | "languageCode" | "createdAt" | "updatedAt" | "lastOnline" | "volume" | "brightness">,
    ): Promise<DocumentReference<Machine>> => {
        try {
            return await addDocument({
                ...machine,
            } as Machine);
        } catch (err) {
            if (kDebugMode) {
                console.error("[useMachine] Error registering machine:", err);
            }
            throw err;
        }
    };

    // Update an existing machine
    const updateMachine = async (machineId: string, machine: Omit<Partial<Machine>, "id" | "createdAt" | "updatedAt" | "lastOnline">): Promise<void> => {
        try {
            await updateDocument(machineId, { ...machine });
        } catch (err) {
            if (kDebugMode) {
                console.error("[useMachine] Error updating machine:", err);
            }
            throw err;
        }
    };

    // Delete a machine
    const deleteMachine = async (docId: string): Promise<void> => {
        try {
            await deleteDocument(docId);
        } catch (err) {
            console.error("[useMachine] Error deleting machine:", err);
            throw err;
        }
    };

    // Search machines using Algolia
    const searchMachines = async (query: string): Promise<void> => {
        try {
            await search(query, MACHINES_INDEX, {
                attributesToRetrieve: ["objectID", "commissionId", "name", "address", "status"],
                hitsPerPage: 20,
            });
        } catch (err) {
            if (kDebugMode) {
                console.error("[useMachine] Error searching machines:", err);
            }
            throw err;
        }
    };

    return {
        machines: docs,
        loading: loading,
        error,
        count,
        countLoading,
        totalPages,
        currentPage,
        hasNextPage,
        hasPreviousPage,
        getMachine,
        registerMachine,
        updateMachine,
        deleteMachine,
        // Algolia search functionality
        searchResults,
        searchLoading,
        searchError,
        searchTotalHits,
        searchMachines,
        clearSearch,
    };
};

export default useMachine;
