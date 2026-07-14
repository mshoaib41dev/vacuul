# Technology Stack

## Frontend Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1.1 | UI framework |
| TypeScript | 5.9.2 | Type-safe JavaScript |
| Vite | 7.1.1 | Build tool and dev server |
| React Router | 7.8.0 | Client-side routing |

## Styling & UI

| Technology | Version | Purpose |
|------------|---------|---------|
| Tailwind CSS | 4.1.11 | Utility-first CSS framework |
| React Aria | 3.42.0 | Accessible component patterns |
| react-aria-components | 1.11.0 | Accessible UI components |
| Motion | 12.23.12 | Animation library |
| Untitled UI | - | Component library |

## Data Visualization

| Technology | Version | Purpose |
|------------|---------|---------|
| Recharts | 3.1.2 | Charts and graphs |

## Backend Services

| Service | Purpose |
|---------|---------|
| Firebase Authentication | User authentication (email/password) |
| Firebase Firestore | NoSQL document database |
| Firebase Storage | File storage (images, videos, firmware) |
| Firebase Cloud Functions | Serverless backend (europe-west6 region) |
| Firebase Hosting | Web application hosting |

## External Services

| Service | Purpose |
|---------|---------|
| Algolia | Full-text search across collections |
| Google Maps API | Location services and geocoding |
| Stripe | Payment processing (referenced via stripeId) |

## UI Component Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| Untitled UI React | - | Comprehensive UI components |
| Tiptap | - | Rich text editor |
| Sonner | 2.0.7 | Toast notifications |
| NProgress | 0.2.0 | Loading progress bar |
| QR Code Styling | 1.9.2 | QR code generation |
| React Hotkeys Hook | 5.1.0 | Keyboard shortcuts |

## Geolocation

| Library | Version | Purpose |
|---------|---------|---------|
| GeoFire Common | 6.0.0 | Geolocation queries with Firestore |

## Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Prettier | 3.6.2 | Code formatting |
| ESLint | - | Code linting |
| TypeScript ESLint | 8.39.0 | TypeScript-specific linting |
| PostCSS | 8.5.6 | CSS processing |

## Package Manager

- **npm** (Node Package Manager)
- Node.js 18+ required

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Key Dependencies

```json
{
  "dependencies": {
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-router": "^7.8.0",
    "firebase": "^12.1.0",
    "algoliasearch": "^5.36.0",
    "tailwindcss": "^4.1.11",
    "motion": "^12.23.12",
    "recharts": "^3.1.2",
    "sonner": "^2.0.7",
    "geofire-common": "^6.0.0"
  },
  "devDependencies": {
    "typescript": "~5.9.2",
    "vite": "^7.1.1",
    "prettier": "^3.6.2",
    "@typescript-eslint/eslint-plugin": "^8.39.0"
  }
}
```
