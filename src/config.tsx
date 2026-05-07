import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
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
