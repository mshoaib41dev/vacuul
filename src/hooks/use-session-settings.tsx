import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { FIRESTORE } from "@/config";
import { SessionSettings, SessionFrequency, SessionTemperature, SessionPressure, LedColorModel, PresetModel } from "@/types/session-setting";

// Firestore data structure (with LED indexes)
interface FirestorePresetModel {
    nameEN: string;
    nameDE: string;
    frequency: number;
    temperature: number;
    led: number; // Index instead of full object
}

interface FirestoreSessionSettings {
    frequency: SessionFrequency;
    temperature: SessionTemperature;
    pressure: SessionPressure;
    ledColors: LedColorModel[];
    presets: FirestorePresetModel[];
}

interface UseSessionSettingsReturn {
    settings: SessionSettings | null;
    loading: boolean;
    error: string | null;
    getSettings: () => Promise<void>;
    updateSettings: (data: SessionSettings) => Promise<void>;
    isUpdating: boolean;
}

const SESSION_SETTINGS_COLLECTION = "session_settings";
const CONFIG_DOC_ID = "config";

export const useSessionSettings = (): UseSessionSettingsReturn => {
    const [settings, setSettings] = useState<SessionSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Convert Firestore data to UI format
    const convertFirestoreToUI = (firestoreData: FirestoreSessionSettings): SessionSettings => {
        const convertedPresets: PresetModel[] = firestoreData.presets.map(preset => {
            // Get LED color by index, fallback to first color or default
            let ledColor: LedColorModel;
            
            if (typeof preset.led === 'number' && 
                preset.led >= 0 && 
                preset.led < firestoreData.ledColors.length) {
                ledColor = firestoreData.ledColors[preset.led];
            } else {
                // Fallback to first color or default
                ledColor = firestoreData.ledColors.length > 0 
                    ? firestoreData.ledColors[0]
                    : { color: "#000000", nameEN: "Default", nameDE: "Standard" };
            }

            return {
                nameEN: preset.nameEN,
                nameDE: preset.nameDE,
                frequency: preset.frequency,
                temperature: preset.temperature,
                led: ledColor
            };
        });

        return {
            frequency: firestoreData.frequency,
            temperature: firestoreData.temperature,
            pressure: firestoreData.pressure ?? { min: 20, max: 80 },
            ledColors: firestoreData.ledColors,
            presets: convertedPresets
        };
    };

    // Convert UI data to Firestore format
    const convertUIToFirestore = (uiData: SessionSettings): FirestoreSessionSettings => {
        const convertedPresets: FirestorePresetModel[] = uiData.presets.map(preset => {
            // Find the index of the LED color in the ledColors array
            let ledIndex = 0; // Default to first color
            
            const foundIndex = uiData.ledColors.findIndex(color => 
                color.color === preset.led.color &&
                color.nameEN === preset.led.nameEN &&
                color.nameDE === preset.led.nameDE
            );
            
            if (foundIndex !== -1) {
                ledIndex = foundIndex;
            }

            return {
                nameEN: preset.nameEN,
                nameDE: preset.nameDE,
                frequency: preset.frequency,
                temperature: preset.temperature,
                led: ledIndex
            };
        });

        return {
            frequency: uiData.frequency,
            temperature: uiData.temperature,
            pressure: uiData.pressure,
            ledColors: uiData.ledColors,
            presets: convertedPresets
        };
    };

    const getSettings = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const docRef = doc(FIRESTORE, SESSION_SETTINGS_COLLECTION, CONFIG_DOC_ID);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const firestoreData = docSnap.data() as FirestoreSessionSettings;
                const uiData = convertFirestoreToUI(firestoreData);
                setSettings(uiData);
            } else {
                // Initialize with default values if document doesn't exist
                const defaultSettings: SessionSettings = {
                    frequency: { min: 20, max: 60 },
                    temperature: { min: 35, max: 45 },
                    pressure: { min: 20, max: 80 },
                    ledColors: [],
                    presets: []
                };
                setSettings(defaultSettings);
            }
        } catch (err) {
            console.error("Error fetching session settings:", err);
            setError("Failed to load session settings");
        } finally {
            setLoading(false);
        }
    };

    const updateSettings = async (data: SessionSettings) => {
        try {
            setIsUpdating(true);
            setError(null);
            
            // Convert UI data to Firestore format before saving
            const firestoreData = convertUIToFirestore(data);
            
            const docRef = doc(FIRESTORE, SESSION_SETTINGS_COLLECTION, CONFIG_DOC_ID);
            await setDoc(docRef, firestoreData);
            
            setSettings(data);
        } catch (err) {
            console.error("Error updating session settings:", err);
            setError("Failed to update session settings");
            throw err;
        } finally {
            setIsUpdating(false);
        }
    };

    useEffect(() => {
        getSettings();
    }, []);

    return {
        settings,
        loading,
        error,
        getSettings,
        updateSettings,
        isUpdating
    };
};