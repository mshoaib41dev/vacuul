# Development Guide

## Prerequisites

- **Node.js** 18 or higher
- **npm** (comes with Node.js)
- **Firebase CLI** (`npm install -g firebase-tools`)
- **Git**

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd vacuuladmin
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the environment template and configure:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# Application
VITE_APP_NAME=Vacuul

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APPID=your_app_id

# External Services
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_ALGOLIA_APP_ID=your_algolia_app_id
VITE_ALGOLIA_SEARCH_API_KEY=your_algolia_search_key

# Development
VITE_DEBUG_MODE=true
```

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## Project Configuration

### TypeScript

Configuration in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

### Vite

Configuration in `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});
```

### Prettier

Configuration in `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 4,
  "trailingComma": "es5",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

## Code Organization

### Adding a New Page

1. **Create the page component:**

```typescript
// src/pages/my-feature.tsx
import { useState } from "react";
import { useMyFeature } from "@/hooks/use-my-feature";

export default function MyFeature() {
    const { items, isLoading, createItem } = useMyFeature();

    if (isLoading) {
        return <LoadingIndicator />;
    }

    return (
        <div>
            <h1>My Feature</h1>
            {/* Page content */}
        </div>
    );
}
```

2. **Add the route:**

```typescript
// src/routes/index.tsx
import MyFeature from "@/pages/my-feature";

// In the routes array
{ path: "my-feature", element: <MyFeature /> }
```

3. **Add navigation item:**

Update `src/components/application/app-navigation/` to include the new route.

### Adding a New Hook

1. **Define types:**

```typescript
// src/types/my-feature.ts
import { Timestamp } from "firebase/firestore";

export interface MyFeature {
    id: string;
    name: string;
    description: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
```

2. **Create the hook:**

```typescript
// src/hooks/use-my-feature.tsx
import { useFirestoreCollection } from "./use-firestore-collection";
import { MyFeature } from "@/types/my-feature";

export function useMyFeature() {
    const collection = useFirestoreCollection<MyFeature>({
        collectionName: "my_feature",
        orderByField: "createdAt",
        orderDirection: "desc",
        pageSize: 20,
    });

    // Add any custom logic here

    return {
        ...collection,
        items: collection.items,
    };
}
```

### Adding a New Component

1. **Create component file:**

```typescript
// src/components/application/my-component/my-component.tsx
interface MyComponentProps {
    title: string;
    onAction?: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
    return (
        <div className="p-4 rounded-lg border">
            <h2 className="text-lg font-semibold">{title}</h2>
            {onAction && (
                <button onClick={onAction}>
                    Click me
                </button>
            )}
        </div>
    );
}
```

2. **Export from index:**

```typescript
// src/components/application/my-component/index.ts
export { MyComponent } from "./my-component";
```

## Code Style Guidelines

### File Naming

- **Components**: PascalCase (`UserCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`use-users.tsx`)
- **Types**: PascalCase (`user.ts`)
- **Utils**: camelCase (`string-utils.ts`)

### Component Structure

```typescript
// 1. Imports
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/base/buttons";
import { useUsers } from "@/hooks/use-users";
import type { User } from "@/types/user";

// 2. Types/Interfaces
interface Props {
    userId: string;
    onSave?: (user: User) => void;
}

// 3. Component
export function UserEditor({ userId, onSave }: Props) {
    // Hooks
    const navigate = useNavigate();
    const { getUserById, updateUser } = useUsers();

    // State
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Effects
    useEffect(() => {
        loadUser();
    }, [userId]);

    // Handlers
    const loadUser = async () => {
        const data = await getUserById(userId);
        setUser(data);
        setIsLoading(false);
    };

    const handleSave = async () => {
        if (!user) return;
        await updateUser(user.id, user);
        onSave?.(user);
    };

    // Render
    if (isLoading) return <LoadingSpinner />;
    if (!user) return <NotFound />;

    return (
        <form onSubmit={handleSave}>
            {/* Form content */}
        </form>
    );
}
```

### Import Order

1. React imports
2. Third-party libraries
3. Internal components (using `@/` alias)
4. Hooks
5. Types
6. Styles

```typescript
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";

import { Button } from "@/components/base/buttons";
import { Table } from "@/components/application/table";

import { useUsers } from "@/hooks/use-users";

import type { User } from "@/types/user";
```

## Testing

### Manual Testing

1. Start the development server
2. Test each feature manually
3. Check browser console for errors
4. Verify data in Firebase Console

### Firebase Emulators

For local development without affecting production:

```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal, start the app
npm run dev
```

Configure the app to use emulators in development:

```typescript
// src/config.tsx
import { connectAuthEmulator } from "firebase/auth";
import { connectFirestoreEmulator } from "firebase/firestore";
import { connectStorageEmulator } from "firebase/storage";

if (import.meta.env.DEV) {
    connectAuthEmulator(auth, "http://localhost:9099");
    connectFirestoreEmulator(db, "localhost", 8080);
    connectStorageEmulator(storage, "localhost", 9199);
}
```

## Debugging

### React DevTools

Install the React DevTools browser extension for component inspection.

### Firebase Debug Mode

Enable debug mode in `.env`:

```bash
VITE_DEBUG_MODE=true
```

### Console Logging

```typescript
// Development-only logging
if (import.meta.env.DEV) {
    console.log("Debug info:", data);
}
```

### Network Inspection

Use browser DevTools Network tab to inspect:
- Firestore requests
- Cloud Function calls
- Storage uploads

## Common Issues

### Firebase Authentication Errors

| Error | Solution |
|-------|----------|
| `auth/invalid-api-key` | Check `VITE_FIREBASE_API_KEY` |
| `auth/unauthorized-domain` | Add domain to Firebase Auth settings |

### Firestore Permission Denied

Check:
1. User is authenticated
2. Security rules allow the operation
3. User has the required role

### Storage Upload Fails

Check:
1. File size limits
2. Storage security rules
3. CORS configuration

### Environment Variables Not Loading

1. Prefix with `VITE_`
2. Restart the dev server after changes
3. Check `.env` file is in project root

## Git Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation

### Commit Messages

```
feat: add user search functionality
fix: resolve pagination bug in machines list
refactor: simplify authentication hook
docs: update API integration guide
```
