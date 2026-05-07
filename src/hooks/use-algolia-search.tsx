import { useCallback, useState } from "react";
import { SearchResponse, algoliasearch } from "algoliasearch";
import { ALGOLIA_APP_ID, ALGOLIA_SEARCH_API_KEY, kDebugMode } from "@/config";

interface AlgoliaSearchOptions {
    hitsPerPage?: number;
    page?: number;
    filters?: string;
    facetFilters?: string[][];
    attributesToRetrieve?: string[];
    attributesToHighlight?: string[];
}

interface UseAlgoliaSearchReturn<T = any> {
    searchResults: T[];
    loading: boolean;
    error: string | null;
    totalHits: number;
    nbPages: number;
    currentPage: number;
    search: (query: string, indexName: string, options?: AlgoliaSearchOptions) => Promise<void>;
    clearSearch: () => void;
}

const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_API_KEY);

const useAlgoliaSearch = <T = any,>(): UseAlgoliaSearchReturn<T> => {
    const [searchResults, setSearchResults] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalHits, setTotalHits] = useState(0);
    const [nbPages, setNbPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);

    const search = useCallback(async (query: string, indexName: string, options: AlgoliaSearchOptions = {}) => {
        if (!query.trim()) {
            clearSearch();
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const searchOptions = {
                hitsPerPage: 10,
                page: 0,
                ...options,
            };

            const response: SearchResponse<T> = await client.searchSingleIndex({
                indexName,
                searchParams: {
                    query,
                    ...searchOptions,
                }
            });

            setSearchResults(response.hits);
            setTotalHits(response.nbHits ?? 0);
            setNbPages(response.nbPages ?? 0);
            setCurrentPage(response.page ?? 0);

            if (kDebugMode) {
                console.log(`[useAlgoliaSearch] Search results for "${query}" in ${indexName}:`, response);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Search failed";
            setError(errorMessage);
            setSearchResults([]);
            setTotalHits(0);
            setNbPages(0);
            setCurrentPage(0);

            if (kDebugMode) {
                console.error("[useAlgoliaSearch] Search error:", err);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const clearSearch = useCallback(() => {
        setSearchResults([]);
        setError(null);
        setTotalHits(0);
        setNbPages(0);
        setCurrentPage(0);
        setLoading(false);
    }, []);

    return {
        searchResults,
        loading,
        error,
        totalHits,
        nbPages,
        currentPage,
        search,
        clearSearch,
    };
};

export default useAlgoliaSearch;
