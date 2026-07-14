import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

const AUTH_STORAGE_KEY = "vacuul-admin-auth";

export type AuthStorageMode = "local" | "session";

export type AuthUser = {
    id?: string;
    uid?: string;
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
    languageCode?: "en" | "de" | string | null;
    verified?: boolean;
    role?: string | null;
};

export type AuthSession = {
    token: string;
    refreshToken?: string | null;
    uid: string;
    role?: string | null;
    expiresAt?: number | null;
    user?: AuthUser;
};

export type AuthSessionResponse = {
    token: string;
    refreshToken?: string | null;
    uid?: string;
    role?: string | null;
    expiresIn?: number | string;
    user?: AuthUser;
};

type PersistedAuthState = {
    session: AuthSession | null;
    storageMode: AuthStorageMode;
};

type AuthStoreState = PersistedAuthState & {
    isInitialized: boolean;
    setInitialized: (value: boolean) => void;
    setSession: (session: AuthSession, storageMode: AuthStorageMode) => void;
    updateSession: (session: AuthSession) => void;
    updateUser: (user: AuthUser) => void;
    clearSession: () => void;
};

const browserStorage = (type: AuthStorageMode): Storage | undefined => {
    if (typeof window === "undefined") return undefined;
    return type === "local" ? window.localStorage : window.sessionStorage;
};

const getReadableCookieNames = (): string[] => {
    if (typeof document === "undefined") return [];

    return document.cookie
        .split(";")
        .map((cookie) => {
            return cookie.split("=")[0]?.trim();
        })
        .filter(Boolean);
};

const isAuthCookieName = (name: string): boolean => {
    return /auth|session|token|refresh|jwt/i.test(name);
};

const clearReadableAuthCookies = (): void => {
    if (typeof document === "undefined" || typeof window === "undefined") return;

    const names = getReadableCookieNames().filter(isAuthCookieName);
    const pathCandidates = Array.from(new Set(["/", window.location.pathname || "/"]));
    const hostname = window.location.hostname;
    const domainCandidates = Array.from(new Set(["", hostname, hostname.startsWith(".") ? hostname : `.${hostname}`]));

    names.forEach((name) => {
        pathCandidates.forEach((path) => {
            domainCandidates.forEach((domain) => {
                const domainPart = domain ? `; domain=${domain}` : "";
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; path=${path}${domainPart}`;
            });
        });
    });
};

const removeUndefinedUserFields = (user: AuthUser): AuthUser => {
    return Object.fromEntries(Object.entries(user).filter(([, value]) => value !== undefined)) as AuthUser;
};

const dualAuthStorage: StateStorage = {
    getItem: (name) => {
        const sessionValue = browserStorage("session")?.getItem(name);
        return sessionValue ?? browserStorage("local")?.getItem(name) ?? null;
    },
    setItem: (name, value) => {
        const storageMode = readStorageMode(value);
        const primaryStorage = browserStorage(storageMode);
        const secondaryStorage = browserStorage(storageMode === "local" ? "session" : "local");

        primaryStorage?.setItem(name, value);
        secondaryStorage?.removeItem(name);
    },
    removeItem: (name) => {
        browserStorage("session")?.removeItem(name);
        browserStorage("local")?.removeItem(name);
    },
};

const readStorageMode = (serializedState: string): AuthStorageMode => {
    try {
        const parsed = JSON.parse(serializedState) as { state?: Partial<PersistedAuthState> };
        return parsed.state?.storageMode === "local" ? "local" : "session";
    } catch {
        return "session";
    }
};

const toExpiresAt = (expiresIn: AuthSessionResponse["expiresIn"], fallback?: number | null): number | null => {
    if (expiresIn === undefined || expiresIn === null || expiresIn === "") {
        return fallback ?? null;
    }

    const seconds = Number(expiresIn);
    if (!Number.isFinite(seconds) || seconds <= 0) {
        return fallback ?? null;
    }

    return Date.now() + seconds * 1000;
};

export const createAuthSession = (response: AuthSessionResponse, previousSession?: AuthSession | null): AuthSession => {
    const uid = response.uid ?? response.user?.uid ?? response.user?.id ?? previousSession?.uid;

    if (!response.token) {
        throw new Error("Auth response is missing token.");
    }

    if (!uid) {
        throw new Error("Auth response is missing uid.");
    }

    const role = response.role ?? response.user?.role ?? previousSession?.role ?? null;

    return {
        token: response.token,
        refreshToken: response.refreshToken ?? previousSession?.refreshToken ?? null,
        uid,
        role,
        expiresAt: toExpiresAt(response.expiresIn, previousSession?.expiresAt),
        user: {
            ...previousSession?.user,
            ...response.user,
            id: response.user?.id ?? uid,
            uid: response.user?.uid ?? uid,
            role,
        },
    };
};

export const useAuthStore = create<AuthStoreState>()(
    persist(
        (set) => ({
            session: null,
            storageMode: "session",
            isInitialized: false,
            setInitialized: (value) => set({ isInitialized: value }),
            setSession: (session, storageMode) => set({ session, storageMode }),
            updateSession: (session) => set({ session }),
            updateUser: (user) => {
                const definedUserFields = removeUndefinedUserFields(user);

                set((state) => ({
                    session: state.session
                        ? {
                              ...state.session,
                              user: {
                                  ...state.session.user,
                                  ...definedUserFields,
                              },
                          }
                        : state.session,
                }));
            },
            clearSession: () => {
                set({ session: null, storageMode: "session" });
                dualAuthStorage.removeItem(AUTH_STORAGE_KEY);
                clearReadableAuthCookies();
            },
        }),
        {
            name: AUTH_STORAGE_KEY,
            storage: createJSONStorage(() => dualAuthStorage),
            partialize: (state): PersistedAuthState => ({
                session: state.session,
                storageMode: state.storageMode,
            }),
        },
    ),
);

export const getAccessToken = (): string | null => useAuthStore.getState().session?.token ?? null;

export const getRefreshToken = (): string | null => useAuthStore.getState().session?.refreshToken ?? null;

export const isAccessTokenExpired = (bufferMs = 30000): boolean => {
    const expiresAt = useAuthStore.getState().session?.expiresAt;
    return typeof expiresAt === "number" ? Date.now() + bufferMs >= expiresAt : false;
};
