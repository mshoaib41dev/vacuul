import { useCallback, useMemo, useRef, useState } from "react";
import { getLocalTimeZone } from "@internationalized/date";
import { useQuery } from "@tanstack/react-query";
import { type ApiBookingSessionStatus, type ListBookingsRequest, bookingsApi } from "@/api/bookings";
import useMachine from "@/hooks/use-machines";
import useUsers from "@/hooks/use-users";
import type { Booking, BookingFilters, BookingWithDetails, SessionSummary, TreatmentData, UseBookings } from "@/types/booking";
import { timestampToDate } from "@/utils/timestamp";

interface UseBookingsOptions {
    limit?: number;
    page?: number;
    filters?: BookingFilters;
}

type SearchableBooking = Booking & { objectID?: string };

const bookingsQueryKey = "bookings";

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
        booking.userName,
        booking.userEmail,
        booking.status,
        booking.sessionStatus,
        booking.location?.address,
    ];

    return searchableValues.some((value) => normalizeSearchValue(value).includes(normalizedQuery));
};

const toApiSessionStatus = (sessionStatus: BookingFilters["sessionStatus"]): ApiBookingSessionStatus | undefined => {
    if (!sessionStatus || sessionStatus === "all") return undefined;
    if (sessionStatus === "done" || sessionStatus === "started" || sessionStatus === "aborted") return sessionStatus;
    if (sessionStatus === "paused" || sessionStatus === "cancelled") return "aborted";
    if (sessionStatus === "running") return "started";
    return undefined;
};

const toIsoDateRange = (filters?: BookingFilters): Pick<ListBookingsRequest, "fromDate" | "toDate"> => {
    const dateRange = filters?.dateRange;
    const timeZone = getLocalTimeZone();
    const fromDate = dateRange?.start?.toDate(timeZone);
    const toDate = dateRange?.end?.toDate(timeZone);

    if (toDate) {
        toDate.setHours(23, 59, 59, 999);
    }

    return {
        fromDate: fromDate?.toISOString(),
        toDate: toDate?.toISOString(),
    };
};

const buildListRequest = (page: number, limit: number, filters?: BookingFilters): ListBookingsRequest => {
    const dateFilters = toIsoDateRange(filters);

    return {
        page,
        limit,
        machineId: filters?.machineId && filters.machineId !== "all" ? filters.machineId : undefined,
        userId: filters?.userId || undefined,
        status: filters?.status && filters.status !== "all" ? filters.status : undefined,
        sessionStatus: toApiSessionStatus(filters?.sessionStatus),
        ...dateFilters,
    };
};

const useBookings = (options?: UseBookingsOptions): UseBookings => {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const request = useMemo(() => buildListRequest(page, limit, options?.filters), [limit, options?.filters, page]);
    const searchRequest = useMemo(() => buildListRequest(1, 500, options?.filters), [options?.filters]);
    const searchRequestId = useRef(0);
    const [rawSearchResults, setRawSearchResults] = useState<Booking[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const bookingsQuery = useQuery({
        queryKey: [bookingsQueryKey, "list", request],
        queryFn: () => bookingsApi.listBookings(request),
    });

    const { machines } = useMachine({ limit: 1000 });
    const { users } = useUsers({ limit: 1000 });

    const enhanceBooking = useCallback(
        (booking: Booking): BookingWithDetails => {
            const now = new Date();
            const machine = machines.find((machine) => machine.id === booking.machineId);
            const user = users.find((user) => user.id === booking.userId);
            const startTime = timestampToDate(booking.startTime);
            const endTime = timestampToDate(booking.endTime);
            const duration = startTime && endTime ? Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)) : 0;

            return {
                ...booking,
                machineName: booking.machineName || machine?.name || booking.machineId,
                machineCommissionId: machine?.commissionId,
                userName: booking.userName || user?.displayName,
                userEmail: booking.userEmail || user?.email,
                duration,
                isPast: endTime ? endTime < now : false,
                isCurrent: Boolean(startTime && endTime && startTime <= now && endTime >= now),
                isFuture: startTime ? startTime > now : false,
                treatmentData: booking.treatmentData,
                sessionSummary: booking.sessionSummary,
            };
        },
        [machines, users],
    );

    const enhancedBookings = useMemo(() => {
        return (bookingsQuery.data?.bookings ?? []).map(enhanceBooking);
    }, [bookingsQuery.data?.bookings, enhanceBooking]);

    const enhancedSearchResults = useMemo(() => rawSearchResults.map(enhanceBooking), [enhanceBooking, rawSearchResults]);

    const getBooking = useCallback(async (bookingId: string): Promise<Booking | null> => {
        return bookingsApi.getBooking(bookingId);
    }, []);

    const getBookingWithDetails = useCallback(
        async (bookingId: string): Promise<BookingWithDetails | null> => {
            const booking = await bookingsApi.getBooking(bookingId);
            return booking ? enhanceBooking(booking) : null;
        },
        [enhanceBooking],
    );

    const getTreatmentData = useCallback(async (bookingId: string): Promise<TreatmentData[]> => {
        const booking = await bookingsApi.getBooking(bookingId);
        return booking?.treatmentData ?? [];
    }, []);

    const getSessionSummary = useCallback(async (bookingId: string): Promise<SessionSummary | null> => {
        const booking = await bookingsApi.getBooking(bookingId);
        return booking?.sessionSummary ?? null;
    }, []);

    const cancelBooking = async (_bookingId: string): Promise<void> => {};

    const searchBookings = useCallback(
        async (query: string): Promise<void> => {
            const requestId = searchRequestId.current + 1;
            searchRequestId.current = requestId;
            const normalizedQuery = query.trim();
            setSearchError(null);

            if (!normalizedQuery) {
                if (requestId === searchRequestId.current) {
                    setRawSearchResults([]);
                    setSearchLoading(false);
                }
                return;
            }

            try {
                setSearchLoading(true);
                const response = await bookingsApi.listBookings(searchRequest);

                if (requestId !== searchRequestId.current) {
                    return;
                }

                setRawSearchResults(response.bookings.filter((booking) => bookingMatchesQuery(booking, normalizedQuery)));
            } catch (error) {
                if (requestId !== searchRequestId.current) {
                    return;
                }

                const message = error instanceof Error ? error.message : "Search failed";
                setSearchError(message);
                setRawSearchResults([]);
                throw error;
            } finally {
                if (requestId === searchRequestId.current) {
                    setSearchLoading(false);
                }
            }
        },
        [searchRequest],
    );

    const clearSearch = useCallback(() => {
        searchRequestId.current += 1;
        setRawSearchResults([]);
        setSearchError(null);
        setSearchLoading(false);
    }, []);

    return {
        bookings: enhancedBookings,
        loading: bookingsQuery.isLoading || bookingsQuery.isFetching,
        error: bookingsQuery.error instanceof Error ? bookingsQuery.error : null,
        count: bookingsQuery.data?.total ?? null,
        countLoading: bookingsQuery.isLoading || bookingsQuery.isFetching,
        totalPages: bookingsQuery.data?.totalPages ?? 0,
        currentPage: bookingsQuery.data?.page ?? page,
        hasNextPage: (bookingsQuery.data?.page ?? page) < (bookingsQuery.data?.totalPages ?? 0),
        hasPreviousPage: (bookingsQuery.data?.page ?? page) > 1,
        getBooking,
        getBookingWithDetails,
        getTreatmentData,
        getSessionSummary,
        cancelBooking,
        searchResults: enhancedSearchResults,
        searchLoading,
        searchError,
        searchTotalHits: rawSearchResults.length,
        searchBookings,
        clearSearch,
    };
};

export default useBookings;
