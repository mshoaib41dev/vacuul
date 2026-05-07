import { httpsCallable } from "@firebase/functions";
import { FUNCTION, kDebugMode } from "@/config";
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