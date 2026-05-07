import { FirestoreError, Timestamp } from "firebase/firestore";
import type { RangeValue } from "@react-types/shared";
import type { DateValue } from "@internationalized/date";

type DateRangeValue = RangeValue<DateValue>;

interface TreatmentConfig {
    led: {
        staticColour: string;
    };
    blocks: Array<{
        type: number;
        temperature: number;
        duration: number;
    }>;
    frequency: number;
}

interface Booking {
    id: string;
    machineId: string;
    machineName: string;
    userId: string;
    startTime: Timestamp;
    endTime: Timestamp;
    status: "booked" | "cancelled" | "completed";
    sessionStatus?: "started" | "done" | "paused" | "cancelled" | "running";
    treatmentConfig: TreatmentConfig;
    location?: {
        lat: number;
        lng: number;
        address: string;
    };
    rating?: number;
    review?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

interface TreatmentData {
    id: string;
    heartRate: number;
    spo2: number;
    temperature: number;
    status: string;
    timestamp: number;
    progress: number;
    userId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

interface SessionSummary {
    id: string;
    summary: {
        averageHeartRate: number;
        averageSpo2: number;
        minTemperature: number;
        maxTemperature: number;
        duration: number; // in seconds
        completedAt: number;
    };
    userId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

interface BookingWithDetails extends Booking {
    machineCommissionId?: string;
    userName?: string;
    userEmail?: string;
    duration: number; // Duration in minutes
    isPast: boolean;
    isCurrent: boolean;
    isFuture: boolean;
    treatmentData?: TreatmentData[];
    sessionSummary?: SessionSummary;
}

interface UseBookings {
    bookings: BookingWithDetails[];
    loading: boolean;
    error: FirestoreError | null;
    count: number | null;
    countLoading: boolean;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    getBooking: (bookingId: string) => Promise<Booking | null>;
    getBookingWithDetails: (bookingId: string) => Promise<BookingWithDetails | null>;
    getTreatmentData: (bookingId: string) => Promise<TreatmentData[]>;
    getSessionSummary: (bookingId: string) => Promise<SessionSummary | null>;
    cancelBooking: (bookingId: string) => Promise<void>;
    // Search functionality
    searchResults: BookingWithDetails[];
    searchLoading: boolean;
    searchError: string | null;
    searchTotalHits: number;
    searchBookings: (query: string) => Promise<void>;
    clearSearch: () => void;
}

interface BookingFilters {
    status?: "booked" | "cancelled" | "completed" | "all";
    sessionStatus?: "started" | "done" | "paused" | "cancelled" | "running" | "all";
    machineId?: string;
    userId?: string;
    dateRange?: DateRangeValue | null;
}

interface BookingTableRow {
    id: string;
    bookingId: string;
    machineName: string;
    machineCommissionId: string;
    userName: string;
    userEmail: string;
    startTime: string; // Formatted time string
    endTime: string; // Formatted time string
    date: string; // Formatted date string
    duration: string; // e.g., "30 min"
    status: "booked" | "cancelled" | "completed";
    sessionStatus?: "started" | "done" | "paused" | "cancelled" | "running";
    statusColor: "success" | "warning" | "error";
    sessionStatusColor?: "success" | "warning" | "error" | "gray";
    rating?: number;
    hasDetails: boolean; // Whether this booking has treatment data available
    isPast: boolean;
    isCurrent: boolean;
    isFuture: boolean;
}

export type { 
    Booking, 
    BookingWithDetails, 
    UseBookings, 
    BookingFilters, 
    BookingTableRow,
    TreatmentConfig,
    TreatmentData,
    SessionSummary
};