const config = import.meta.env;

const normalizeBaseUrl = (value: string | undefined): string => {
    return (value ?? "").trim().replace(/\/+$/, "");
};

const parsePositiveInteger = (value: string | undefined, fallback: number): number => {
    const parsed = Number(value ?? fallback);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const DEFAULT_API_BASE_URL = "https://vaccul-backend.ahdus.de";

export const API_BASE_URL = normalizeBaseUrl(config.VITE_API_BASE_URL || DEFAULT_API_BASE_URL);

export const API_TIMEOUT_MS = parsePositiveInteger(config.VITE_API_TIMEOUT_MS, 15000);
export const API_USE_CREDENTIALS = config.VITE_API_USE_CREDENTIALS === "true";

// Third-party services that still run directly in the browser.
export const GOOGLE_MAPS_API_KEY = config.VITE_GOOGLE_MAPS_API_KEY ?? "";
export const ALGOLIA_APP_ID = config.VITE_ALGOLIA_APP_ID ?? "";
export const ALGOLIA_SEARCH_API_KEY = config.VITE_ALGOLIA_SEARCH_API_KEY ?? "";

export const kDebugMode = config.VITE_DEBUG_MODE === "true";
export const APP_NAME = config.VITE_APP_NAME ?? "Vacuul";

// Kept until machine/user screens are migrated away from Firestore role lookups.
export const MACHINE_OWNER_ROLE_ID = config.VITE_MACHINE_OWNER_ROLE_ID ?? "";

const createUnavailableFirebaseService = (name: string) =>
    new Proxy(
        {},
        {
            get() {
                throw new Error(`${name} is no longer initialized. Migrate this call to the Node.js API client.`);
            },
            apply() {
                throw new Error(`${name} is no longer initialized. Migrate this call to the Node.js API client.`);
            },
        },
    );

// Transitional compatibility exports. They intentionally do not initialize Firebase.
export const FIREBASE_SERVICES_AVAILABLE = false;
export const USE_FIREBASE_EMULATORS = false;
export const AUTH: any = createUnavailableFirebaseService("AUTH");
export const FIRESTORE: any = createUnavailableFirebaseService("FIRESTORE");
export const STORAGE: any = createUnavailableFirebaseService("STORAGE");
export const FUNCTION: any = createUnavailableFirebaseService("FUNCTION");

export default config;
