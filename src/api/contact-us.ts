import { apiFetch } from "@/lib/api-client";
import type { ContactResponses } from "@/types/contact-responses";

export type ListContactResponsesResponse = {
    responses: ContactResponses[];
};

export type DeleteContactResponseResponse = {
    success: boolean;
};

type RawContactResponse = Record<string, unknown>;

type RawListContactResponsesResponse =
    | RawContactResponse[]
    | {
          contactUs?: RawContactResponse[];
          contacts?: RawContactResponse[];
          responses?: RawContactResponse[];
          submissions?: RawContactResponse[];
          data?: RawContactResponse[];
      };

const toStringValue = (value: unknown, fallback = ""): string => {
    return typeof value === "string" ? value : fallback;
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

const getContactResponseId = (response: RawContactResponse, index: number): string => {
    return String(response.id ?? response._id ?? response.objectID ?? `contact-response-${index}`);
};

const normalizeContactResponse = (response: RawContactResponse, index: number): ContactResponses => {
    return {
        ...response,
        id: getContactResponseId(response, index),
        uid: toStringValue(response.uid ?? response.userId),
        email: toStringValue(response.email),
        message: toStringValue(response.message),
        name: toStringValue(response.name ?? response.displayName),
        createdAt: normalizeTimestamp(response.createdAt ?? response.submittedAt),
    };
};

const extractContactResponseArray = (response: RawListContactResponsesResponse): RawContactResponse[] => {
    if (Array.isArray(response)) {
        return response;
    }

    return response.contactUs ?? response.contacts ?? response.responses ?? response.submissions ?? response.data ?? [];
};

const assertContactResponseId = (id: string) => {
    if (!id.trim()) {
        throw new Error("Contact response ID is required.");
    }
};

export const contactUsApi = {
    listContactResponses: async (): Promise<ListContactResponsesResponse> => {
        const response = await apiFetch<RawListContactResponsesResponse>("/v1/api/contact-us", {
            method: "GET",
        });

        return {
            responses: extractContactResponseArray(response).map(normalizeContactResponse),
        };
    },

    deleteContactResponse: async (id: string): Promise<DeleteContactResponseResponse> => {
        assertContactResponseId(id);

        const response = await apiFetch<DeleteContactResponseResponse | undefined>(`/v1/api/contact-us/${encodeURIComponent(id)}`, {
            method: "DELETE",
        });

        return response ?? { success: true };
    },
};
