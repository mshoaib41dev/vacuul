import { useMemo, useCallback, useState } from "react";
import { where, collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { getLocalTimeZone } from "@internationalized/date";
import { kDebugMode, FIRESTORE, USE_FIREBASE_EMULATORS } from "@/config";
import useAlgoliaSearch from "@/hooks/use-algolia-search";
import useFirestoreCollection, { FirestoreQueryConstraints } from "@/hooks/use-firestore-collection";
import useMachine from "@/hooks/use-machines";
import useUsers from "@/hooks/use-users";
import { timestampToDate } from "@/utils/timestamp";
import type { 
    Booking, 
    BookingFilters, 
    BookingWithDetails, 
    UseBookings, 
    TreatmentData, 
    SessionSummary 
} from "@/types/booking";

// Define the specific collection path
const BOOKINGS_COLLECTION = "appointments"; // Using "appointments" to match our Firebase functions
// Define the Algolia index name
const BOOKINGS_INDEX = "appointments";

interface UseBookingsOptions extends FirestoreQueryConstraints {
    filters?: BookingFilters;
}

type SearchableBooking = Booking & { objectID?: string };

const getBookingId = (booking: SearchableBooking): string => booking.id || booking.objectID || "";

const normalizeSearchValue = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return String(value).toLowerCase();
    }
    return "";
};

const bookingMatchesQuery = (booking: SearchableBooking, query: string): boolean => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return false;

    const searchableValues = [
        getBookingId(booking),
        booking.machineId,
        booking.machineName,
        booking.userId,
        booking.status,
        booking.sessionStatus,
        booking.location?.address,
    ];

    return searchableValues.some((value) => normalizeSearchValue(value).includes(normalizedQuery));
};

/**
 * Custom Hook for managing booking/appointment CRUD operations
 * with real-time updates, pagination, search, and enhanced booking details.
 *
 * @param options - Query options including pagination parameters and filters
 * @returns {UseBookings} An object containing booking state and functions.
 */
const useBookings = (options?: UseBookingsOptions): UseBookings => {
    // Build where constraints based on filters
    const whereConstraints = useMemo(() => {
        const constraints = [];

        if (options?.filters?.status && options.filters.status !== "all") {
            constraints.push(where("status", "==", options.filters.status));
        }

        if (options?.filters?.machineId && options.filters.machineId !== "all") {
            constraints.push(where("machineId", "==", options.filters.machineId));
        }

        if (options?.filters?.userId) {
            constraints.push(where("userId", "==", options.filters.userId));
        }

        if (options?.filters?.dateRange?.start) {
            const startDate = options.filters.dateRange.start.toDate(getLocalTimeZone());
            constraints.push(where("startTime", ">=", Timestamp.fromDate(startDate)));
        }

        if (options?.filters?.dateRange?.end) {
            const endDate = options.filters.dateRange.end.toDate(getLocalTimeZone());
            endDate.setHours(23, 59, 59, 999); // Include the entire end day
            constraints.push(where("startTime", "<=", Timestamp.fromDate(endDate)));
        }

        if (options?.filters?.sessionStatus && options.filters.sessionStatus !== "all") {
            constraints.push(where("sessionStatus", "==", options.filters.sessionStatus));
        }

        return constraints;
    }, [options?.filters?.status, options?.filters?.machineId, options?.filters?.userId, options?.filters?.dateRange, options?.filters?.sessionStatus]);

    // Call the generic hook with the specific type (Booking) and collection path
    const { docs, loading, error, count, countLoading, totalPages, currentPage, hasNextPage, hasPreviousPage, getDocument } = useFirestoreCollection<Booking>(
        BOOKINGS_COLLECTION,
        {
            orderByField: "startTime",
            orderByDirection: "desc", // Show newest bookings first
            getCount: true,
            whereConstraints,
            ...options,
        },
    );

    // Get machines and users data for enhanced booking details
    const { machines } = useMachine({ limit: 1000 }); // Load all machines for lookup
    const { users } = useUsers({ limit: 1000 }); // Load all users for lookup

    // Initialize Algolia search hook
    const { searchResults, loading: searchLoading, error: searchError, totalHits: searchTotalHits, search, clearSearch } = useAlgoliaSearch<Booking>();
    const [localSearchResults, setLocalSearchResults] = useState<Booking[]>([]);
    const [localSearchLoading, setLocalSearchLoading] = useState(false);
    const [localSearchError, setLocalSearchError] = useState<string | null>(null);

    // Enhance bookings with additional details
    const enhancedBookings = useMemo((): BookingWithDetails[] => {
        const now = new Date();

        return docs.map((booking) => {
            // Find related machine and user data
            const machine = machines.find((m) => m.id === booking.machineId);
            const user = users.find((u) => u.id === booking.userId);

            // Search providers can serialize Firestore timestamps differently.
            const startTime = timestampToDate(booking.startTime);
            const endTime = timestampToDate(booking.endTime);

            // Calculate duration in minutes
            const duration = startTime && endTime ? Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)) : 0;

            // Determine time classification
            const isPast = endTime ? endTime < now : false;
            const isCurrent = Boolean(startTime && endTime && startTime <= now && endTime >= now);
            const isFuture = startTime ? startTime > now : false;

            return {
                ...booking,
                machineCommissionId: machine?.commissionId,
                userName: user?.displayName,
                userEmail: user?.email,
                duration,
                isPast,
                isCurrent,
                isFuture,
            };
        });
    }, [docs, machines, users]);

    // Filter enhanced bookings based on time filter

    // Enhance search results with additional details
    const enhancedSearchResults = useMemo((): BookingWithDetails[] => {
        const now = new Date();

        const rawSearchResults = USE_FIREBASE_EMULATORS ? localSearchResults : searchResults;

        return rawSearchResults.map((booking) => {
            const machine = machines.find((m) => m.id === booking.machineId);
            const user = users.find((u) => u.id === booking.userId);
            const bookingId = getBookingId(booking);

            const startTime = timestampToDate(booking.startTime);
            const endTime = timestampToDate(booking.endTime);
            const duration = startTime && endTime ? Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)) : 0;

            const isPast = endTime ? endTime < now : false;
            const isCurrent = Boolean(startTime && endTime && startTime <= now && endTime >= now);
            const isFuture = startTime ? startTime > now : false;

            return {
                ...booking,
                id: bookingId,
                machineCommissionId: machine?.commissionId,
                userName: user?.displayName,
                userEmail: user?.email,
                duration,
                isPast,
                isCurrent,
                isFuture,
            };
        });
    }, [localSearchResults, searchResults, machines, users]);

    const getBooking = async (bookingId: string): Promise<Booking | null> => {
        try {
            const doc = await getDocument(bookingId);
            return doc as Booking | null;
        } catch (err) {
            if (kDebugMode) {
                console.error("[useBookings] Error getting booking:", err);
            }
            throw err;
        }
    };

    const getTreatmentData = useCallback(async (bookingId: string): Promise<TreatmentData[]> => {
        try {
            const treatmentDataRef = collection(FIRESTORE, BOOKINGS_COLLECTION, bookingId, "treatmentData");
            const q = query(treatmentDataRef, orderBy("createdAt", "asc"));
            const snapshot = await getDocs(q);
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as TreatmentData));
        } catch (err) {
            if (kDebugMode) {
                console.error("[useBookings] Error getting treatment data:", err);
            }
            return [];
        }
    }, []);

    const getSessionSummary = useCallback(async (bookingId: string): Promise<SessionSummary | null> => {
        try {
            const sessionSummaryRef = collection(FIRESTORE, BOOKINGS_COLLECTION, bookingId, "sessionSummary");
            const snapshot = await getDocs(sessionSummaryRef);
            
            if (snapshot.empty) return null;

            const firstDoc = snapshot.docs[0];
            return {
                id: firstDoc.id,
                ...firstDoc.data()
            } as SessionSummary;
        } catch (err) {
            if (kDebugMode) {
                console.error("[useBookings] Error getting session summary:", err);
            }
            return null;
        }
    }, []);

    const getBookingWithDetails = useCallback(async (bookingId: string): Promise<BookingWithDetails | null> => {
        try {
            const booking = await getBooking(bookingId);
            if (!booking) return null;

            // Get treatment data and session summary
            const [treatmentData, sessionSummary] = await Promise.all([
                getTreatmentData(bookingId),
                getSessionSummary(bookingId)
            ]);

            // Get machine and user details
            const machine = machines.find((m) => m.id === booking.machineId);
            const user = users.find((u) => u.id === booking.userId);

            const startTime = timestampToDate(booking.startTime);
            const endTime = timestampToDate(booking.endTime);
            const duration = startTime && endTime ? Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)) : 0;
            const now = new Date();

            return {
                ...booking,
                machineCommissionId: machine?.commissionId,
                userName: user?.displayName,
                userEmail: user?.email,
                duration,
                isPast: endTime ? endTime < now : false,
                isCurrent: Boolean(startTime && endTime && startTime <= now && endTime >= now),
                isFuture: startTime ? startTime > now : false,
                treatmentData: treatmentData.length > 0 ? treatmentData : undefined,
                sessionSummary: sessionSummary || undefined,
            };
        } catch (err) {
            if (kDebugMode) {
                console.error("[useBookings] Error getting booking with details:", err);
            }
            throw err;
        }
    }, [getBooking, getTreatmentData, getSessionSummary, machines, users]);

    // Cancel a booking using Firebase Cloud Function
    const cancelBooking = async (bookingId: string): Promise<void> => {
        console.log(bookingId);
        // try {
        //     const cancelBookingFunction = httpsCallable(FUNCTIONS, "cancelBooking");
        //     const result = await cancelBookingFunction({ bookingId });
        //     if (!result.data.success) {
        //         throw new Error(result.data.message || "Failed to cancel booking");
        //     }
        // } catch (err) {
        //     if (kDebugMode) {
        //         console.error("[useBookings] Error cancelling booking:", err);
        //     }
        //     throw err;
        // }
    };

    // Search bookings using Algolia
    const searchBookings = async (query: string): Promise<void> => {
        try {
            if (USE_FIREBASE_EMULATORS) {
                const normalizedQuery = query.trim();
                setLocalSearchError(null);

                if (!normalizedQuery) {
                    setLocalSearchResults([]);
                    setLocalSearchLoading(false);
                    return;
                }

                setLocalSearchLoading(true);
                const snapshot = await getDocs(collection(FIRESTORE, BOOKINGS_COLLECTION));
                const results = snapshot.docs
                    .map((doc) => ({ ...(doc.data() as Booking), id: doc.id }))
                    .filter((booking) => bookingMatchesQuery(booking, normalizedQuery))
                    .slice(0, 20);

                setLocalSearchResults(results);
                return;
            }

            await search(query, BOOKINGS_INDEX, {
                attributesToRetrieve: ["objectID", "machineId", "userId", "startTime", "endTime", "status", "createdAt"],
                hitsPerPage: 20,
            });
        } catch (err) {
            if (kDebugMode) {
                console.error("[useBookings] Error searching bookings:", err);
            }
            if (USE_FIREBASE_EMULATORS) {
                setLocalSearchError(err instanceof Error ? err.message : "Search failed");
                setLocalSearchResults([]);
            }
            throw err;
        } finally {
            if (USE_FIREBASE_EMULATORS) {
                setLocalSearchLoading(false);
            }
        }
    };

    const clearBookingSearch = useCallback(() => {
        setLocalSearchResults([]);
        setLocalSearchError(null);
        setLocalSearchLoading(false);
        clearSearch();
    }, [clearSearch]);

    return {
        bookings: enhancedBookings,
        loading: loading,
        error,
        count,
        countLoading,
        totalPages,
        currentPage,
        hasNextPage,
        hasPreviousPage,
        getBooking,
        getBookingWithDetails,
        getTreatmentData,
        getSessionSummary,
        cancelBooking,
        // Algolia search functionality
        searchResults: enhancedSearchResults,
        searchLoading: USE_FIREBASE_EMULATORS ? localSearchLoading : searchLoading,
        searchError: USE_FIREBASE_EMULATORS ? localSearchError : searchError,
        searchTotalHits: USE_FIREBASE_EMULATORS ? localSearchResults.length : searchTotalHits,
        searchBookings,
        clearSearch: clearBookingSearch,
    };
};

export default useBookings;
