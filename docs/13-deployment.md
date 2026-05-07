# Deployment

## Overview

The application is deployed to Firebase Hosting with automatic builds via Vite.

## Prerequisites

- Firebase CLI installed (`npm install -g firebase-tools`)
- Access to the Firebase project
- Production environment variables configured

## Build Process

### Local Build

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Build Output

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [other assets]
└── [static files]
```

## Firebase Configuration

### firebase.json

```json
{
    "hosting": {
        "public": "dist",
        "ignore": [
            "firebase.json",
            "**/.*",
            "**/node_modules/**"
        ],
        "rewrites": [
            {
                "source": "**",
                "destination": "/index.html"
            }
        ]
    }
}
```

### .firebaserc

```json
{
    "projects": {
        "default": "vacuul-app"
    }
}
```

## Deployment Steps

### 1. Authenticate with Firebase

```bash
firebase login
```

### 2. Select Project

```bash
firebase use vacuul-app
```

### 3. Build the Application

```bash
npm run build
```

### 4. Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

### One-Command Deployment

```bash
npm run build && firebase deploy --only hosting
```

## Deployment Environments

### Production

```bash
firebase use vacuul-app
firebase deploy --only hosting
```

URL: `https://vacuul-app.web.app` or custom domain

### Staging (if configured)

```bash
firebase use vacuul-app-staging
firebase deploy --only hosting
```

### Preview Channels

Deploy to a preview channel for testing:

```bash
firebase hosting:channel:deploy preview-branch-name
```

This creates a temporary URL for testing.

## Environment-Specific Builds

### Using Different .env Files

```bash
# Development
cp .env.development .env
npm run build

# Staging
cp .env.staging .env
npm run build

# Production
cp .env.production .env
npm run build
```

### Example Environment Files

**.env.development**
```bash
VITE_FIREBASE_PROJECT_ID=vacuul-app-dev
VITE_DEBUG_MODE=true
```

**.env.staging**
```bash
VITE_FIREBASE_PROJECT_ID=vacuul-app-staging
VITE_DEBUG_MODE=true
```

**.env.production**
```bash
VITE_FIREBASE_PROJECT_ID=vacuul-app
VITE_DEBUG_MODE=false
```

## Build Optimization

### Vite Production Optimizations

Vite automatically applies:

- **Code Splitting**: Lazy-loaded routes are separate chunks
- **Tree Shaking**: Unused code is removed
- **Minification**: JavaScript and CSS are minified
- **Asset Optimization**: Images and fonts are optimized
- **Gzip/Brotli**: Compressed assets for faster loading

### Analyzing Bundle Size

```bash
# Install analyzer
npm install -D rollup-plugin-visualizer

# Add to vite.config.ts
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
    plugins: [
        react(),
        visualizer({
            open: true,
            filename: "bundle-stats.html"
        })
    ]
});

# Build and analyze
npm run build
```

## Continuous Deployment

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Firebase

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APPID: ${{ secrets.VITE_FIREBASE_APPID }}
          VITE_ALGOLIA_APP_ID: ${{ secrets.VITE_ALGOLIA_APP_ID }}
          VITE_ALGOLIA_SEARCH_API_KEY: ${{ secrets.VITE_ALGOLIA_SEARCH_API_KEY }}
          VITE_GOOGLE_MAPS_API_KEY: ${{ secrets.VITE_GOOGLE_MAPS_API_KEY }}

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: vacuul-app
```

## Rollback

### Revert to Previous Version

1. Go to Firebase Console
2. Navigate to Hosting
3. Click on "Release history"
4. Select previous version and click "Rollback"

### Via CLI

```bash
# List releases
firebase hosting:releases:list

# Rollback to specific version
firebase hosting:clone SOURCE_SITE_ID:SOURCE_VERSION TARGET_SITE_ID:live
```

## Custom Domain

### Configure Custom Domain

1. Go to Firebase Console > Hosting
2. Click "Add custom domain"
3. Enter your domain (e.g., `admin.vacuul.com`)
4. Follow DNS configuration instructions

### DNS Configuration

Add these records to your DNS:

| Type | Host | Value |
|------|------|-------|
| A | @ | 151.101.1.195 |
| A | @ | 151.101.65.195 |
| TXT | @ | firebase=your-verification-code |

### SSL Certificate

Firebase automatically provisions and renews SSL certificates.

## Monitoring

### Firebase Hosting Metrics

View in Firebase Console:
- Request count
- Bandwidth usage
- Response times
- Error rates

### Performance Monitoring

Add Firebase Performance Monitoring:

```typescript
import { getPerformance } from "firebase/performance";

const perf = getPerformance(app);
```

## Troubleshooting

### Deployment Fails

| Issue | Solution |
|-------|----------|
| `firebase: command not found` | Install Firebase CLI: `npm install -g firebase-tools` |
| Permission denied | Run `firebase login` to authenticate |
| Project not found | Check `.firebaserc` project ID |
| Build fails | Check for TypeScript/lint errors |

### Site Not Updating

1. Clear browser cache
2. Check deployment completed successfully
3. Verify correct Firebase project
4. Wait for CDN propagation (usually < 1 minute)

### 404 on Refresh

Ensure `rewrites` are configured in `firebase.json`:

```json
{
    "hosting": {
        "rewrites": [
            {
                "source": "**",
                "destination": "/index.html"
            }
        ]
    }
}
```
