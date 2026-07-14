# Authentication & Authorization

## Overview

The application uses Firebase Authentication for user authentication and a custom Role-Based Access Control (RBAC) system for authorization.

## Authentication

### Provider

- **Firebase Authentication**
- **Method**: Email/Password
- **Session Persistence**: Configurable (local or session storage)

### Authentication Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   SignIn     │ ──► │   Firebase   │ ──► │  AuthContext │
│    Page      │     │     Auth     │     │   Provider   │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │  Protected   │
                                          │    Routes    │
                                          └──────────────┘
```

### AuthContext

The `AuthContext` provides authentication state and methods throughout the application.

```typescript
interface AuthContextType {
    // State
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    // Methods
    login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
    updateName: (displayName: string) => Promise<void>;
    updatePhotoURL: (file: File) => Promise<void>;
}
```

### useAuth Hook

Access authentication state and methods:

```typescript
import { useAuth } from "@/hooks/use-auth";

function MyComponent() {
    const { user, login, logout, isAuthenticated } = useAuth();

    const handleLogin = async () => {
        try {
            await login("user@example.com", "password", true);
            // Success - user is now authenticated
        } catch (error) {
            // Handle error (invalid credentials, network error, etc.)
            console.error("Login failed:", error);
        }
    };

    return (
        <div>
            {isAuthenticated ? (
                <div>
                    <p>Welcome, {user?.displayName}</p>
                    <button onClick={logout}>Logout</button>
                </div>
            ) : (
                <button onClick={handleLogin}>Login</button>
            )}
        </div>
    );
}
```

### Session Persistence

The `rememberMe` option controls session persistence:

```typescript
// Remember user (persists across browser sessions)
await login(email, password, true);
// Uses: browserLocalPersistence

// Session only (cleared when browser closes)
await login(email, password, false);
// Uses: browserSessionPersistence
```

### Password Reset

Password reset is handled via Firebase Cloud Functions:

```typescript
const { resetPassword } = useAuth();

try {
    await resetPassword("user@example.com");
    // Email sent successfully
} catch (error) {
    // Handle error
}
```

### Password Change

Requires reauthentication with current password:

```typescript
const { changePassword } = useAuth();

try {
    await changePassword("currentPassword", "newPassword");
    // Password changed successfully
} catch (error) {
    // Handle error (wrong current password, weak password, etc.)
}
```

---

## Route Guards

### AuthGuard

Protects routes that require authentication. Unauthenticated users are redirected to `/signin`.

```typescript
// src/guards/auth-guard.tsx
function AuthGuard() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/signin" replace />;
    }

    return <Outlet />;
}
```

**Usage in Routes:**
```typescript
<Route element={<AuthGuard />}>
    <Route path="/app/*" element={<SidebarLayout />}>
        <Route path="users" element={<Users />} />
        <Route path="machines" element={<Machines />} />
        {/* All protected routes */}
    </Route>
</Route>
```

### GuestGuard

Prevents authenticated users from accessing auth pages. Redirects to `/app`.

```typescript
// src/guards/guest-guard.tsx
function GuestGuard() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (isAuthenticated) {
        return <Navigate to="/app" replace />;
    }

    return <Outlet />;
}
```

**Usage in Routes:**
```typescript
<Route element={<GuestGuard />}>
    <Route path="/signin" element={<SignIn />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
</Route>
```

---

## Authorization (RBAC)

### Role Structure

Roles define permissions for each Firestore collection:

```typescript
interface Role {
    id: string;
    name: string;
    permissions: PermissionMap;
    isSystemRole: boolean;       // Cannot be deleted
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

type CollectionName =
    | "users"
    | "roles"
    | "machines"
    | "time_slots"
    | "gift_cards"
    | "system_logs"
    | "content"
    | "pricing"
    | "bookings"
    | "sessions"
    | "contact_us"
    | "firmware_packages";

type PermissionMap = {
    [K in CollectionName]: {
        create: boolean;
        read: boolean;
        update: boolean;
        delete: boolean;
    };
};
```

### Permission Levels

Each collection supports four permission levels:

| Permission | Description |
|------------|-------------|
| `create` | Can create new documents |
| `read` | Can view documents |
| `update` | Can modify existing documents |
| `delete` | Can remove documents |

### Example Roles

**Administrator:**
```json
{
    "id": "admin",
    "name": "Administrator",
    "isSystemRole": true,
    "permissions": {
        "users": { "create": true, "read": true, "update": true, "delete": true },
        "roles": { "create": true, "read": true, "update": true, "delete": true },
        "machines": { "create": true, "read": true, "update": true, "delete": true },
        "bookings": { "create": true, "read": true, "update": true, "delete": true }
    }
}
```

**Operator:**
```json
{
    "id": "operator",
    "name": "Operator",
    "isSystemRole": false,
    "permissions": {
        "users": { "create": false, "read": true, "update": false, "delete": false },
        "roles": { "create": false, "read": true, "update": false, "delete": false },
        "machines": { "create": true, "read": true, "update": true, "delete": false },
        "bookings": { "create": false, "read": true, "update": true, "delete": false }
    }
}
```

**Support Staff:**
```json
{
    "id": "support",
    "name": "Support Staff",
    "isSystemRole": false,
    "permissions": {
        "users": { "create": false, "read": true, "update": true, "delete": false },
        "contact_us": { "create": false, "read": true, "update": true, "delete": true },
        "bookings": { "create": false, "read": true, "update": false, "delete": false }
    }
}
```

### Using Permissions

#### useRoles Hook

```typescript
import { useRoles } from "@/hooks/use-roles";

function RoleManager() {
    const { roles, createRole, updateRole, deleteRole } = useRoles();

    return (
        <div>
            {roles.map(role => (
                <RoleCard
                    key={role.id}
                    role={role}
                    onUpdate={updateRole}
                    onDelete={deleteRole}
                />
            ))}
        </div>
    );
}
```

#### Permission Checking

```typescript
function hasPermission(
    role: Role | null,
    collection: CollectionName,
    action: "create" | "read" | "update" | "delete"
): boolean {
    if (!role) return false;
    return role.permissions[collection]?.[action] ?? false;
}

// Usage in component
function UsersPage() {
    const { user } = useAuth();
    const { roles } = useRoles();

    const userRole = roles.find(r => r.id === user?.roleId);
    const canCreateUsers = hasPermission(userRole, "users", "create");
    const canDeleteUsers = hasPermission(userRole, "users", "delete");

    return (
        <div>
            {canCreateUsers && (
                <Button onClick={openCreateModal}>Create User</Button>
            )}
            <UserTable
                showDeleteAction={canDeleteUsers}
            />
        </div>
    );
}
```

### System Roles

System roles (`isSystemRole: true`) have special protection:
- Cannot be deleted
- Typically include "Administrator" role
- Ensure there's always an admin with full access

---

## Security Best Practices

### Client-Side

1. **Never trust client-side permission checks alone** - They're for UX only
2. **Always validate on the server** - Use Firebase Security Rules
3. **Clear sensitive data on logout**
4. **Use HTTPS in production**

### Firebase Security Rules

Backend enforcement via Firestore Security Rules:

```javascript
// Example Firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if hasRole('admin');
      allow update: if request.auth.uid == userId || hasRole('admin');
      allow delete: if hasRole('admin');
    }

    // Helper function
    function hasRole(role) {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roleId == role;
    }
  }
}
```

### Cloud Functions

Sensitive operations are handled server-side:

```typescript
// User creation (requires admin)
const createUserFn = httpsCallable(functions, "createUser");

// Password reset (public, rate-limited)
const resetPasswordFn = httpsCallable(functions, "sendPasswordResetEmail");

// User status update (requires admin)
const updateStatusFn = httpsCallable(functions, "updateUserStatus");
```
