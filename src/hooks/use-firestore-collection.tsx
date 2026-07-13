// src/hooks/useFirestoreCollection.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    CollectionReference,
    DocumentReference,
    FirestoreError,
    GeoPoint,
    // Import serverTimestamp
    QueryConstraint,
    QueryDocumentSnapshot,
    QuerySnapshot,
    Timestamp,
    collection,
    doc,
    limit as firestoreLimit,
    getCountFromServer,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
} from "firebase/firestore";
import type { DocumentData, UpdateData } from "firebase/firestore";
// Assuming FIRESTORE is your initialized Firestore instance (db)
import { FIREBASE_SERVICES_AVAILABLE, FIRESTORE, kDebugMode } from "@/config";

// Adjust path if needed

// --- Interfaces --- (Keep existing interfaces: FirestoreQueryConstraints, UseFirestoreCollectionReturn)
export interface FirestoreQueryConstraints {
    limit?: number;
    orderByField?: string;
    orderByDirection?: "asc" | "desc";
    page?: number;
    getCount?: boolean;
    whereConstraints?: QueryConstraint[];
}

interface UseFirestoreCollectionReturn<T> {
    docs: (T & { id: string })[]; // Includes 'id' added client-side after fetch
    loading: boolean;
    error: FirestoreError | null;
    count: number | null;
    countLoading: boolean;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    getDocument: (docId: string) => Promise<T | null>;
    addDocument: (data: T) => Promise<DocumentReference<T>>;
    updateDocument: (docId: string, data: Partial<T>) => Promise<void>;
    deleteDocument: (docId: string) => Promise<void>;
}

// --- Helper Function for Timestamp Conversion ---
const convertTimestampsToDates = (data: any): any => {
    if (!data) return data;
    if (data instanceof Timestamp) return data.toDate();
    if (Array.isArray(data)) return data.map(convertTimestampsToDates);
    if (typeof data === "object" && data !== null) {
        const newObj: { [key: string]: any } = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                newObj[key] = convertTimestampsToDates(data[key]);
            }
        }
        return newObj;
    }
    return data;
};

const createFirestoreUnavailableError = (collectionPath: string): FirestoreError => {
    return Object.assign(new Error(`Firestore is no longer initialized. Migrate "${collectionPath}" to the Node.js API before using this data screen.`), {
        code: "unavailable" as FirestoreError["code"],
        name: "FirestoreUnavailableError",
    }) as FirestoreError;
};

// --- Helper Function to Remove Undefined Values ---
const removeUndefinedFields = (obj: any): any => {
    if (!obj || typeof obj !== "object") return obj;

    // Don't traverse through native Firestore types
    if (obj instanceof GeoPoint || obj instanceof Timestamp || obj instanceof DocumentReference) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(removeUndefinedFields).filter((item) => item !== undefined);
    }

    // Only traverse through plain JavaScript objects (Map-like objects)
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
            cleaned[key] = typeof value === "object" && value !== null ? removeUndefinedFields(value) : value;
        }
    }
    return cleaned;
};

// --- The Custom Hook ---
const useFirestoreCollection = <
    // Ensure T can accommodate the fields we add, or handle potential type mismatches
    // T extends DocumentData & Partial<{ createdAt: any; updatedAt: any; id: string }>
    T extends DocumentData,
>(
    collectionPath: string,
    queryOptions?: FirestoreQueryConstraints,
): UseFirestoreCollectionReturn<T> => {
    const [docs, setDocs] = useState<(T & { id: string })[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<FirestoreError | null>(null);
    const [count, setCount] = useState<number | null>(null);
    const [countLoading, setCountLoading] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(queryOptions?.page || 1);
    const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

    const colRef = useMemo(() => {
        if (!FIREBASE_SERVICES_AVAILABLE) {
            return null;
        }

        return collection(FIRESTORE, collectionPath) as CollectionReference<T>;
    }, [collectionPath]);

    // --- Count Function ---
    const getDocumentCount = useCallback(async () => {
        if (!queryOptions?.getCount) return;
        if (!colRef) {
            setCount(null);
            setCountLoading(false);
            return;
        }

        setCountLoading(true);
        try {
            const constraints: QueryConstraint[] = [];
            if (queryOptions?.whereConstraints) {
                constraints.push(...queryOptions.whereConstraints);
            }
            if (queryOptions?.orderByField) {
                constraints.push(orderBy(queryOptions.orderByField, queryOptions.orderByDirection ?? "asc"));
            }
            // Note: We don't include limit or startAfter for count queries as we want the total count

            const countQuery = constraints.length > 0 ? query(colRef, ...constraints) : colRef;
            const snapshot = await getCountFromServer(countQuery);
            setCount(snapshot.data().count);
        } catch (err) {
            if (kDebugMode) {
                console.error(`[useFirestoreCollection] Error fetching count for [${collectionPath}]:`, err);
            }
            setError(err as FirestoreError);
            setCount(null);
        } finally {
            setCountLoading(false);
        }
    }, [colRef, collectionPath, queryOptions?.getCount, queryOptions?.orderByField, queryOptions?.orderByDirection, queryOptions?.whereConstraints]);

    // --- Real-time Listener Effect with Page-based Pagination ---
    useEffect(() => {
        setLoading(true);
        setError(null);
        setIsInitialLoad(true); // Reset initial load flag on new queries

        if (!colRef) {
            const unavailableError = createFirestoreUnavailableError(collectionPath);
            if (kDebugMode) {
                console.warn(`[useFirestoreCollection] ${unavailableError.message}`);
            }
            setDocs([]);
            setCount(null);
            setError(unavailableError);
            setLoading(false);
            return;
        }

        const page = queryOptions?.page || 1;
        const pageSize = queryOptions?.limit || 5;

        // For page-based pagination, we need to get all documents up to the current page
        const totalDocsNeeded = page * pageSize;

        const constraints: QueryConstraint[] = [];
        if (queryOptions?.whereConstraints) {
            constraints.push(...queryOptions.whereConstraints);
        }
        if (queryOptions?.orderByField) {
            constraints.push(orderBy(queryOptions.orderByField, queryOptions.orderByDirection ?? "asc"));
        }
        constraints.push(firestoreLimit(totalDocsNeeded));

        const q = query(colRef, ...constraints);

        const unsubscribe = onSnapshot(
            q,
            (snapshot: QuerySnapshot<T>) => {
                if (snapshot.empty) {
                    setDocs([]);
                    setLoading(false);
                    return;
                }

                // Removed problematic real-time count logic that interfered with pagination

                // Mark initial load as complete
                if (isInitialLoad) {
                    setIsInitialLoad(false);
                }

                // Get all documents
                const allDocs = snapshot.docs.map((doc: QueryDocumentSnapshot<T>) => {
                    const data = doc.data();
                    return {
                        ...data,
                        id: doc.id,
                    };
                });

                // Calculate the start index for current page (0-indexed)
                const startIndex = (page - 1) * pageSize;

                // Get only the documents for the current page
                const pageDocs = allDocs.slice(startIndex, startIndex + pageSize);

                setDocs(pageDocs);
                setCurrentPage(page);
                setLoading(false);
            },
            (err: FirestoreError) => {
                if (kDebugMode) {
                    console.error(`[useFirestoreCollection] Firestore listener error on [${collectionPath}]:`, err);
                }
                setError(err);
                setLoading(false);
            },
        );

        return () => {
            unsubscribe();
        };
    }, [
        colRef,
        collectionPath,
        queryOptions?.limit,
        queryOptions?.orderByField,
        queryOptions?.orderByDirection,
        queryOptions?.page,
        queryOptions?.whereConstraints,
    ]);

    // --- Count Effect ---
    useEffect(() => {
        if (queryOptions?.getCount) {
            getDocumentCount();
        }
    }, [getDocumentCount, queryOptions?.getCount]);

    // --- CRUD Operations (Modified) ---

    // Get
    const getDocument = useCallback(
        async (docId: string): Promise<T> => {
            if (!colRef) {
                throw createFirestoreUnavailableError(collectionPath);
            }

            try {
                const docRef = doc(colRef, docId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    return { ...(docSnap.data() as T), id: docSnap.id };
                } else {
                    throw new Error(`Document with ID ${docId} not found`);
                }
            } catch (error) {
                console.error(`[useFirestoreCollection] Error fetching document with ID ${docId}:`, error);
                throw error;
            }
        },
        [colRef, collectionPath],
    );

    // Create
    const addDocument = useCallback(
        async (data: T): Promise<DocumentReference<T>> => {
            if (!colRef) {
                throw createFirestoreUnavailableError(collectionPath);
            }

            setLoading(true);
            try {
                return await runTransaction(FIRESTORE, async (transaction) => {
                    // Remove undefined fields from input data
                    const cleanedData = removeUndefinedFields(data);

                    // Prepare data with automatic fields
                    const dataToAdd = {
                        ...cleanedData,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                    };

                    // Create document reference first
                    const docRef = doc(colRef) as DocumentReference<T>;

                    // Set the document with the ID included
                    transaction.set(docRef, {
                        ...dataToAdd,
                        id: docRef.id,
                    } as any);

                    return docRef;
                });
            } catch (err) {
                if (kDebugMode) {
                    console.error("[useFirestoreCollection] Error adding document:", err);
                }
                setError(err as FirestoreError);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [colRef, collectionPath], // Dependency: colRef
    );

    // Update
    const updateDocument = useCallback(
        async (docId: string, data: Partial<T>): Promise<void> => {
            if (!colRef) {
                throw createFirestoreUnavailableError(collectionPath);
            }

            setLoading(true);
            try {
                await runTransaction(FIRESTORE, async (transaction) => {
                    const docRef = doc(FIRESTORE, collectionPath, docId) as DocumentReference<T, T>;

                    // Remove undefined fields from input data
                    const cleanedData = removeUndefinedFields(data);

                    // Prepare update data with automatic 'updatedAt' field
                    const dataToUpdate: UpdateData<T> = {
                        ...(cleanedData as UpdateData<T>),
                        updatedAt: serverTimestamp(),
                    };

                    // Perform the transactional update
                    transaction.update(docRef, dataToUpdate);
                });
            } catch (err) {
                if (kDebugMode) {
                    console.error("[useFirestoreCollection] Error updating document:", err);
                }
                setError(err as FirestoreError);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [colRef, collectionPath], // Dependency: collectionPath
    );

    // Delete
    const deleteDocument = useCallback(
        async (docId: string): Promise<void> => {
            if (!colRef) {
                throw createFirestoreUnavailableError(collectionPath);
            }

            setLoading(true);
            try {
                await runTransaction(FIRESTORE, async (transaction) => {
                    const docRef = doc(FIRESTORE, collectionPath, docId);

                    // Perform the transactional delete
                    transaction.delete(docRef);
                });
            } catch (err) {
                if (kDebugMode) {
                    console.error("[useFirestoreCollection] Error deleting document:", err);
                }
                setError(err as FirestoreError);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [collectionPath],
    );

    // --- Calculate Pagination Helper Values ---
    const pageSize = queryOptions?.limit || 10;
    const totalPages = count !== null ? Math.ceil(count / pageSize) : 0;
    const hasNextPage = currentPage < totalPages;
    const hasPreviousPage = currentPage > 1;

    // Return hook state and functions
    return {
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
    };
};

export default useFirestoreCollection;
