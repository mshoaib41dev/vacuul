# Search Integration

## Overview

The application uses Algolia for full-text search across multiple collections. Search results are returned instantly with typo tolerance and relevance ranking.

## Algolia Configuration

### Client Setup

```typescript
// Search client initialization
import algoliasearch from "algoliasearch";

const client = algoliasearch(
    import.meta.env.VITE_ALGOLIA_APP_ID,
    import.meta.env.VITE_ALGOLIA_SEARCH_API_KEY
);
```

### Environment Variables

```bash
VITE_ALGOLIA_APP_ID=your_app_id
VITE_ALGOLIA_SEARCH_API_KEY=your_search_only_key
```

**Note:** Use a search-only API key in the frontend. Never expose admin keys.

## Indexed Collections

| Index Name | Searchable Attributes | Description |
|------------|----------------------|-------------|
| `users` | displayName, email | User search |
| `machines` | name, address, commissionId | Machine search |
| `bookings` | machineName, userId | Booking search |
| `content` | name | Content search |
| `pricing` | name | Pricing plan search |
| `gift_cards` | code | Gift card lookup |
| `system_logs` | machineId, error.message | Log search |
| `firmware_packages` | fileName, upstreamVersion | Firmware search |

## useAlgoliaSearch Hook

### Interface

```typescript
interface UseAlgoliaSearchOptions<T> {
    indexName: string;
    hitsPerPage?: number;   // Default: 20
}

interface UseAlgoliaSearchReturn<T> {
    // Actions
    search: (query: string) => Promise<void>;
    nextPage: () => void;
    previousPage: () => void;
    goToPage: (page: number) => void;
    reset: () => void;

    // State
    results: T[];
    isSearching: boolean;
    query: string;

    // Pagination
    totalHits: number;
    page: number;
    totalPages: number;
}
```

### Basic Usage

```typescript
import { useAlgoliaSearch } from "@/hooks/use-algolia-search";
import { User } from "@/types/user";

function UserSearch() {
    const {
        search,
        results,
        isSearching,
        totalHits
    } = useAlgoliaSearch<User>({
        indexName: "users",
        hitsPerPage: 20
    });

    return (
        <div>
            <input
                type="search"
                placeholder="Search users..."
                onChange={(e) => search(e.target.value)}
            />

            {isSearching ? (
                <LoadingSpinner />
            ) : (
                <div>
                    <p>{totalHits} users found</p>
                    <UserList users={results} />
                </div>
            )}
        </div>
    );
}
```

## Search Implementation Patterns

### Search Mode Toggle

Components typically support both list and search modes:

```typescript
function UsersPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchMode, setIsSearchMode] = useState(false);

    // Regular data fetching
    const {
        items: users,
        isLoading,
        loadMore,
        hasMore
    } = useUsers();

    // Search
    const {
        search,
        results: searchResults,
        isSearching,
        totalHits
    } = useAlgoliaSearch<User>({
        indexName: "users"
    });

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.trim()) {
            setIsSearchMode(true);
            search(query);
        } else {
            setIsSearchMode(false);
        }
    };

    // Display data based on mode
    const displayedUsers = isSearchMode ? searchResults : users;
    const loading = isSearchMode ? isSearching : isLoading;

    return (
        <div>
            <SearchInput
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search by name or email..."
            />

            <Table
                data={displayedUsers}
                isLoading={loading}
                columns={columns}
            />

            {isSearchMode ? (
                <p>{totalHits} results</p>
            ) : (
                hasMore && <Button onClick={loadMore}>Load More</Button>
            )}
        </div>
    );
}
```

### Debounced Search

For better performance, debounce search queries:

```typescript
import { useDebouncedCallback } from "@/hooks/use-debounce";

function SearchComponent() {
    const { search } = useAlgoliaSearch<User>({ indexName: "users" });

    const debouncedSearch = useDebouncedCallback(
        (query: string) => search(query),
        300 // 300ms delay
    );

    return (
        <input
            type="search"
            onChange={(e) => debouncedSearch(e.target.value)}
        />
    );
}
```

### Paginated Search Results

```typescript
function PaginatedSearch() {
    const {
        search,
        results,
        page,
        totalPages,
        nextPage,
        previousPage,
        goToPage
    } = useAlgoliaSearch<Machine>({
        indexName: "machines",
        hitsPerPage: 10
    });

    return (
        <div>
            <input onChange={(e) => search(e.target.value)} />

            <MachineGrid machines={results} />

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                onNext={nextPage}
                onPrevious={previousPage}
                onPageSelect={goToPage}
            />
        </div>
    );
}
```

## Search Result Highlighting

Algolia returns highlighted matches that can be displayed:

```typescript
interface AlgoliaHit<T> extends T {
    _highlightResult?: {
        [key: string]: {
            value: string;
            matchLevel: "none" | "partial" | "full";
        };
    };
}

function SearchResult({ hit }: { hit: AlgoliaHit<User> }) {
    const highlightedName = hit._highlightResult?.displayName?.value;

    return (
        <div>
            {highlightedName ? (
                <span dangerouslySetInnerHTML={{ __html: highlightedName }} />
            ) : (
                hit.displayName
            )}
        </div>
    );
}
```

## Filtering Search Results

### With Facet Filters

```typescript
const index = client.initIndex("machines");

async function searchMachines(query: string, status?: "online" | "offline") {
    const filters = status ? `status:${status}` : "";

    const results = await index.search(query, {
        filters,
        hitsPerPage: 20
    });

    return results.hits;
}
```

### With Numeric Filters

```typescript
async function searchBookings(query: string, dateRange: { start: Date; end: Date }) {
    const filters = `startTime >= ${dateRange.start.getTime()} AND startTime <= ${dateRange.end.getTime()}`;

    const results = await index.search(query, {
        filters
    });

    return results.hits;
}
```

## Best Practices

### 1. Use Search-Only Keys

Never expose admin API keys in the frontend:

```typescript
// GOOD - Search-only key
VITE_ALGOLIA_SEARCH_API_KEY=abc123searchonly

// BAD - Admin key (never do this)
VITE_ALGOLIA_ADMIN_KEY=abc123admin
```

### 2. Handle Empty Queries

Clear results when query is empty:

```typescript
const handleSearch = (query: string) => {
    if (!query.trim()) {
        reset(); // Clear results
        return;
    }
    search(query);
};
```

### 3. Show Loading States

Always indicate when search is in progress:

```typescript
{isSearching ? (
    <LoadingSpinner />
) : results.length === 0 ? (
    <EmptyState message="No results found" />
) : (
    <ResultsList results={results} />
)}
```

### 4. Debounce User Input

Avoid excessive API calls:

```typescript
const debouncedSearch = useDebouncedCallback(search, 300);
```

### 5. Clear Search on Navigation

Reset search state when leaving the page:

```typescript
useEffect(() => {
    return () => reset();
}, []);
```

## Indexing (Backend)

Search indexes are maintained by Firebase Cloud Functions that sync Firestore data to Algolia:

```typescript
// Example Cloud Function (backend)
exports.onUserCreated = functions.firestore
    .document("users/{userId}")
    .onCreate(async (snap, context) => {
        const user = snap.data();
        await index.saveObject({
            objectID: context.params.userId,
            ...user
        });
    });

exports.onUserUpdated = functions.firestore
    .document("users/{userId}")
    .onUpdate(async (change, context) => {
        const user = change.after.data();
        await index.partialUpdateObject({
            objectID: context.params.userId,
            ...user
        });
    });

exports.onUserDeleted = functions.firestore
    .document("users/{userId}")
    .onDelete(async (snap, context) => {
        await index.deleteObject(context.params.userId);
    });
```
