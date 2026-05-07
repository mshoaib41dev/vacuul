import { FirestoreError, Timestamp } from "firebase/firestore";

interface Pricing {
    id: string;
    name: string;
    price: number;
    savings: number;
    sessions: number;
    currency: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

interface UsePricing {
    prices: Pricing[];
    loading: boolean;
    error: FirestoreError | null;
    count: number | null;
    countLoading: boolean;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    getPricing: (pricingId: string) => Promise<Pricing | null>;
    createPricing: (pricing: Omit<Pricing, "id" | "createdAt" | "updatedAt">) => Promise<any>;
    updatePricing: (pricingId: string, pricing: Omit<Partial<Pricing>, "id" | "createdAt" | "updatedAt">) => Promise<void>;
    deletePricing: (pricingId: string) => Promise<void>;
    // Algolia search functionality
    searchResults: Pricing[];
    searchLoading: boolean;
    searchError: string | null;
    searchTotalHits: number;
    searchPricing: (query: string) => Promise<void>;
    clearSearch: () => void;
}

export type { Pricing, UsePricing };
