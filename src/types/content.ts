interface Content {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedBy: string;
    createdAt?: unknown;
    updatedAt?: unknown;
}

interface UseContent {
    contents: Content[];
    loading: boolean;
    error: Error | null;
    count: number | null;
    countLoading: boolean;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    getContent: (contentId: string) => Promise<Content | null>;
    uploadContent: (file: File, onProgress: (progress: number) => void) => Promise<Content>;
    deleteContent: (contentId: string) => Promise<void>;
    // Algolia search functionality
    searchResults: Content[];
    searchLoading: boolean;
    searchError: string | null;
    searchTotalHits: number;
    searchContents: (query: string) => Promise<void>;
    clearSearch: () => void;
}

export type { Content, UseContent };
