# Architecture

## Application Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         React Application                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Contexts  │  │   Providers │  │        Guards           │  │
│  │  AuthContext│  │ThemeProvider│  │ AuthGuard / GuestGuard  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      Custom Hooks                            ││
│  │  useAuth | useUsers | useMachines | useBookings | useRoles  ││
│  │  usePricing | useGiftCards | useContent | useFirmwareUpdate ││
│  │  useFirestoreCollection | useFirebaseStorage | useAlgolia   ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │      Pages       │  │    Layouts       │  │  Components   │  │
│  │ Users, Machines, │  │ SidebarLayout,   │  │ Base, App,    │  │
│  │ Bookings, etc.   │  │ AuthLayout       │  │ Foundations   │  │
│  └──────────────────┘  └──────────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Firebase Services                           │
├────────────────┬────────────────┬────────────────┬──────────────┤
│ Authentication │   Firestore    │    Storage     │  Functions   │
│  (Email/Pass)  │  (Database)    │   (Files)      │  (Backend)   │
└────────────────┴────────────────┴────────────────┴──────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      External Services                           │
├──────────────────────────────┬──────────────────────────────────┤
│         Algolia              │         Google Maps API          │
│     (Full-text Search)       │      (Location Services)         │
└──────────────────────────────┴──────────────────────────────────┘
```

## Data Flow Pattern

```
User Interaction
       │
       ▼
┌─────────────────┐
│  Page Component │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Custom Hook    │ ◄─── State Management
└────────┬────────┘      (loading, error, data)
         │
         ▼
┌─────────────────┐
│    Firestore    │ ◄─── Real-time Listeners
└────────┬────────┘
         │
         ▼
   UI Updates (React re-render)
```

## Component Architecture

### Component Hierarchy

```
App
├── RouterProvider
│   └── Routes
│       ├── GuestGuard
│       │   ├── SignIn
│       │   └── ForgotPassword
│       │
│       └── AuthGuard
│           └── SidebarLayout
│               ├── AppNavigation
│               └── Page Content
│                   ├── PageHeader
│                   ├── DataTable
│                   ├── Pagination
│                   └── Modals
```

### Component Categories

#### Base Components
Reusable UI primitives with no business logic:
- Buttons, Inputs, Selects
- Checkboxes, Radio buttons, Toggles
- Avatars, Badges, Tags
- Tooltips, Sliders, Progress indicators

#### Application Components
Complex components with domain-specific logic:
- Tables with sorting and filtering
- Modals with confirmation flows
- Navigation with permissions
- File upload with progress
- Date pickers with validation

#### Page Components
Full-page views composing base and application components:
- Handle data fetching via hooks
- Manage local UI state
- Coordinate component interactions

#### Layout Components
Structural components defining page structure:
- SidebarLayout: Main app shell with navigation
- AuthLayout: Centered auth forms

## State Management

### Context + Hooks Pattern

The application uses React Context for global state and custom hooks for data management:

```typescript
// Global state via Context
const AuthContext = createContext<AuthContextType | null>(null);

// Data management via Hooks
function useUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // ... Firestore operations
    return { users, isLoading, createUser, updateUser, deleteUser };
}
```

### State Types

| State Type | Management | Example |
|------------|------------|---------|
| Authentication | AuthContext | User session, login state |
| Theme | ThemeProvider | Dark/light mode |
| Collection Data | Custom hooks | Users, machines, bookings |
| UI State | Local useState | Modal open, form values |
| Search State | useAlgoliaSearch | Search results |

## Design Patterns

### Generic Firestore Hook Pattern

A reusable hook for Firestore collection operations:

```typescript
function useFirestoreCollection<T>({
    collectionName,
    pageSize,
    orderByField,
    orderDirection
}: Options): Return<T> {
    // Common CRUD operations
    // Pagination logic
    // Real-time listeners
}

// Specific hooks extend the generic
function useUsers() {
    return useFirestoreCollection<User>({
        collectionName: "users",
        orderByField: "createdAt"
    });
}
```

### Guard Pattern

Route protection via wrapper components:

```typescript
function AuthGuard({ children }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) return <LoadingSpinner />;
    if (!isAuthenticated) return <Navigate to="/signin" />;

    return children;
}
```

### Provider Pattern

Centralized context providers at app root:

```typescript
function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <RouterProvider router={router} />
            </AuthProvider>
        </ThemeProvider>
    );
}
```

## Performance Considerations

### Code Splitting

Pages are lazy-loaded using React Suspense:

```typescript
const Users = lazy(() => import("@/pages/users"));

// In routes
<Suspense fallback={<LoadingIndicator />}>
    <Users />
</Suspense>
```

### Firestore Pagination

Data is loaded incrementally to reduce initial load:

```typescript
const { items, loadMore, hasMore } = useFirestoreCollection({
    collectionName: "users",
    pageSize: 20
});
```

### Real-time Listeners

Firestore listeners are used for live updates, with cleanup on unmount:

```typescript
useEffect(() => {
    const unsubscribe = onSnapshot(query, (snapshot) => {
        // Update state
    });

    return () => unsubscribe();
}, []);
```

## Error Handling

### Error Boundaries

React error boundaries catch rendering errors:

```typescript
<ErrorBoundary fallback={<ErrorPage />}>
    <App />
</ErrorBoundary>
```

### Hook-Level Error Handling

Hooks expose error state for component-level handling:

```typescript
const { data, error, isLoading } = useUsers();

if (error) return <ErrorMessage error={error} />;
```

### Toast Notifications

User-facing errors are shown via toast:

```typescript
try {
    await deleteUser(id);
    toast.success("User deleted");
} catch (error) {
    toast.error("Failed to delete user");
}
```
