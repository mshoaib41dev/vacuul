import { useCallback, useEffect, useMemo, useState } from "react";
import {
    FirestoreError,
    QueryConstraint,
    QueryDocumentSnapshot,
    QuerySnapshot,
    collection,
    limit as firestoreLimit,
    getCountFromServer,
    onSnapshot,
    orderBy,
    query,
    where,
} from "firebase/firestore";
import { FIRESTORE, kDebugMode } from "@/config";
// Import Algolia search hook
import useAlgoliaSearch from "@/hooks/use-algolia-search";
// Import the SystemLog type
import type { SystemLog, UseSystemLogs } from "@/types/system-logs";

// Define the specific collection path
const SYSTEM_LOGS_COLLECTION = "system_logs";
// Define the Algolia index name (adjust as needed based on your Firebase extension config)
const SYSTEM_LOGS_INDEX = "system_logs";

interface UseSystemLogsOptions {
    machineId?: string; // Filter logs by specific machine
    page?: number;
    limit?: number;
}

/**
 * Custom Hook specifically for managing system logs from the 'system_logs'
 * Firestore collection with real-time updates, pagination, and machine filtering.
 *
 * This hook creates custom queries for machine filtering since the generic hook doesn't support where conditions.
 *
 * @param options - Query options including pagination parameters and machine filtering
 * @returns {UseSystemLogs} An object containing system logs state and functions.
 */
const useSystemLogs = (options?: UseSystemLogsOptions): UseSystemLogs => {
    const { machineId, page = 1, limit = 10 } = options || {};

    const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<FirestoreError | null>(null);
    const [count, setCount] = useState<number | null>(null);
    const [countLoading, setCountLoading] = useState<boolean>(false);

    // Create collection reference
    const colRef = useMemo(() => collection(FIRESTORE, SYSTEM_LOGS_COLLECTION), []);

    // Get document count
    const getDocumentCount = useCallback(async () => {
        if (!machineId) {
            setCount(null);
            return;
        }

        setCountLoading(true);
        try {
            const constraints: QueryConstraint[] = [];
            constraints.push(where("machineId", "==", machineId));
            constraints.push(orderBy("error.timestamp", "desc"));

            const countQuery = query(colRef, ...constraints);
            const snapshot = await getCountFromServer(countQuery);
            setCount(snapshot.data().count);
        } catch (err) {
            if (kDebugMode) {
                console.error(`[useSystemLogs] Error fetching count:`, err);
            }
            setError(err as FirestoreError);
            setCount(null);
        } finally {
            setCountLoading(false);
        }
    }, [colRef, machineId]);

    // Real-time listener effect with machine filtering
    useEffect(() => {
        if (!machineId) {
            setSystemLogs([]);
            setLoading(false);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        const totalDocsNeeded = page * limit;
        const constraints: QueryConstraint[] = [];

        // Add machine filter
        constraints.push(where("machineId", "==", machineId));
        constraints.push(orderBy("error.timestamp", "desc"));
        constraints.push(firestoreLimit(totalDocsNeeded));

        const q = query(colRef, ...constraints);

        const unsubscribe = onSnapshot(
            q,
            (snapshot: QuerySnapshot) => {
                if (snapshot.empty) {
                    setSystemLogs([]);
                    setLoading(false);
                    return;
                }

                // Get all documents
                const allDocs = snapshot.docs.map((doc: QueryDocumentSnapshot) => {
                    const data = doc.data();
                    return {
                        ...data,
                        id: doc.id,
                    } as SystemLog;
                });

                // Calculate the start index for current page (0-indexed)
                const startIndex = (page - 1) * limit;

                // Get only the documents for the current page
                const pageDocs = allDocs.slice(startIndex, startIndex + limit);

                setSystemLogs(pageDocs);
                setLoading(false);
            },
            (err: FirestoreError) => {
                if (kDebugMode) {
                    console.error(`[useSystemLogs] Firestore listener error:`, err);
                }
                setError(err);
                setLoading(false);
            },
        );

        return () => {
            unsubscribe();
        };
    }, [colRef, machineId, page, limit]);

    // Count effect
    useEffect(() => {
        getDocumentCount();
    }, [getDocumentCount]);

    // Calculate pagination values
    const totalPages = count !== null ? Math.ceil(count / limit) : 0;
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Initialize Algolia search hook
    const { searchResults, loading: searchLoading, error: searchError, totalHits: searchTotalHits, search, clearSearch } = useAlgoliaSearch<SystemLog>();

    // Search system logs using Algolia with machine filtering
    const searchSystemLogs = async (query: string): Promise<void> => {
        try {
            const searchOptions: any = {
                hitsPerPage: 20,
            };

            // Add machine filter to search if specified
            if (machineId) {
                searchOptions.filters = `machineId:${machineId}`;
            }

            await search(query, SYSTEM_LOGS_INDEX, searchOptions);
        } catch (err) {
            if (kDebugMode) {
                console.error("[useSystemLogs] Error searching system logs:", err);
            }
            throw err;
        }
    };

    return {
        systemLogs,
        loading,
        error,
        count,
        countLoading,
        totalPages,
        currentPage: page,
        hasNextPage,
        hasPreviousPage,
        // Algolia search functionality
        searchResults,
        searchLoading,
        searchError,
        searchTotalHits,
        searchSystemLogs,
        clearSearch,
    };
};

export default useSystemLogs;
