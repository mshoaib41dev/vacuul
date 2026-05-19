import { httpsCallable } from "firebase/functions";
import { AUTH, FUNCTION, USE_FIREBASE_EMULATORS, kDebugMode } from "@/config";
// Import Algolia search hook
import useAlgoliaSearch from "@/hooks/use-algolia-search";
// Import the generic hook
import useFirestoreCollection, { FirestoreQueryConstraints } from "@/hooks/use-firestore-collection";
// Import the GiftCard type
import type { UseGiftCard, GiftCard } from "@/types/gift-card";

// Define the specific collection path
const GIFT_CARDS_COLLECTION = "gift_cards";
// Define the Algolia index name
const GIFT_CARDS_INDEX = "gift_cards";
const FUNCTIONS_REGION = "europe-west6";

interface UseGiftCardOptions extends FirestoreQueryConstraints {
    // Add any gift card-specific options here if needed
}

/**
 * Custom Hook specifically for managing CRUD operations for the 'gift_cards'
 * Firestore collection with real-time updates and pagination support.
 *
 * This hook uses useFirestoreCollection.
 *
 * @param options - Query options including pagination parameters
 * @returns {UseGiftCard} An object containing gift card state and functions.
 */
const useGiftCard = (options?: UseGiftCardOptions): UseGiftCard => {
    // Call the generic hook with the specific type (GiftCard) and collection path
    const { docs, loading, error, count, countLoading, totalPages, currentPage, hasNextPage, hasPreviousPage, getDocument, deleteDocument } =
        useFirestoreCollection<GiftCard>(GIFT_CARDS_COLLECTION, {
            orderByField: "purchaseDate",
            orderByDirection: "desc",
            getCount: true,
            ...options,
        });

    // Initialize Algolia search hook
    const { searchResults, loading: searchLoading, error: searchError, totalHits: searchTotalHits, search, clearSearch } = useAlgoliaSearch<GiftCard>();

    const getGiftCard = async (code: string): Promise<GiftCard | null> => {
        try {
            const doc = await getDocument(code);
            return doc as GiftCard | null;
        } catch (err) {
            if (kDebugMode) {
                console.error("[useGiftCard] Error getting gift card:", err);
            }
            throw err;
        }
    };

    // Create a new gift card using cloud function
    const createGiftCard = async (sessions: number): Promise<GiftCard | null> => {
        try {
            const user = AUTH.currentUser;
            if (!user) {
                throw new Error("No authenticated Firebase user. Please sign in again.");
            }

            const idToken = await user.getIdToken(true);
            if (!idToken) {
                throw new Error("Unable to get Firebase ID token. Please sign in again.");
            }

            if (kDebugMode) {
                console.info("[useGiftCard] createGiftCard auth context:", {
                    uid: user.uid,
                    tokenLength: idToken.length,
                    useEmulator: USE_FIREBASE_EMULATORS,
                });
            }

            if (USE_FIREBASE_EMULATORS) {
                const functionsEmulatorHost =
                    (import.meta.env.VITE_FIREBASE_FUNCTIONS_EMULATOR_HOST as string | undefined) ??
                    "127.0.0.1";
                const functionsEmulatorPort =
                    (import.meta.env.VITE_FIREBASE_FUNCTIONS_EMULATOR_PORT as string | undefined) ??
                    "5002";
                const projectId = AUTH.app.options.projectId;

                if (!projectId) {
                    throw new Error("Firebase project ID is missing.");
                }

                const response = await fetch(
                    `http://${functionsEmulatorHost}:${functionsEmulatorPort}/${projectId}/${FUNCTIONS_REGION}/createGiftCard`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${idToken}`,
                        },
                        body: JSON.stringify({ data: { sessions } }),
                    },
                );
                const payload = await response.json();

                if (!response.ok || payload.error) {
                    throw new Error(payload.error?.message || "Failed to create gift card.");
                }

                return payload.result as GiftCard | null;
            }

            // use firebase cloud function to create gift card
            const create = httpsCallable(FUNCTION, "createGiftCard");

            const result = await create({
                sessions: sessions,
            });

            return result.data as GiftCard | null;
        } catch (err) {
            if (kDebugMode) {
                console.error("[useGiftCard] Error creating gift card:", err);
            }
            throw err;
        }
    };

    // Delete a gift card
    const deleteGiftCard = async (code: string): Promise<void> => {
        try {
            await deleteDocument(code);
        } catch (err) {
            if (kDebugMode) {
                console.error("[useGiftCard] Error deleting gift card:", err);
            }
            throw err;
        }
    };

    // Search gift cards using Algolia
    const searchGiftCards = async (query: string): Promise<void> => {
        try {
            await search(query, GIFT_CARDS_INDEX, {
                attributesToRetrieve: ["objectID", "code", "amount", "currency", "sessions", "used", "purchasedBy", "purchaseDate", "usedBy", "usedDate"],
                hitsPerPage: 20,
            });
        } catch (err) {
            if (kDebugMode) {
                console.error("[useGiftCard] Error searching gift cards:", err);
            }
            throw err;
        }
    };

    return {
        giftCards: docs,
        loading: loading,
        error,
        count,
        countLoading,
        totalPages,
        currentPage,
        hasNextPage,
        hasPreviousPage,
        getGiftCard,
        createGiftCard,
        deleteGiftCard,
        // Algolia search functionality
        searchResults,
        searchLoading,
        searchError,
        searchTotalHits,
        searchGiftCards,
        clearSearch,
    };
};

export default useGiftCard;
