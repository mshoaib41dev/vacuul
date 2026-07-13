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

export const useGooglePlaces = (
    onPlaceSelected?: (place: PlaceDetails) => void
): UseGooglePlacesReturn => {
    const inputElementRef = useRef<HTMLInputElement | null>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const isLoadedRef = useRef(false);
    const onPlaceSelectedRef = useRef(onPlaceSelected);
    const [isLoaded, setIsLoaded] = useState(false);
    const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null);

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
            console.error('Error cleaning up Google Places autocomplete:', error);
        }

        autocompleteRef.current = null;
        isLoadedRef.current = false;
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
        if (window.google?.maps) {
            return true;
        }

        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 50;
            const interval = window.setInterval(() => {
                attempts += 1;

                if (window.google?.maps) {
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
    }, []);

    const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string | null> => {
        const isGoogleMapsReady = await waitForGoogleMaps();

        if (!isGoogleMapsReady) {
            console.warn('Google Maps not loaded');
            return null;
        }

        try {
            const geocoder = new window.google.maps.Geocoder();
            const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
                geocoder.geocode(
                    { location: { lat, lng } },
                    (results, status) => {
                        if (status === 'OK' && results) {
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
            console.error('Reverse geocoding error:', error);
            return null;
        }
    }, [waitForGoogleMaps]);

    const geocodeAddress = useCallback(async (address: string): Promise<PlaceDetails | null> => {
        const isGoogleMapsReady = await waitForGoogleMaps();

        if (!isGoogleMapsReady) {
            console.warn('Google Maps not loaded');
            return null;
        }

        try {
            const geocoder = new window.google.maps.Geocoder();
            const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
                geocoder.geocode(
                    { address },
                    (results, status) => {
                        if (status === 'OK' && results) {
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
            console.error('Address geocoding error:', error);
            return null;
        }
    }, [waitForGoogleMaps]);

    const initializeAutocomplete = useCallback(() => {
        const input = inputElementRef.current;

        if (input && window.google?.maps?.places && !autocompleteRef.current) {
            autocompleteRef.current = new window.google.maps.places.Autocomplete(
                input,
                {
                    types: ['address'],
                    fields: ['formatted_address', 'geometry', 'name']
                }
            ) as google.maps.places.Autocomplete;

            autocompleteRef.current?.addListener('place_changed', () => {
                const place = autocompleteRef.current?.getPlace();
                const location = place?.geometry?.location;

                if (location) {
                    const address = place.formatted_address || place.name || inputElementRef.current?.value || "";
                    const placeDetails: PlaceDetails = {
                        address,
                        latitude: location.lat(),
                        longitude: location.lng()
                    };

                    if (inputElementRef.current) {
                        inputElementRef.current.value = address;
                    }

                    onPlaceSelectedRef.current?.(placeDetails);
                }
            });


            isLoadedRef.current = true;
            setIsLoaded(true);
        }
    }, []);

    useEffect(() => {
        let checkGoogle: number | undefined;
        let isMounted = true;

        const loadGoogleMaps = () => {
            if (!GOOGLE_MAPS_API_KEY) {
                console.warn("VITE_GOOGLE_MAPS_API_KEY is not configured.");
                return;
            }

            const handleGoogleMapsReady = () => {
                if (isMounted) {
                    initializeAutocomplete();
                }
            };

            if (!window.google || !window.google.maps) {
                // Check if script is already loading
                if (document.querySelector(`script[src*="maps.googleapis.com"]`)) {
                    // Script is already loading, wait for it
                    checkGoogle = window.setInterval(() => {
                        if (window.google && window.google.maps) {
                            window.clearInterval(checkGoogle);
                            handleGoogleMapsReady();
                        }
                    }, 100);
                    return;
                }

                const script = document.createElement('script');
                const params = new URLSearchParams({
                    key: GOOGLE_MAPS_API_KEY,
                    libraries: "places",
                    loading: "async",
                });

                script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
                script.async = true;
                script.defer = true;
                script.onload = handleGoogleMapsReady;
                script.onerror = () => {
                    console.error('Failed to load Google Maps API');
                };
                document.head.appendChild(script);
            } else {
                handleGoogleMapsReady();
            }
        };

        loadGoogleMaps();

        return () => {
            isMounted = false;

            if (checkGoogle) {
                window.clearInterval(checkGoogle);
            }
        };
    }, [initializeAutocomplete]);

    useEffect(() => {
        if (inputElement) {
            initializeAutocomplete();
        }
    }, [inputElement, initializeAutocomplete]);

    useEffect(() => clearAutocomplete, [clearAutocomplete]);

    return {
        inputRef,
        isLoaded,
        geocodeAddress,
        reverseGeocode
    };
};
