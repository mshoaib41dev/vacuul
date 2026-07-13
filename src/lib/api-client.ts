import { API_BASE_URL, API_TIMEOUT_MS, API_USE_CREDENTIALS } from "@/config";
import {
    createAuthSession,
    getAccessToken,
    getRefreshToken,
    useAuthStore,
    type AuthSession,
    type AuthSessionResponse,
} from "@/stores/auth-store";

type ApiErrorBody = {
    error?: {
        code?: string;
        message?: string;
    };
    code?: string;
    message?: string;
};

export class ApiError extends Error {
    status: number;
    code: string;
    payload: unknown;

    constructor(message: string, status: number, code: string, payload: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.code = code;
        this.payload = payload;
    }
}

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
    body?: unknown;
    retryOnUnauthorized?: boolean;
    skipAuth?: boolean;
    timeoutMs?: number;
};

let refreshRequest: Promise<AuthSession | null> | null = null;

const resolveApiUrl = (path: string): string => {
    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    if (!API_BASE_URL) {
        throw new Error("VITE_API_BASE_URL is not configured.");
    }

    return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

const isBodyInit = (body: unknown): body is BodyInit => {
    return typeof body === "string" || body instanceof FormData || body instanceof Blob || body instanceof URLSearchParams || body instanceof ArrayBuffer;
};

const buildHeaders = (headers: HeadersInit | undefined, body: unknown, skipAuth: boolean): Headers => {
    const nextHeaders = new Headers(headers);

    if (body !== undefined && !(body instanceof FormData) && !nextHeaders.has("Content-Type")) {
        nextHeaders.set("Content-Type", "application/json");
    }

    if (!skipAuth) {
        const token = getAccessToken();
        if (token) {
            nextHeaders.set("Authorization", `Bearer ${token}`);
        }
    }

    return nextHeaders;
};

const buildBody = (body: unknown): BodyInit | undefined => {
    if (body === undefined || body === null) return undefined;
    return isBodyInit(body) ? body : JSON.stringify(body);
};

const parseResponse = async <T>(response: Response): Promise<T> => {
    if (response.status === 204) {
        return undefined as T;
    }

    const contentType = response.headers.get("Content-Type") ?? "";

    if (contentType.includes("application/json")) {
        return (await response.json()) as T;
    }

    return (await response.text()) as T;
};

const toApiError = (status: number, statusText: string, payload: unknown): ApiError => {
    const body = payload as ApiErrorBody;
    const code = body?.error?.code ?? body?.code ?? statusText;
    const message = body?.error?.message ?? body?.message ?? statusText;
    return new ApiError(message, status, code, payload);
};

const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs: number): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, {
            ...init,
            signal: controller.signal,
        });
    } finally {
        window.clearTimeout(timeoutId);
    }
};

export const refreshAuthSession = async (): Promise<AuthSession | null> => {
    if (refreshRequest) {
        return refreshRequest;
    }

    refreshRequest = (async () => {
        const currentState = useAuthStore.getState();
        const refreshToken = getRefreshToken();

        try {
            if (!refreshToken) {
                throw new Error("Refresh token is required.");
            }

            const response = await fetchWithTimeout(
                resolveApiUrl("/v1/auth/refresh"),
                {
                    method: "POST",
                    credentials: API_USE_CREDENTIALS ? "include" : "omit",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ refreshToken }),
                },
                API_TIMEOUT_MS,
            );

            const payload = await parseResponse<AuthSessionResponse | ApiErrorBody>(response);

            if (!response.ok) {
                throw toApiError(response.status, response.statusText, payload);
            }

            const session = createAuthSession(payload as AuthSessionResponse, currentState.session);
            currentState.updateSession(session);
            return session;
        } catch (error) {
            currentState.clearSession();
            throw error;
        } finally {
            refreshRequest = null;
        }
    })();

    return refreshRequest;
};

export const apiFetch = async <T>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
    const { body, retryOnUnauthorized = true, skipAuth = false, timeoutMs = API_TIMEOUT_MS, ...requestInit } = options;
    const response = await fetchWithTimeout(
        resolveApiUrl(path),
        {
            ...requestInit,
            credentials: API_USE_CREDENTIALS ? "include" : "omit",
            headers: buildHeaders(requestInit.headers, body, skipAuth),
            body: buildBody(body),
        },
        timeoutMs,
    );

    const payload = await parseResponse<T | ApiErrorBody>(response);

    if (response.status === 401 && retryOnUnauthorized && !skipAuth) {
        await refreshAuthSession();
        return apiFetch<T>(path, {
            ...options,
            retryOnUnauthorized: false,
        });
    }

    if (!response.ok) {
        throw toApiError(response.status, response.statusText, payload);
    }

    return payload as T;
};
