import { useEffect, useRef, useCallback } from "react";
import { GOOGLE_MAPS_API_KEY } from "@/config";

interface PlaceDetails {
    address: string;
    latitude: number;
    longitude: number;
}

interface UseGooglePlacesReturn {
    inputRef: React.RefObject<HTMLInputElement | null>;
    isLoaded: boolean;
    reverseGeocode: (lat: number, lng: number) => Promise<string | null>;
}

export const useGooglePlaces = (
    onPlaceSelected?: (place: PlaceDetails) => void
): UseGooglePlacesReturn => {
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const isLoadedRef = useRef(false);

    const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string | null> => {
        if (!window.google || !window.google.maps) {
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
    }, []);

    const initializeAutocomplete = useCallback(() => {
        if (inputRef.current && window.google && window.google.maps) {
            autocompleteRef.current = new window.google.maps.places.Autocomplete(
                inputRef.current,
                {
                    types: ['address'],
                    fields: ['formatted_address', 'geometry.location']
                }
            ) as google.maps.places.Autocomplete;

            autocompleteRef.current?.addListener('place_changed', () => {
                const place = autocompleteRef.current?.getPlace();
                if (place && place.geometry && place.geometry.location) {
                    const placeDetails: PlaceDetails = {
                        address: place.formatted_address || '',
                        latitude: place.geometry.location.lat(),
                        longitude: place.geometry.location.lng()
                    };
                    onPlaceSelected?.(placeDetails);
                }
            });


            isLoadedRef.current = true;
        }
    }, [onPlaceSelected]);

    useEffect(() => {
        const loadGoogleMaps = () => {
            if (!window.google || !window.google.maps) {
                // Check if script is already loading
                if (document.querySelector(`script[src*="maps.googleapis.com"]`)) {
                    // Script is already loading, wait for it
                    const checkGoogle = setInterval(() => {
                        if (window.google && window.google.maps) {
                            clearInterval(checkGoogle);
                            initializeAutocomplete();
                        }
                    }, 100);
                    return;
                }

                const script = document.createElement('script');
                script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
                script.async = true;
                script.defer = true;
                script.onload = initializeAutocomplete;
                script.onerror = () => {
                    console.error('Failed to load Google Maps API');
                };
                document.head.appendChild(script);
            } else {
                initializeAutocomplete();
            }
        };

        loadGoogleMaps();

        return () => {
            if (autocompleteRef.current) {
                // Clean up event listeners
                try {
                    window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
                } catch (error) {
                    console.error('Error cleaning up Google Places autocomplete:', error);
                }
            }
        };
    }, [initializeAutocomplete]);

    return {
        inputRef,
        isLoaded: isLoadedRef.current,
        reverseGeocode
    };
};