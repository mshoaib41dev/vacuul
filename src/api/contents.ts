import { apiFetch } from "@/lib/api-client";
import type { Content } from "@/types/content";

export type ContentUploadType = "idle" | "pause" | "duringSession";

export type ListContentsRequest = {
    page?: number;
    limit?: number;
};

export type ListContentsResponse = {
    contents: Content[];
    total: number;
    page: number;
    totalPages: number;
};

export type DeleteContentResponse = {
    success: boolean;
};

type RawContent = Record<string, unknown>;

type RawListContentsResponse =
    | RawContent[]
    | {
          contents?: RawContent[];
          items?: RawContent[];
          data?: RawContent[];
          total?: number | string;
          page?: number | string;
          totalPages?: number | string;
      };

const MAX_CONTENT_SIZE_BYTES = 500 * 1024 * 1024;

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

const normalizeContent = (content: RawContent, index: number): Content => {
    const url = toStringValue(content.url ?? content.fileUrl ?? content.downloadUrl);
    const name = toStringValue(content.name ?? content.fileName, url ? url.split("/").pop() : `content-${index}`);
    const type = toStringValue(content.mimeType ?? content.contentType ?? content.type, "video/mp4");

    return {
        ...content,
        id: String(content.id ?? content._id ?? content.objectID ?? `content-${index}`),
        name,
        url,
        type,
        size: toNumber(content.size, 0),
        uploadedBy: toStringValue(content.uploadedBy ?? content.createdByUserId, "unknown"),
        createdAt: content.createdAt,
        updatedAt: content.updatedAt,
    };
};

const extractContents = (response: RawListContentsResponse): RawContent[] => {
    if (Array.isArray(response)) return response;

    return response.contents ?? response.items ?? response.data ?? [];
};

const assertContentId = (id: string) => {
    if (!id.trim()) {
        throw new Error("Content ID is required.");
    }
};

const assertUploadContent = (file: File) => {
    if (!file) {
        throw new Error("Content file is required.");
    }

    if (!(file.type.startsWith("video/") || file.type.startsWith("audio/"))) {
        throw new Error("Content file must be video or audio.");
    }

    if (file.size > MAX_CONTENT_SIZE_BYTES) {
        throw new Error("Content file must be 500MB or smaller.");
    }
};

export const contentsApi = {
    listContents: async ({ page, limit }: ListContentsRequest = {}): Promise<ListContentsResponse> => {
        const currentPage = toPositiveInteger(page, 1);
        const pageSize = toPositiveInteger(limit, 20);
        const params = new URLSearchParams({
            page: String(currentPage),
            limit: String(pageSize),
        });

        const response = await apiFetch<RawListContentsResponse>(`/v1/api/contents?${params.toString()}`, {
            method: "GET",
        });
        const rawContents = extractContents(response);
        const total = Array.isArray(response) ? rawContents.length : toNumber(response.total, rawContents.length);

        return {
            contents: rawContents.map(normalizeContent),
            total,
            page: Array.isArray(response) ? currentPage : toNumber(response.page, currentPage),
            totalPages: Array.isArray(response) ? Math.ceil(total / pageSize) : toNumber(response.totalPages, Math.ceil(total / pageSize)),
        };
    },

    uploadContent: async (file: File, type: ContentUploadType = "idle"): Promise<Content> => {
        assertUploadContent(file);

        const body = new FormData();
        body.append("file", file);
        body.append("type", type);

        const response = await apiFetch<RawContent>("/v1/upload/content", {
            method: "POST",
            body,
            timeoutMs: 120_000,
        });

        return normalizeContent(
            {
                name: file.name,
                mimeType: file.type,
                size: file.size,
                ...response,
            },
            0,
        );
    },

    deleteContent: async (id: string): Promise<DeleteContentResponse> => {
        assertContentId(id);

        const response = await apiFetch<DeleteContentResponse | undefined>(`/v1/api/contents/${encodeURIComponent(id)}`, {
            method: "DELETE",
        });

        return response ?? { success: true };
    },
};
