import { useMemo, useCallback } from "react";
import { where, collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { getLocalTimeZone } from "@internationalized/date";
import { kDebugMode, FIRESTORE } from "@/config";
import useAlgoliaSearch from "@/hooks/use-algolia-search";
import useFirestoreCollection, { FirestoreQueryConstraints } from "@/hooks/use-firestore-collection";
import useMachine from "@/hooks/use-machines";
import useUsers from "@/hooks/use-users";
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

    // Enhance bookings with additional details
    const enhancedBookings = useMemo((): BookingWithDetails[] => {
        const now = new Date();

        return docs.map((booking) => {
            // Find related machine and user data
            const machine = machines.find((m) => m.id === booking.machineId);
            const user = users.find((u) => u.id === booking.userId);

            // Convert Firestore timestamps to Date objects
            const startTime = booking.startTime.toDate();
            const endTime = booking.endTime.toDate();

            // Calculate duration in minutes
            const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

            // Determine time classification
            const isPast = endTime < now;
            const isCurrent = startTime <= now && endTime >= now;
            const isFuture = startTime > now;

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

        return searchResults.map((booking) => {
            const machine = machines.find((m) => m.id === booking.machineId);
            const user = users.find((u) => u.id === booking.userId);

            const startTime = booking.startTime.toDate();
            const endTime = booking.endTime.toDate();
            const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

            const isPast = endTime < now;
            const isCurrent = startTime <= now && endTime >= now;
            const isFuture = startTime > now;

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
    }, [searchResults, machines, users]);

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

            const startTime = booking.startTime.toDate();
            const endTime = booking.endTime.toDate();
            const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
            const now = new Date();

            return {
                ...booking,
                machineCommissionId: machine?.commissionId,
                userName: user?.displayName,
                userEmail: user?.email,
                duration,
                isPast: endTime < now,
                isCurrent: startTime <= now && endTime >= now,
                isFuture: startTime > now,
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
            await search(query, BOOKINGS_INDEX, {
                attributesToRetrieve: ["objectID", "machineId", "userId", "startTime", "endTime", "status", "createdAt"],
                hitsPerPage: 20,
            });
        } catch (err) {
            if (kDebugMode) {
                console.error("[useBookings] Error searching bookings:", err);
            }
            throw err;
        }
    };

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
        searchLoading,
        searchError,
        searchTotalHits,
        searchBookings,
        clearSearch,
    };
};

export default useBookings;
