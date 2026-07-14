import { kDebugMode } from "@/config";
import useAlgoliaSearch from "@/hooks/use-algolia-search";
import useFirestoreCollection from "@/hooks/use-firestore-collection";
import { Pricing, UsePricing } from "@/types/pricing";

const PRICING_COLLECTION = "pricing";
const PRICING_INDEX = "pricing";

export function usePricing(options?: any): UsePricing {
    const {
        docs,
        loading,
        error,
        count,
        countLoading,
        totalPages,
        currentPage,
        hasNextPage,
        hasPreviousPage,
        getDocument,
        addDocument,
        updateDocument,
        deleteDocument,
    } = useFirestoreCollection<Pricing>(PRICING_COLLECTION, {
        orderByField: "createdAt",
        orderByDirection: "desc",
        limit: 10,
        getCount: true,
        ...options,
    });

    const { searchResults, loading: searchLoading, error: searchError, totalHits: searchTotalHits, search, clearSearch } = useAlgoliaSearch<Pricing>();

    // Get specific pricing
    const getPricing = async (pricingId: string): Promise<Pricing | null> => {
        try {
            return await getDocument(pricingId);
        } catch (error) {
            if (kDebugMode) {
                console.error("Error getting pricing:", error);
            }
            throw error;
        }
    };

    // Create pricing
    const createPricing = async (pricingData: Omit<Pricing, "id" | "createdAt" | "updatedAt">) => {
        try {
            const result = await addDocument({
                ...pricingData,
            } as Pricing);
            if (kDebugMode) {
                console.log("Pricing created successfully:", result);
            }
            return result;
        } catch (error) {
            if (kDebugMode) {
                console.error("Error creating pricing:", error);
            }
            throw error;
        }
    };

    // Update pricing
    const updatePricing = async (pricingId: string, pricingData: Omit<Partial<Pricing>, "id" | "createdAt" | "updatedAt">): Promise<void> => {
        try {
            await updateDocument(pricingId, pricingData);
            if (kDebugMode) {
                console.log("Pricing updated successfully:", pricingId);
            }
        } catch (error) {
            if (kDebugMode) {
                console.error("Error updating pricing:", error);
            }
            throw error;
        }
    };

    // Delete pricing
    const deletePricing = async (pricingId: string): Promise<void> => {
        try {
            await deleteDocument(pricingId);
            if (kDebugMode) {
                console.log("Pricing deleted successfully:", pricingId);
            }
        } catch (error) {
            if (kDebugMode) {
                console.error("Error deleting pricing:", error);
            }
            throw error;
        }
    };

    // Search pricing using Algolia
    const searchPricing = async (query: string): Promise<void> => {
        try {
            await search(query, PRICING_INDEX, {
                attributesToRetrieve: ["name", "price", "savings", "sessions", "currency", "createdAt", "updatedAt"],
                hitsPerPage: 20,
            });
            if (kDebugMode) {
                console.log("Search completed for query:", query);
            }
        } catch (error) {
            if (kDebugMode) {
                console.error("Error searching pricing:", error);
            }
            throw error;
        }
    };

    return {
        prices: docs,
        loading,
        error,
        count,
        countLoading,
        totalPages,
        currentPage,
        hasNextPage,
        hasPreviousPage,
        getPricing,
        createPricing,
        updatePricing,
        deletePricing,
        searchResults,
        searchLoading,
        searchError,
        searchTotalHits,
        searchPricing,
        clearSearch,
    };
}
