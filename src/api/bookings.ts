import { apiFetch } from "@/lib/api-client";
import type { Booking, SessionSummary, TreatmentConfig, TreatmentData } from "@/types/booking";

export type ApiBookingSessionStatus = "started" | "done" | "aborted";

export type ListBookingsRequest = {
    machineId?: string;
    userId?: string;
    status?: Booking["status"];
    sessionStatus?: ApiBookingSessionStatus;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
};

export type ListBookingsResponse = {
    bookings: Booking[];
    total: number;
    page: number;
    totalPages: number;
};

type RawBooking = Record<string, unknown>;

type RawListBookingsResponse =
    | RawBooking[]
    | {
          bookings?: RawBooking[];
          appointments?: RawBooking[];
          items?: RawBooking[];
          data?: RawBooking[];
          total?: number | string;
          page?: number | string;
          totalPages?: number | string;
      };

const toPositiveInteger = (value: number | undefined, fallback: number): number => {
    return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;
};

const toNumber = (value: unknown, fallback: number): number => {
    const parsed = Number(value ?? fallback);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const toStringValue = (value: unknown, fallback = ""): string => {
    return typeof value === "string" ? value : fallback;
};

const toOptionalString = (value: unknown): string | undefined => {
    return typeof value === "string" && value.trim() ? value : undefined;
};

const normalizeStatus = (value: unknown): Booking["status"] => {
    return value === "cancelled" || value === "completed" || value === "booked" ? value : "booked";
};

const normalizeSessionStatus = (value: unknown): Booking["sessionStatus"] => {
    if (value === "started" || value === "done" || value === "paused" || value === "cancelled" || value === "running" || value === "aborted") {
        return value;
    }

    return undefined;
};

const normalizeTreatmentConfig = (value: unknown): TreatmentConfig | undefined => {
    if (!value || typeof value !== "object") {
        return undefined;
    }

    const config = value as Partial<TreatmentConfig>;

    return {
        led: {
            staticColour: toStringValue(config.led?.staticColour, "#000000"),
        },
        blocks: Array.isArray(config.blocks) ? config.blocks : [],
        frequency: toNumber(config.frequency, 0),
    };
};

const normalizeTreatmentData = (value: unknown): TreatmentData[] | undefined => {
    if (!Array.isArray(value)) {
        return undefined;
    }

    return value.map((item, index) => {
        const treatment = item && typeof item === "object" ? (item as Partial<TreatmentData> & Record<string, unknown>) : {};

        return {
            ...treatment,
            id: toStringValue(treatment.id, `treatment-${index}`),
            heartRate: toNumber(treatment.heartRate, 0),
            spo2: toNumber(treatment.spo2, 0),
            temperature: toNumber(treatment.temperature, 0),
            status: toStringValue(treatment.status),
            timestamp: toNumber(treatment.timestamp, 0),
            progress: toNumber(treatment.progress, 0),
            userId: toStringValue(treatment.userId),
            createdAt: treatment.createdAt,
            updatedAt: treatment.updatedAt,
        };
    });
};

const normalizeSessionSummary = (value: unknown): SessionSummary | undefined => {
    if (!value || typeof value !== "object") {
        return undefined;
    }

    const summary = value as Partial<SessionSummary> & Record<string, unknown>;

    return {
        ...summary,
        id: toStringValue(summary.id, "session-summary"),
        summary: summary.summary ?? {
            averageHeartRate: toNumber(summary.averageHeartRate, 0),
            averageSpo2: toNumber(summary.averageSpo2, 0),
            minTemperature: toNumber(summary.minTemperature, 0),
            maxTemperature: toNumber(summary.maxTemperature, 0),
            duration: toNumber(summary.duration, 0),
            completedAt: toNumber(summary.completedAt, 0),
        },
        userId: toStringValue(summary.userId),
        createdAt: summary.createdAt,
        updatedAt: summary.updatedAt,
    };
};

const normalizeLocation = (value: unknown): Booking["location"] => {
    if (!value || typeof value !== "object") {
        return undefined;
    }

    const location = value as Record<string, unknown>;

    return {
        lat: toNumber(location.lat, 0),
        lng: toNumber(location.lng, 0),
        address: toStringValue(location.address),
    };
};

const extractRawBooking = (response: RawBooking | { booking?: RawBooking; appointment?: RawBooking }): RawBooking => {
    if ("booking" in response && response.booking && typeof response.booking === "object") {
        return response.booking as RawBooking;
    }

    if ("appointment" in response && response.appointment && typeof response.appointment === "object") {
        return response.appointment as RawBooking;
    }

    return response as RawBooking;
};

const normalizeBooking = (booking: RawBooking, index: number): Booking => {
    const rawUser = booking.user && typeof booking.user === "object" ? (booking.user as Record<string, unknown>) : undefined;
    const rawMachine = booking.machine && typeof booking.machine === "object" ? (booking.machine as Record<string, unknown>) : undefined;
    const treatmentConfig = normalizeTreatmentConfig(booking.treatmentConfig);
    const treatmentData = normalizeTreatmentData(booking.treatmentData);
    const sessionSummary = normalizeSessionSummary(booking.sessionSummary);

    return {
        ...booking,
        id: String(booking.id ?? booking._id ?? booking.objectID ?? `booking-${index}`),
        machineId: toStringValue(booking.machineId ?? rawMachine?.id),
        machineName: toStringValue(booking.machineName ?? rawMachine?.name),
        userId: toStringValue(booking.userId ?? rawUser?.id ?? rawUser?.uid),
        userName: toOptionalString(booking.userName ?? rawUser?.displayName),
        userEmail: toOptionalString(booking.userEmail ?? rawUser?.email),
        startTime: booking.startTime ?? booking.startsAt,
        endTime: booking.endTime ?? booking.endsAt,
        status: normalizeStatus(booking.status),
        sessionStatus: normalizeSessionStatus(booking.sessionStatus),
        treatmentConfig,
        treatmentData,
        sessionSummary,
        location: normalizeLocation(booking.location),
        rating: booking.rating === undefined || booking.rating === null ? undefined : toNumber(booking.rating, 0),
        review: toOptionalString(booking.review),
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
    };
};

const extractBookings = (response: RawListBookingsResponse): RawBooking[] => {
    if (Array.isArray(response)) return response;

    return response.bookings ?? response.appointments ?? response.items ?? response.data ?? [];
};

const appendOptionalParam = (params: URLSearchParams, key: string, value: string | number | undefined) => {
    if (value !== undefined && value !== "") {
        params.set(key, String(value));
    }
};

const assertBookingId = (id: string) => {
    if (!id.trim()) {
        throw new Error("Booking ID is required.");
    }
};

export const bookingsApi = {
    listBookings: async (request: ListBookingsRequest = {}): Promise<ListBookingsResponse> => {
        const page = toPositiveInteger(request.page, 1);
        const limit = toPositiveInteger(request.limit, 20);
        const params = new URLSearchParams({
            page: String(page),
            limit: String(limit),
        });

        appendOptionalParam(params, "machineId", request.machineId);
        appendOptionalParam(params, "userId", request.userId);
        appendOptionalParam(params, "status", request.status);
        appendOptionalParam(params, "sessionStatus", request.sessionStatus);
        appendOptionalParam(params, "fromDate", request.fromDate);
        appendOptionalParam(params, "toDate", request.toDate);

        const response = await apiFetch<RawListBookingsResponse>(`/v1/api/bookings?${params.toString()}`, {
            method: "GET",
        });
        const rawBookings = extractBookings(response);
        const total = Array.isArray(response) ? rawBookings.length : toNumber(response.total, rawBookings.length);

        return {
            bookings: rawBookings.map(normalizeBooking),
            total,
            page: Array.isArray(response) ? page : toNumber(response.page, page),
            totalPages: Array.isArray(response) ? Math.ceil(total / limit) : toNumber(response.totalPages, Math.ceil(total / limit)),
        };
    },

    getBooking: async (id: string): Promise<Booking | null> => {
        assertBookingId(id);

        const response = await apiFetch<RawBooking | { booking?: RawBooking; appointment?: RawBooking }>(`/v1/api/bookings/${encodeURIComponent(id)}`, {
            method: "GET",
        });

        return normalizeBooking(extractRawBooking(response), 0);
    },
};
