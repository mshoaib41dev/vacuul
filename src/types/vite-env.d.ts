/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
    readonly VITE_API_TIMEOUT_MS?: string;
    readonly VITE_API_USE_CREDENTIALS?: string;
    readonly VITE_APP_NAME?: string;
    readonly VITE_DEBUG_MODE?: string;
    readonly VITE_GOOGLE_MAPS_API_KEY?: string;
    readonly VITE_ALGOLIA_SEARCH_API_KEY?: string;
    readonly VITE_ALGOLIA_APP_ID?: string;
    readonly VITE_MACHINE_OWNER_ROLE_ID?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
