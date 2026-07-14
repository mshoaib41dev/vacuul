import { FirestoreError, Timestamp } from "firebase/firestore";

interface GiftCard {
    code: string;
    amount: number;
    currency: string;
    paymentId: string;
    purchaseDate: Timestamp;
    purchasedBy: string;
    sessions: number;
    used: boolean;
    usedBy?: string;
    usedDate?: Timestamp;
}

interface UseGiftCard {
    giftCards: GiftCard[];
    loading: boolean;
    error: FirestoreError | null;
    count: number | null;
    countLoading: boolean;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    getGiftCard: (code: string) => Promise<GiftCard | null>;
    createGiftCard: (sessions: number) => Promise<GiftCard | null>;
    deleteGiftCard: (code: string) => Promise<void>;
    // Algolia search functionality
    searchResults: GiftCard[];
    searchLoading: boolean;
    searchError: string | null;
    searchTotalHits: number;
    searchGiftCards: (query: string) => Promise<void>;
    clearSearch: () => void;
}

export type { GiftCard, UseGiftCard };
