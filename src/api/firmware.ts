import { apiFetch } from "@/lib/api-client";
import type { FirmwareUpdates } from "@/types/firmware-updates";

export type FirmwareMetadata = {
    debianRevision: number;
    upstreamVersion: string;
};

export type ListFirmwareResponse = {
    firmwareUpdates: FirmwareUpdates[];
};

export type UpdateFirmwareRequest = {
    id: string;
    firmware: Partial<FirmwareMetadata>;
};

export type DeleteFirmwareResponse = {
    success: boolean;
};

type RawFirmware = Record<string, unknown>;

type RawListFirmwareResponse =
    | RawFirmware[]
    | {
          firmware?: RawFirmware[];
          firmwarePackages?: RawFirmware[];
          packages?: RawFirmware[];
          items?: RawFirmware[];
          data?: RawFirmware[];
      };

type RawFirmwareResponse =
    | RawFirmware
    | {
          firmware?: RawFirmware;
          firmwarePackage?: RawFirmware;
          package?: RawFirmware;
          data?: RawFirmware;
      };

const MAX_FIRMWARE_SIZE_BYTES = 500 * 1024 * 1024;

const toStringValue = (value: unknown, fallback = ""): string => {
    return typeof value === "string" ? value : fallback;
};

const toNumberValue = (value: unknown, fallback: number): number => {
    const parsed = Number(value ?? fallback);
    return Number.isFinite(parsed) ? parsed : fallback;
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

const removeUndefined = <T extends Record<string, unknown>>(payload: T): Partial<T> => {
    return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)) as Partial<T>;
};

const getFirmwareId = (firmware: RawFirmware, index: number): string => {
    return String(firmware.id ?? firmware._id ?? firmware.objectID ?? `firmware-${index}`);
};

const normalizeFirmware = (firmware: RawFirmware, index: number): FirmwareUpdates => {
    return {
        ...firmware,
        id: getFirmwareId(firmware, index),
        file: toStringValue(firmware.file ?? firmware.url ?? firmware.fileUrl ?? firmware.downloadUrl ?? firmware.packageUrl),
        fileName: toStringValue(firmware.fileName ?? firmware.name),
        debianRevision: toNumberValue(firmware.debianRevision, 0),
        upstreamVersion: toStringValue(firmware.upstreamVersion),
        uploadedBy: toStringValue(firmware.uploadedBy ?? firmware.createdBy ?? firmware.createdByUserId ?? firmware.userId, "unknown"),
        createdAt: normalizeTimestamp(firmware.createdAt),
        updatedAt: normalizeTimestamp(firmware.updatedAt),
    };
};

const extractFirmwareArray = (response: RawListFirmwareResponse): RawFirmware[] => {
    if (Array.isArray(response)) {
        return response;
    }

    return response.firmware ?? response.firmwarePackages ?? response.packages ?? response.items ?? response.data ?? [];
};

const hasNestedFirmware = (value: unknown, key: "firmware" | "firmwarePackage" | "package" | "data"): value is Record<typeof key, RawFirmware> => {
    if (!value || typeof value !== "object" || !(key in value)) return false;

    const nested = (value as Record<string, unknown>)[key];
    return Boolean(nested && typeof nested === "object" && !Array.isArray(nested));
};

const extractFirmware = (response: RawFirmwareResponse): RawFirmware => {
    if (hasNestedFirmware(response, "firmware")) return response.firmware;
    if (hasNestedFirmware(response, "firmwarePackage")) return response.firmwarePackage;
    if (hasNestedFirmware(response, "package")) return response.package;
    if (hasNestedFirmware(response, "data")) return response.data;

    return response as RawFirmware;
};

const assertFirmwareId = (id: string) => {
    if (!id.trim()) {
        throw new Error("Firmware ID is required.");
    }
};

const assertFirmwareFile = (file: File) => {
    if (!file) {
        throw new Error("Firmware file is required.");
    }

    if (!file.name.toLowerCase().endsWith(".deb")) {
        throw new Error("Firmware file must be a .deb package.");
    }

    if (file.size > MAX_FIRMWARE_SIZE_BYTES) {
        throw new Error("Firmware file must be 500MB or smaller.");
    }
};

const assertFirmwareMetadata = (metadata: FirmwareMetadata) => {
    if (!metadata.upstreamVersion?.trim()) {
        throw new Error("Upstream version is required.");
    }

    if (!Number.isInteger(metadata.debianRevision) || metadata.debianRevision <= 0) {
        throw new Error("Debian revision must be a positive integer.");
    }
};

const assertPartialFirmwareMetadata = (metadata: Partial<FirmwareMetadata>) => {
    if (metadata.upstreamVersion !== undefined && !metadata.upstreamVersion.trim()) {
        throw new Error("Upstream version cannot be empty.");
    }

    if (metadata.debianRevision !== undefined && (!Number.isInteger(metadata.debianRevision) || metadata.debianRevision <= 0)) {
        throw new Error("Debian revision must be a positive integer.");
    }
};

const buildFirmwareMetadataPayload = (metadata: Partial<FirmwareMetadata>): Record<string, unknown> => {
    return removeUndefined({
        upstreamVersion: metadata.upstreamVersion?.trim(),
        debianRevision: metadata.debianRevision,
    });
};

export const firmwareApi = {
    listFirmware: async (): Promise<ListFirmwareResponse> => {
        const response = await apiFetch<RawListFirmwareResponse>("/v1/api/firmware", {
            method: "GET",
        });

        return {
            firmwareUpdates: extractFirmwareArray(response).map(normalizeFirmware),
        };
    },

    uploadFirmware: async (file: File, metadata: FirmwareMetadata): Promise<FirmwareUpdates> => {
        assertFirmwareFile(file);
        assertFirmwareMetadata(metadata);

        const body = new FormData();
        body.append("file", file);
        body.append("upstreamVersion", metadata.upstreamVersion.trim());
        body.append("debianRevision", String(metadata.debianRevision));

        const response = await apiFetch<RawFirmwareResponse>("/v1/upload/firmware", {
            method: "POST",
            body,
            timeoutMs: 120_000,
        });

        return normalizeFirmware(
            {
                fileName: file.name,
                ...metadata,
                ...extractFirmware(response),
            },
            0,
        );
    },

    updateFirmware: ({ id, firmware }: UpdateFirmwareRequest): Promise<FirmwareUpdates> => {
        assertFirmwareId(id);
        assertPartialFirmwareMetadata(firmware);

        const payload = buildFirmwareMetadataPayload(firmware);
        if (Object.keys(payload).length === 0) {
            throw new Error("At least one firmware field is required.");
        }

        return apiFetch<RawFirmwareResponse>(`/v1/api/firmware/${encodeURIComponent(id)}`, {
            method: "PUT",
            body: payload,
        }).then((response) => normalizeFirmware(extractFirmware(response), 0));
    },

    deleteFirmware: async (id: string): Promise<DeleteFirmwareResponse> => {
        assertFirmwareId(id);

        const response = await apiFetch<DeleteFirmwareResponse | undefined>(`/v1/api/firmware/${encodeURIComponent(id)}`, {
            method: "DELETE",
        });

        return response ?? { success: true };
    },
};
