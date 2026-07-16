import { useEffect, useRef, useCallback, useState, type RefCallback } from "react";
import { GOOGLE_MAPS_API_KEY } from "@/config";

export interface PlaceDetails {
    address: string;
    latitude: number;
    longitude: number;
}

interface UseGooglePlacesReturn {
    inputRef: RefCallback<HTMLInputElement>;
    isLoaded: boolean;
    geocodeAddress: (address: string) => Promise<PlaceDetails | null>;
    reverseGeocode: (lat: number, lng: number) => Promise<string | null>;
}

const SCRIPT_SELECTOR = 'script[src*="maps.googleapis.com"]';

const waitForPlacesLibrary = async (): Promise<boolean> => {
    if (window.google?.maps?.places) {
        return true;
    }

    // Prefer the modern loader — script.onload can fire before `places` is ready with loading=async
    const importLibrary = (window.google?.maps as unknown as { importLibrary?: (name: string) => Promise<unknown> })
        ?.importLibrary;

    if (typeof importLibrary === "function") {
        try {
            await importLibrary("places");
            return !!window.google?.maps?.places;
        } catch (error) {
            console.error("Failed to import Google Places library:", error);
            return false;
        }
    }

    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50;
        const interval = window.setInterval(() => {
            attempts += 1;

            if (window.google?.maps?.places) {
                window.clearInterval(interval);
                resolve(true);
                return;
            }

            if (attempts >= maxAttempts) {
                window.clearInterval(interval);
                resolve(false);
            }
        }, 100);
    });
};

const ensureGoogleMapsScript = (): Promise<void> => {
    if (window.google?.maps) {
        return Promise.resolve();
    }

    const existing = document.querySelector(SCRIPT_SELECTOR);
    if (existing) {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const interval = window.setInterval(() => {
                attempts += 1;
                if (window.google?.maps) {
                    window.clearInterval(interval);
                    resolve();
                    return;
                }
                if (attempts >= 50) {
                    window.clearInterval(interval);
                    reject(new Error("Timed out waiting for Google Maps script"));
                }
            }, 100);
        });
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        const params = new URLSearchParams({
            key: GOOGLE_MAPS_API_KEY,
            libraries: "places",
            loading: "async",
        });

        script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Google Maps API"));
        document.head.appendChild(script);
    });
};

export const useGooglePlaces = (
    onPlaceSelected?: (place: PlaceDetails) => void
): UseGooglePlacesReturn => {
    const inputElementRef = useRef<HTMLInputElement | null>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const onPlaceSelectedRef = useRef(onPlaceSelected);
    const [isLoaded, setIsLoaded] = useState(false);
    const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null);
    const [placesReady, setPlacesReady] = useState(false);

    useEffect(() => {
        onPlaceSelectedRef.current = onPlaceSelected;
    }, [onPlaceSelected]);

    const clearAutocomplete = useCallback(() => {
        if (!autocompleteRef.current) {
            return;
        }

        try {
            window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
        } catch (error) {
            console.error("Error cleaning up Google Places autocomplete:", error);
        }

        autocompleteRef.current = null;
        setIsLoaded(false);
    }, []);

    const inputRef = useCallback<RefCallback<HTMLInputElement>>(
        (node) => {
            if (inputElementRef.current === node) {
                return;
            }

            if (!node) {
                clearAutocomplete();
            }

            inputElementRef.current = node;
            setInputElement(node);
        },
        [clearAutocomplete],
    );

    const waitForGoogleMaps = useCallback(async (): Promise<boolean> => {
        try {
            if (!GOOGLE_MAPS_API_KEY) {
                return false;
            }
            await ensureGoogleMapsScript();
            return waitForPlacesLibrary();
        } catch {
            return false;
        }
    }, []);

    const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string | null> => {
        const isGoogleMapsReady = await waitForGoogleMaps();

        if (!isGoogleMapsReady) {
            console.warn("Google Maps not loaded");
            return null;
        }

        try {
            const geocoder = new window.google.maps.Geocoder();
            const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
                geocoder.geocode(
                    { location: { lat, lng } },
                    (results, status) => {
                        if (status === "OK" && results) {
                            resolve(results);
                        } else {
                            reject(new Error(`Geocoding failed: ${status}`));
                        }
                    }
                );
            });

            if (result && result.length > 0) {
                return result[0].formatted_address;
            }
            return null;
        } catch (error) {
            console.error("Reverse geocoding error:", error);
            return null;
        }
    }, [waitForGoogleMaps]);

    const geocodeAddress = useCallback(async (address: string): Promise<PlaceDetails | null> => {
        const isGoogleMapsReady = await waitForGoogleMaps();

        if (!isGoogleMapsReady) {
            console.warn("Google Maps not loaded");
            return null;
        }

        try {
            const geocoder = new window.google.maps.Geocoder();
            const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
                geocoder.geocode(
                    { address },
                    (results, status) => {
                        if (status === "OK" && results) {
                            resolve(results);
                        } else {
                            reject(new Error(`Geocoding failed: ${status}`));
                        }
                    }
                );
            });

            const place = result[0];
            const location = place?.geometry?.location;

            if (!location) {
                return null;
            }

            return {
                address: place.formatted_address || address,
                latitude: location.lat(),
                longitude: location.lng(),
            };
        } catch (error) {
            console.error("Address geocoding error:", error);
            return null;
        }
    }, [waitForGoogleMaps]);

    const initializeAutocomplete = useCallback(() => {
        const input = inputElementRef.current;

        if (!input || !window.google?.maps?.places || autocompleteRef.current) {
            return;
        }

        autocompleteRef.current = new window.google.maps.places.Autocomplete(
            input,
            {
                types: ["address"],
                fields: ["formatted_address", "geometry", "name"],
            }
        ) as google.maps.places.Autocomplete;

        autocompleteRef.current.addListener("place_changed", () => {
            const place = autocompleteRef.current?.getPlace();
            const location = place?.geometry?.location;

            if (location) {
                const address = place.formatted_address || place.name || inputElementRef.current?.value || "";
                const placeDetails: PlaceDetails = {
                    address,
                    latitude: location.lat(),
                    longitude: location.lng(),
                };

                if (inputElementRef.current) {
                    inputElementRef.current.value = address;
                }

                onPlaceSelectedRef.current?.(placeDetails);
            }
        });

        setIsLoaded(true);
    }, []);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            if (!GOOGLE_MAPS_API_KEY) {
                console.warn("VITE_GOOGLE_MAPS_API_KEY is not configured.");
                return;
            }

            try {
                await ensureGoogleMapsScript();
                const ready = await waitForPlacesLibrary();
                if (!cancelled) {
                    setPlacesReady(ready);
                    if (!ready) {
                        console.error("Google Places library failed to load");
                    }
                }
            } catch (error) {
                console.error("Failed to load Google Maps API:", error);
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (inputElement && placesReady) {
            initializeAutocomplete();
        }
    }, [inputElement, placesReady, initializeAutocomplete]);

    useEffect(() => () => clearAutocomplete(), [clearAutocomplete]);

    return {
        inputRef,
        isLoaded,
        geocodeAddress,
        reverseGeocode,
    };
};
