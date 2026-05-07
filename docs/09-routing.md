# Routing

## Route Structure

The application uses React Router v7 for client-side routing.

### Route Definitions

```typescript
// src/routes/index.tsx
import { createBrowserRouter, Navigate } from "react-router";

const router = createBrowserRouter([
    // Root redirect
    { path: "/", element: <Navigate to="/app" replace /> },

    // Guest-only routes (redirect if authenticated)
    {
        element: <GuestGuard />,
        children: [
            { path: "/signin", element: <SignIn /> },
            { path: "/forgot-password", element: <ForgotPassword /> },
        ]
    },

    // Protected routes (require authentication)
    {
        element: <AuthGuard />,
        children: [
            {
                path: "/app",
                element: <SidebarLayout />,
                children: [
                    // Account
                    { path: "account", element: <Account /> },

                    // User Management
                    { path: "users", element: <Users /> },
                    { path: "users/create", element: <CreateUser /> },
                    { path: "users/edit/:id", element: <EditUser /> },
                    { path: "roles", element: <Roles /> },

                    // Machine Management
                    { path: "machines", element: <Machines /> },
                    { path: "machines/register", element: <RegisterMachine /> },
                    { path: "machines/edit/:id", element: <EditMachine /> },
                    { path: "session-settings", element: <SessionSettings /> },
                    { path: "dfu", element: <FirmwareUpdates /> },

                    // Session Management
                    { path: "session-management/booking-history", element: <BookingHistory /> },
                    { path: "pricing", element: <Pricing /> },
                    { path: "gift-cards", element: <GiftCards /> },

                    // Content
                    { path: "content", element: <Contents /> },

                    // System
                    { path: "system-logs", element: <SystemLogs /> },
                    { path: "contact-responses", element: <ContactResponses /> },
                ]
            }
        ]
    },

    // Error pages
    { path: "/403", element: <PermissionDenied /> },
    { path: "/404", element: <NotFound /> },
    { path: "*", element: <Navigate to="/404" replace /> },
]);
```

## Route Table

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/` | Redirect | - | Redirects to `/app` |
| `/signin` | SignIn | Guest | Login page |
| `/forgot-password` | ForgotPassword | Guest | Password reset request |
| `/app` | SidebarLayout | Auth | Main app shell |
| `/app/account` | Account | Auth | User account settings |
| `/app/users` | Users | Auth | User list |
| `/app/users/create` | CreateUser | Auth | Create new user |
| `/app/users/edit/:id` | EditUser | Auth | Edit user |
| `/app/roles` | Roles | Auth | Role management |
| `/app/machines` | Machines | Auth | Machine list |
| `/app/machines/register` | RegisterMachine | Auth | Register machine |
| `/app/machines/edit/:id` | EditMachine | Auth | Edit machine |
| `/app/session-settings` | SessionSettings | Auth | Session config |
| `/app/dfu` | FirmwareUpdates | Auth | Firmware updates |
| `/app/session-management/booking-history` | BookingHistory | Auth | Booking history |
| `/app/pricing` | Pricing | Auth | Pricing plans |
| `/app/gift-cards` | GiftCards | Auth | Gift cards |
| `/app/content` | Contents | Auth | Content library |
| `/app/system-logs` | SystemLogs | Auth | System logs |
| `/app/contact-responses` | ContactResponses | Auth | Contact form |
| `/403` | PermissionDenied | Auth | Access denied |
| `/404` | NotFound | - | Page not found |

## Navigation Structure

The sidebar navigation is organized into logical sections:

```
User Management
├── Users           → /app/users
└── Roles           → /app/roles

Machine Management
├── Machines        → /app/machines
├── Session Settings → /app/session-settings
└── Firmware Updates → /app/dfu

Session Management
├── Booking History → /app/session-management/booking-history
├── Pricing         → /app/pricing
└── Gift Cards      → /app/gift-cards

Content Management
└── Content & Ads   → /app/content

System
├── System Logs     → /app/system-logs
└── Contact Responses → /app/contact-responses
```

## Route Parameters

### Dynamic Routes

Routes with `:id` parameter:

```typescript
// Edit user
"/app/users/edit/:id"

// Edit machine
"/app/machines/edit/:id"
```

**Accessing Parameters:**
```typescript
import { useParams } from "react-router";

function EditUser() {
    const { id } = useParams<{ id: string }>();

    // Fetch user by id
    const { user, isLoading } = useUser(id);

    return <UserForm user={user} />;
}
```

## Navigation

### Programmatic Navigation

```typescript
import { useNavigate } from "react-router";

function UserActions() {
    const navigate = useNavigate();

    const handleEdit = (userId: string) => {
        navigate(`/app/users/edit/${userId}`);
    };

    const handleBack = () => {
        navigate(-1); // Go back
    };

    const handleCreate = () => {
        navigate("/app/users/create");
    };

    return (
        <div>
            <Button onClick={handleCreate}>Create User</Button>
        </div>
    );
}
```

### Link Component

```typescript
import { Link } from "react-router";

function UserRow({ user }) {
    return (
        <tr>
            <td>
                <Link to={`/app/users/edit/${user.id}`}>
                    {user.displayName}
                </Link>
            </td>
        </tr>
    );
}
```

## Layouts

### SidebarLayout

The main application layout with sidebar navigation:

```typescript
function SidebarLayout() {
    return (
        <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
}
```

### AuthLayout

Layout for authentication pages:

```typescript
function AuthLayout() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="max-w-md w-full">
                <Outlet />
            </div>
        </div>
    );
}
```

## Code Splitting

Pages are lazy-loaded for better performance:

```typescript
import { lazy, Suspense } from "react";

const Users = lazy(() => import("@/pages/users"));
const Machines = lazy(() => import("@/pages/machines"));

// In routes
{
    path: "users",
    element: (
        <Suspense fallback={<LoadingIndicator />}>
            <Users />
        </Suspense>
    )
}
```

## Loading States

### NProgress Integration

Page transitions show a loading bar:

```typescript
import NProgress from "nprogress";
import { useNavigation } from "react-router";

function LoadingBar() {
    const navigation = useNavigation();

    useEffect(() => {
        if (navigation.state === "loading") {
            NProgress.start();
        } else {
            NProgress.done();
        }
    }, [navigation.state]);

    return null;
}
```

## Error Handling

### Not Found (404)

```typescript
function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="text-center">
            <h1>404 - Page Not Found</h1>
            <p>The page you're looking for doesn't exist.</p>
            <Button onClick={() => navigate("/app")}>
                Go to Dashboard
            </Button>
        </div>
    );
}
```

### Permission Denied (403)

```typescript
function PermissionDenied() {
    return (
        <div className="text-center">
            <h1>403 - Access Denied</h1>
            <p>You don't have permission to access this page.</p>
        </div>
    );
}
```
