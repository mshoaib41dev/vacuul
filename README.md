# Vacuul Admin Panel

React admin panel for Vacuul, powered by the Node.js API backend.

## Stack

- React 19
- Vite 7
- TypeScript
- TanStack Query
- Zustand
- Tailwind CSS
- Bun package manager

## Requirements

- Bun `1.3.x` or newer
- Node.js `20.19+` or `22.12+` for Vite compatibility

Check versions:

```bash
bun --version
node --version
```

## Install

Use Bun only for dependency installs and lockfile updates:

```bash
bun install
```

The canonical lockfile is `bun.lock`. Do not generate or commit `package-lock.json`.

## Environment

Create a local env file:

```bash
cp .env.example .env.local
```

Remote backend setup:

```bash
VITE_API_BASE_URL=https://vaccul-backend.ahdus.de
VITE_API_TIMEOUT_MS=15000
VITE_API_USE_CREDENTIALS=false
```

Other supported variables:

```bash
VITE_APP_NAME=Vacuul
VITE_DEBUG_MODE=true
VITE_GOOGLE_MAPS_API_KEY=
VITE_ALGOLIA_APP_ID=
VITE_ALGOLIA_SEARCH_API_KEY=
VITE_MACHINE_OWNER_ROLE_ID=
```

Firebase SDK initialization has been removed from the app config. Auth and migrated admin resources call the Node.js API through `src/lib/api-client.ts`.

## Run

Development server:

```bash
bun dev
```

Production build:

```bash
bun run build
```

Preview production build:

```bash
bun run preview
```

Open the app at:

```text
http://localhost:5173
```



## API Notes

- API base URL is controlled by `VITE_API_BASE_URL`.
- Access and refresh tokens are managed by the auth store and attached by `apiFetch`.
- `VITE_API_USE_CREDENTIALS=false` is expected unless the backend is configured for credentialed cross-origin cookies.



## Common Issues

Blank page after login:

- Confirm `VITE_API_BASE_URL` points to the correct backend.
- Restart `bun dev` after changing `.env.local`.
- Check browser console for API or route errors.

CORS error:

- Confirm the Node API allows the admin app origin, requested methods, and requested headers.

Dependencies out of sync:

```bash
rm -rf node_modules
bun install
```

