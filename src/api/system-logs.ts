import { apiFetch } from "@/lib/api-client";
import type { SystemLog } from "@/types/system-logs";

export type ListSystemLogsRequest = {
    machineId?: string;
    page?: number;
    limit?: number;
};

export type ListSystemLogsResponse = {
    logs: SystemLog[];
    total: number;
    page: number;
    totalPages: number;
};

type RawSystemLog = Record<string, unknown>;

type RawListSystemLogsResponse =
    | RawSystemLog[]
    | {
          logs?: RawSystemLog[];
          systemLogs?: RawSystemLog[];
          items?: RawSystemLog[];
          data?: RawSystemLog[];
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

const normalizeTimestamp = (value: unknown): unknown => {
    if (!value || typeof value !== "object") {
        return value;
    }

    const timestamp = value as { seconds?: unknown; _seconds?: unknown; nanoseconds?: unknown; _nanoseconds?: unknown };
    const seconds = Number(timestamp.seconds ?? timestamp._seconds);
    if (!Number.isFinite(seconds)) {
        return value;
    }

    const nanoseconds = Number(timestamp.nanoseconds ?? timestamp._nanoseconds ?? 0);
    const milliseconds = seconds * 1000 + (Number.isFinite(nanoseconds) ? Math.floor(nanoseconds / 1_000_000) : 0);
    return new Date(milliseconds).toISOString();
};

const extractLogs = (response: RawListSystemLogsResponse): RawSystemLog[] => {
    if (Array.isArray(response)) return response;

    return response.logs ?? response.systemLogs ?? response.items ?? response.data ?? [];
};

const appendOptionalParam = (params: URLSearchParams, key: string, value: string | number | undefined) => {
    if (value !== undefined && value !== "") {
        params.set(key, String(value));
    }
};

const normalizeSystemLog = (log: RawSystemLog, index: number): SystemLog => {
    const rawError = log.error && typeof log.error === "object" && !Array.isArray(log.error) ? (log.error as Record<string, unknown>) : {};
    const rawMachine = log.machine && typeof log.machine === "object" && !Array.isArray(log.machine) ? (log.machine as Record<string, unknown>) : {};

    return {
        ...log,
        id: String(log.id ?? log._id ?? log.objectID ?? `system-log-${index}`),
        machineId: toStringValue(log.machineId ?? rawMachine.id),
        sessionId: toOptionalString(log.sessionId ?? log.bookingId),
        error: {
            code: toStringValue(rawError.code ?? log.code ?? log.errorCode, "UNKNOWN"),
            message: toStringValue(rawError.message ?? log.message ?? log.errorMessage ?? log.description, "Unknown error"),
            severity: toStringValue(rawError.severity ?? log.severity ?? log.level, "error"),
            timestamp: normalizeTimestamp(rawError.timestamp ?? log.timestamp ?? log.createdAt),
        },
        createdAt: normalizeTimestamp(log.createdAt),
        updatedAt: normalizeTimestamp(log.updatedAt),
    };
};

export const systemLogsApi = {
    listSystemLogs: async (request: ListSystemLogsRequest = {}): Promise<ListSystemLogsResponse> => {
        const page = toPositiveInteger(request.page, 1);
        const limit = toPositiveInteger(request.limit, 50);
        const params = new URLSearchParams({
            page: String(page),
            limit: String(limit),
        });

        appendOptionalParam(params, "machineId", request.machineId);

        const response = await apiFetch<RawListSystemLogsResponse>(`/v1/api/system-logs?${params.toString()}`, {
            method: "GET",
        });
        const rawLogs = extractLogs(response);
        const total = Array.isArray(response) ? rawLogs.length : toNumber(response.total, rawLogs.length);

        return {
            logs: rawLogs.map(normalizeSystemLog),
            total,
            page: Array.isArray(response) ? page : toNumber(response.page, page),
            totalPages: Array.isArray(response) ? Math.ceil(total / limit) : toNumber(response.totalPages, Math.ceil(total / limit)),
        };
    },
};
