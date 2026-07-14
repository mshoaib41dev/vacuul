# Components & Hooks

## Custom Hooks

### useFirestoreCollection

A generic hook for Firestore collection operations with pagination.

```typescript
interface UseFirestoreCollectionOptions<T> {
    collectionName: string;
    pageSize?: number;
    orderByField?: string;
    orderDirection?: "asc" | "desc";
    filters?: QueryConstraint[];
}

interface UseFirestoreCollectionReturn<T> {
    items: T[];
    isLoading: boolean;
    error: Error | null;
    hasMore: boolean;

    // CRUD operations
    getItem: (id: string) => Promise<T | null>;
    createItem: (data: Omit<T, "id">) => Promise<string>;
    updateItem: (id: string, data: Partial<T>) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;

    // Pagination
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
}
```

**Usage:**
```typescript
import { useFirestoreCollection } from "@/hooks/use-firestore-collection";
import { Machine } from "@/types/machine";

function MachinesPage() {
    const {
        items: machines,
        isLoading,
        error,
        createItem,
        updateItem,
        deleteItem,
        loadMore,
        hasMore
    } = useFirestoreCollection<Machine>({
        collectionName: "machines",
        pageSize: 20,
        orderByField: "createdAt",
        orderDirection: "desc"
    });

    if (isLoading) return <LoadingSpinner />;
    if (error) return <ErrorMessage error={error} />;

    return (
        <div>
            <MachineTable machines={machines} />
            {hasMore && <Button onClick={loadMore}>Load More</Button>}
        </div>
    );
}
```

---

### Collection-Specific Hooks

Each collection has a dedicated hook that extends `useFirestoreCollection`:

#### useUsers

```typescript
const {
    users,
    isLoading,
    createUser,
    updateUser,
    deleteUser,
    getUserById,
    loadMore,
    hasMore
} = useUsers();
```

#### useMachines

```typescript
const {
    machines,
    isLoading,
    registerMachine,
    updateMachine,
    deleteMachine,
    getMachineById,
    loadMore,
    hasMore
} = useMachines();
```

#### useBookings

```typescript
const {
    bookings,
    isLoading,
    updateBooking,
    getBookingById,
    loadMore,
    hasMore
} = useBookings();
```

#### useRoles

```typescript
const {
    roles,
    isLoading,
    createRole,
    updateRole,
    deleteRole,
    getRoleById
} = useRoles();
```

#### usePricing

```typescript
const {
    pricing,
    isLoading,
    createPricing,
    updatePricing,
    deletePricing
} = usePricing();
```

#### useGiftCards

```typescript
const {
    giftCards,
    isLoading,
    createGiftCard,
    updateGiftCard,
    deleteGiftCard
} = useGiftCards();
```

#### useContent

```typescript
const {
    content,
    isLoading,
    uploadContent,
    updateContent,
    deleteContent
} = useContent();
```

#### useFirmwareUpdate

```typescript
const {
    firmwareUpdates,
    isLoading,
    uploadFirmware,
    deleteFirmware
} = useFirmwareUpdate();
```

#### useSessionSettings

```typescript
const {
    sessionSettings,
    isLoading,
    createSetting,
    updateSetting,
    deleteSetting
} = useSessionSettings();
```

#### useSystemLogs

```typescript
const {
    logs,
    isLoading,
    loadMore,
    hasMore
} = useSystemLogs();
```

#### useContactResponses

```typescript
const {
    responses,
    isLoading,
    deleteResponse
} = useContactResponses();
```

---

### useFirebaseStorage

Hook for file uploads with progress tracking.

```typescript
interface UseFirebaseStorageReturn {
    uploadFile: (file: File, path: string) => Promise<string>;
    uploadProgress: number;
    isUploading: boolean;
    error: Error | null;
}
```

**Usage:**
```typescript
import { useFirebaseStorage } from "@/hooks/use-firebase-storage";

function FileUploader() {
    const { uploadFile, uploadProgress, isUploading, error } = useFirebaseStorage();

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const url = await uploadFile(file, `content/${Date.now()}_${file.name}`);
            console.log("Uploaded to:", url);
        } catch (err) {
            console.error("Upload failed:", err);
        }
    };

    return (
        <div>
            <input
                type="file"
                onChange={handleFileSelect}
                disabled={isUploading}
            />
            {isUploading && (
                <ProgressBar value={uploadProgress} max={100} />
            )}
            {error && <ErrorMessage>{error.message}</ErrorMessage>}
        </div>
    );
}
```

---

### useAlgoliaSearch

Hook for Algolia full-text search.

```typescript
interface UseAlgoliaSearchOptions<T> {
    indexName: string;
    hitsPerPage?: number;
}

interface UseAlgoliaSearchReturn<T> {
    search: (query: string) => Promise<void>;
    results: T[];
    isSearching: boolean;
    totalHits: number;
    page: number;
    totalPages: number;
    nextPage: () => void;
    previousPage: () => void;
    goToPage: (page: number) => void;
}
```

**Usage:**
```typescript
import { useAlgoliaSearch } from "@/hooks/use-algolia-search";
import { User } from "@/types/user";

function UserSearch() {
    const [query, setQuery] = useState("");
    const {
        search,
        results,
        isSearching,
        totalHits,
        page,
        totalPages,
        nextPage,
        previousPage
    } = useAlgoliaSearch<User>({
        indexName: "users",
        hitsPerPage: 20
    });

    useEffect(() => {
        if (query) {
            search(query);
        }
    }, [query]);

    return (
        <div>
            <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users..."
            />

            {isSearching ? (
                <LoadingSpinner />
            ) : (
                <>
                    <p>Found {totalHits} results</p>
                    <UserList users={results} />
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onNext={nextPage}
                        onPrevious={previousPage}
                    />
                </>
            )}
        </div>
    );
}
```

---

### useGooglePlaces

Hook for Google Places autocomplete.

```typescript
interface UseGooglePlacesReturn {
    predictions: PlacePrediction[];
    search: (query: string) => void;
    selectPlace: (placeId: string) => Promise<PlaceDetails>;
    isLoading: boolean;
}

interface PlaceDetails {
    address: string;
    lat: number;
    lng: number;
}
```

**Usage:**
```typescript
import { useGooglePlaces } from "@/hooks/use-google-places";

function AddressInput({ onSelect }) {
    const { predictions, search, selectPlace, isLoading } = useGooglePlaces();

    const handleSelect = async (placeId: string) => {
        const details = await selectPlace(placeId);
        onSelect(details);
    };

    return (
        <div>
            <input
                onChange={(e) => search(e.target.value)}
                placeholder="Enter address..."
            />
            {predictions.length > 0 && (
                <ul>
                    {predictions.map((p) => (
                        <li
                            key={p.place_id}
                            onClick={() => handleSelect(p.place_id)}
                        >
                            {p.description}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
```

---

### useClipboard

Hook for clipboard operations.

```typescript
interface UseClipboardReturn {
    copy: (text: string) => Promise<void>;
    copied: boolean;
}
```

**Usage:**
```typescript
import { useClipboard } from "@/hooks/use-clipboard";

function CopyButton({ text }) {
    const { copy, copied } = useClipboard();

    return (
        <button onClick={() => copy(text)}>
            {copied ? "Copied!" : "Copy"}
        </button>
    );
}
```

---

### useBreakpoint

Hook for responsive design.

```typescript
type Breakpoint = "sm" | "md" | "lg" | "xl" | "2xl";

interface UseBreakpointReturn {
    breakpoint: Breakpoint;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
}
```

**Usage:**
```typescript
import { useBreakpoint } from "@/hooks/use-breakpoint";

function ResponsiveComponent() {
    const { isMobile, isDesktop } = useBreakpoint();

    return (
        <div>
            {isMobile ? <MobileView /> : <DesktopView />}
        </div>
    );
}
```

---

## Base Components

### Button

```typescript
interface ButtonProps {
    variant?: "primary" | "secondary" | "tertiary" | "destructive";
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    iconPosition?: "left" | "right";
    onClick?: () => void;
    children: React.ReactNode;
}
```

**Usage:**
```typescript
<Button variant="primary" size="md" onClick={handleClick}>
    Save Changes
</Button>

<Button variant="destructive" loading={isDeleting}>
    Delete
</Button>

<Button icon={<PlusIcon />} iconPosition="left">
    Add Item
</Button>
```

### Input

```typescript
interface InputProps {
    type?: "text" | "email" | "password" | "number";
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    error?: string;
    disabled?: boolean;
    icon?: React.ReactNode;
}
```

**Usage:**
```typescript
<Input
    type="email"
    placeholder="Enter email"
    value={email}
    onChange={setEmail}
    error={errors.email}
/>
```

### Select

```typescript
interface SelectProps {
    options: { value: string; label: string }[];
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}
```

**Usage:**
```typescript
<Select
    options={[
        { value: "online", label: "Online" },
        { value: "offline", label: "Offline" }
    ]}
    value={status}
    onChange={setStatus}
    placeholder="Select status"
/>
```

### Toggle

```typescript
interface ToggleProps {
    checked?: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
    label?: string;
}
```

**Usage:**
```typescript
<Toggle
    checked={isEnabled}
    onChange={setIsEnabled}
    label="Enable notifications"
/>
```

---

## Application Components

### Table

```typescript
interface TableProps<T> {
    columns: Column<T>[];
    data: T[];
    isLoading?: boolean;
    onRowClick?: (row: T) => void;
    selectedRows?: string[];
    onSelectRows?: (ids: string[]) => void;
}

interface Column<T> {
    key: string;
    header: string;
    render?: (row: T) => React.ReactNode;
    sortable?: boolean;
    width?: string;
}
```

**Usage:**
```typescript
const columns: Column<User>[] = [
    {
        key: "displayName",
        header: "Name",
        render: (user) => (
            <div className="flex items-center gap-2">
                <Avatar src={user.photoURL} />
                {user.displayName}
            </div>
        )
    },
    { key: "email", header: "Email" },
    {
        key: "status",
        header: "Status",
        render: (user) => (
            <Badge variant={user.disabled ? "error" : "success"}>
                {user.disabled ? "Disabled" : "Active"}
            </Badge>
        )
    }
];

<Table columns={columns} data={users} isLoading={isLoading} />
```

### Pagination

```typescript
interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    showPageNumbers?: boolean;
}
```

**Usage:**
```typescript
<Pagination
    page={currentPage}
    totalPages={10}
    onPageChange={setCurrentPage}
/>
```

### Modal

```typescript
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    size?: "sm" | "md" | "lg" | "xl";
    children: React.ReactNode;
}
```

**Usage:**
```typescript
<Modal
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    title="Edit User"
    size="md"
>
    <UserForm user={selectedUser} onSubmit={handleSubmit} />
</Modal>
```

### DeleteConfirmModal

```typescript
interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    isLoading?: boolean;
}
```

**Usage:**
```typescript
<DeleteConfirmModal
    isOpen={showDeleteModal}
    onClose={() => setShowDeleteModal(false)}
    onConfirm={handleDelete}
    title="Delete User"
    message="Are you sure you want to delete this user? This action cannot be undone."
    isLoading={isDeleting}
/>
```

### FileUpload

```typescript
interface FileUploadProps {
    accept?: string;
    maxSize?: number;
    onUpload: (file: File) => void;
    isUploading?: boolean;
    progress?: number;
}
```

**Usage:**
```typescript
<FileUpload
    accept="video/*"
    maxSize={100 * 1024 * 1024} // 100MB
    onUpload={handleUpload}
    isUploading={isUploading}
    progress={uploadProgress}
/>
```

### DatePicker

```typescript
interface DatePickerProps {
    value?: Date;
    onChange?: (date: Date) => void;
    minDate?: Date;
    maxDate?: Date;
    disabled?: boolean;
}
```

**Usage:**
```typescript
<DatePicker
    value={startDate}
    onChange={setStartDate}
    minDate={new Date()}
/>
```
