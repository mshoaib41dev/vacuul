# Environment Configuration

## Overview

The application uses environment variables for configuration. Vite requires variables to be prefixed with `VITE_` to be exposed to the client.

## Environment Files

| File | Purpose |
|------|---------|
| `.env` | Default environment variables |
| `.env.local` | Local overrides (not committed) |
| `.env.development` | Development environment |
| `.env.production` | Production environment |
| `.env.example` | Template (committed to repo) |

## Required Variables

### Application

```bash
# Application name displayed in the UI
VITE_APP_NAME=Vacuul
```

### Firebase Configuration

```bash
# Firebase API key
VITE_FIREBASE_API_KEY=AIza...

# Firebase Auth domain
VITE_FIREBASE_AUTH_DOMAIN=vacuul-app.firebaseapp.com

# Firebase project ID
VITE_FIREBASE_PROJECT_ID=vacuul-app

# Firebase Storage bucket
VITE_FIREBASE_STORAGE_BUCKET=vacuul-app.appspot.com

# Firebase Messaging sender ID
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789

# Firebase App ID
VITE_FIREBASE_APPID=1:123456789:web:abc123
```

### Algolia Search

```bash
# Algolia Application ID
VITE_ALGOLIA_APP_ID=ABC123

# Algolia Search-only API key (NOT admin key)
VITE_ALGOLIA_SEARCH_API_KEY=abc123searchonly
```

### Google Maps

```bash
# Google Maps API key (with Maps JavaScript API enabled)
VITE_GOOGLE_MAPS_API_KEY=AIza...
```

### Development

```bash
# Enable debug mode (shows additional logging)
VITE_DEBUG_MODE=true
```

## Complete Example

```bash
# .env.example

# Application
VITE_APP_NAME=Vacuul

# Firebase Configuration
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APPID=

# External Services
VITE_GOOGLE_MAPS_API_KEY=
VITE_ALGOLIA_APP_ID=
VITE_ALGOLIA_SEARCH_API_KEY=

# Development
VITE_DEBUG_MODE=true
```

## Environment-Specific Configuration

### Development (.env.development)

```bash
VITE_APP_NAME=Vacuul (Dev)
VITE_FIREBASE_PROJECT_ID=vacuul-app-dev
VITE_DEBUG_MODE=true
```

### Staging (.env.staging)

```bash
VITE_APP_NAME=Vacuul (Staging)
VITE_FIREBASE_PROJECT_ID=vacuul-app-staging
VITE_DEBUG_MODE=true
```

### Production (.env.production)

```bash
VITE_APP_NAME=Vacuul
VITE_FIREBASE_PROJECT_ID=vacuul-app
VITE_DEBUG_MODE=false
```

## Accessing Variables

### In TypeScript

```typescript
// Access environment variables
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const isDebug = import.meta.env.VITE_DEBUG_MODE === "true";
const appName = import.meta.env.VITE_APP_NAME;

// Check environment
if (import.meta.env.DEV) {
    console.log("Running in development mode");
}

if (import.meta.env.PROD) {
    console.log("Running in production mode");
}
```

### Type Safety

Add type definitions for environment variables:

```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_NAME: string;
    readonly VITE_FIREBASE_API_KEY: string;
    readonly VITE_FIREBASE_AUTH_DOMAIN: string;
    readonly VITE_FIREBASE_PROJECT_ID: string;
    readonly VITE_FIREBASE_STORAGE_BUCKET: string;
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
    readonly VITE_FIREBASE_APPID: string;
    readonly VITE_GOOGLE_MAPS_API_KEY: string;
    readonly VITE_ALGOLIA_APP_ID: string;
    readonly VITE_ALGOLIA_SEARCH_API_KEY: string;
    readonly VITE_DEBUG_MODE: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
```

## Firebase Configuration

### src/config.tsx

```typescript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APPID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, "europe-west6");
```

## Obtaining Credentials

### Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click the gear icon > Project settings
4. Scroll to "Your apps" section
5. Copy the config values

### Algolia

1. Go to [Algolia Dashboard](https://dashboard.algolia.com)
2. Navigate to Settings > API Keys
3. Copy "Application ID"
4. Copy "Search-Only API Key" (NOT Admin API Key)

### Google Maps

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to APIs & Services > Credentials
4. Create or copy an API key
5. Enable "Maps JavaScript API" for the key

## Security Best Practices

### DO

- Use environment variables for all secrets
- Use search-only API keys for Algolia
- Restrict Google Maps API key to your domains
- Keep `.env` files out of version control
- Use different credentials per environment

### DON'T

- Commit `.env` files to git
- Use admin/write API keys in frontend
- Share credentials in code or comments
- Use production credentials in development

## .gitignore

Ensure environment files are not committed:

```gitignore
# Environment files
.env
.env.local
.env.development.local
.env.production.local

# Keep the example
!.env.example
```

## Troubleshooting

### Variables Not Loading

1. Ensure variable is prefixed with `VITE_`
2. Restart the development server
3. Check file is named correctly (`.env`)
4. Verify file is in project root

### Variables Undefined in Build

1. Check CI/CD has access to secrets
2. Verify variables are passed during build
3. Check for typos in variable names

### Wrong Environment

Check which environment is active:

```typescript
console.log("Mode:", import.meta.env.MODE);
console.log("Dev:", import.meta.env.DEV);
console.log("Prod:", import.meta.env.PROD);
```
