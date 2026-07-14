import { FirebaseError } from "firebase/app";
import { Timestamp } from "firebase/firestore";

interface ContactResponses {
    id: string;
    uid: string;
    email: string;
    message: string;
    name: string;
    createdAt: Timestamp;
}

interface UseContactResponses {
    responses: ContactResponses[];
    loading: boolean;
    error: FirebaseError | null;
    count: number | null;
    countLoading: boolean;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    updateContactResponse: (contactResponseId: string, contactResponse: Omit<Partial<ContactResponses>, "id" | "createdAt">) => Promise<void>;
    deleteContactResponse: (contactResponseId: string) => Promise<void>;

    // Algolia search functionality
    searchResults: ContactResponses[];
    searchLoading: boolean;
    searchError: string | null;
    searchTotalHits: number;
    searchContactResponses: (query: string) => Promise<void>;
    clearSearch: () => void;
}

export type { ContactResponses, UseContactResponses };
