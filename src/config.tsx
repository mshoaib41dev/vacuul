import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

// API
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
export const ALGOLIA_APP_ID = import.meta.env.VITE_ALGOLIA_APP_ID;
export const ALGOLIA_SEARCH_API_KEY = import.meta.env.VITE_ALGOLIA_SEARCH_API_KEY;
export const FIREBASE_API = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APPID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const FIREBASEAPP = initializeApp(FIREBASE_API);
export const AUTH = getAuth(FIREBASEAPP);
export const FIRESTORE = getFirestore(FIREBASEAPP);
export const STORAGE = getStorage(FIREBASEAPP);
export const FUNCTION = getFunctions(FIREBASEAPP, "europe-west6");

export const kDebugMode = import.meta.env.VITE_DEBUG_MODE === "true";

export const APP_NAME = import.meta.env.VITE_APP_NAME;

// Roles
export const MACHINE_OWNER_ROLE_ID = import.meta.env.VITE_MACHINE_OWNER_ROLE_ID;

const shouldUseEmulators =
    import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";

if (shouldUseEmulators) {
    const functionsEmulatorHost =
        (import.meta.env.VITE_FIREBASE_FUNCTIONS_EMULATOR_HOST as string | undefined) ??
        "127.0.0.1";
    const functionsEmulatorPortRaw = import.meta.env
        .VITE_FIREBASE_FUNCTIONS_EMULATOR_PORT as string | undefined;
    const functionsEmulatorPort = Number(functionsEmulatorPortRaw ?? "5002");

    if (!Number.isFinite(functionsEmulatorPort)) {
        throw new Error(
            `Invalid VITE_FIREBASE_FUNCTIONS_EMULATOR_PORT: ${String(functionsEmulatorPortRaw)}`,
        );
    }

    // Connect callable/https functions to local emulator.
    // The Emulator UI port (4002) is only for viewing; requests go to Functions port (5002).
    connectFunctionsEmulator(FUNCTION, functionsEmulatorHost, functionsEmulatorPort);

    const authEmulatorUrl =
        (import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL as string | undefined) ??
        "http://127.0.0.1:9099";
    connectAuthEmulator(AUTH, authEmulatorUrl, { disableWarnings: true });

    const firestoreEmulatorHost =
        (import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST as string | undefined) ??
        "127.0.0.1";
    const firestoreEmulatorPortRaw = import.meta.env
        .VITE_FIREBASE_FIRESTORE_EMULATOR_PORT as string | undefined;
    const firestoreEmulatorPort = Number(firestoreEmulatorPortRaw ?? "8080");
    if (!Number.isFinite(firestoreEmulatorPort)) {
        throw new Error(
            `Invalid VITE_FIREBASE_FIRESTORE_EMULATOR_PORT: ${String(firestoreEmulatorPortRaw)}`,
        );
    }
    connectFirestoreEmulator(FIRESTORE, firestoreEmulatorHost, firestoreEmulatorPort);

    // High-signal verification log (shows exact route used by httpsCallable).
    // Region is embedded in the URL path, e.g. /<project>/<region>/<functionName>
    console.info(
        `[Firebase] Functions emulator connected → http://${functionsEmulatorHost}:${functionsEmulatorPort}/${FIREBASE_API.projectId}/${FUNCTION.region}`,
    );
    console.info(`[Firebase] Auth emulator connected → ${authEmulatorUrl}`);
    console.info(
        `[Firebase] Firestore emulator connected → ${firestoreEmulatorHost}:${firestoreEmulatorPort}`,
    );
}
