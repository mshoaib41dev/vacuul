type PricingTimestamp = unknown;

interface Pricing {
    id: string;
    name: string;
    price: number;
    savings: number;
    sessions: number;
    currency: string;
    createdAt?: PricingTimestamp;
    updatedAt?: PricingTimestamp;
}

interface UsePricing {
    prices: Pricing[];
    loading: boolean;
    error: Error | null;
    count: number | null;
    countLoading: boolean;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    getPricing: (pricingId: string) => Promise<Pricing | null>;
    createPricing: (pricing: Omit<Pricing, "id" | "createdAt" | "updatedAt">) => Promise<Pricing>;
    updatePricing: (pricingId: string, pricing: Omit<Partial<Pricing>, "id" | "createdAt" | "updatedAt">) => Promise<void>;
    deletePricing: (pricingId: string) => Promise<void>;
    // Search functionality
    searchResults: Pricing[];
    searchLoading: boolean;
    searchError: string | null;
    searchTotalHits: number;
    searchPricing: (query: string) => Promise<void>;
    clearSearch: () => void;
}

export type { Pricing, UsePricing };
