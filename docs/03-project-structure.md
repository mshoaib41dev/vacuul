# Project Structure

## Directory Overview

```
vacuuladmin/
├── docs/                         # Documentation
├── public/                       # Static assets
├── src/                          # Source code
│   ├── pages/                    # Page components
│   ├── components/               # React components
│   ├── hooks/                    # Custom React hooks
│   ├── types/                    # TypeScript definitions
│   ├── contexts/                 # React contexts
│   ├── guards/                   # Route guards
│   ├── routes/                   # Routing configuration
│   ├── layouts/                  # Layout components
│   ├── providers/                # Context providers
│   ├── constants/                # Constants
│   ├── utils/                    # Utility functions
│   ├── styles/                   # Global styles
│   ├── App.tsx                   # Root component
│   ├── main.tsx                  # Entry point
│   └── config.tsx                # Firebase configuration
├── firebase.json                 # Firebase config
├── .firebaserc                   # Firebase project
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript config
├── tailwind.config.js            # Tailwind config
├── postcss.config.mjs            # PostCSS config
├── .prettierrc                   # Prettier config
├── .env.example                  # Environment template
└── package.json                  # Dependencies
```

## Detailed Structure

### Pages (`src/pages/`)

```
pages/
├── auth/                         # Authentication pages
│   ├── signin.tsx                # Login page
│   ├── forgot-password.tsx       # Password reset request
│   └── account.tsx               # User account settings
├── machines/                     # Machine management
│   ├── register.tsx              # Register new machine
│   └── edit.tsx                  # Edit machine details
├── users/                        # User management
│   ├── create.tsx                # Create new user
│   └── edit.tsx                  # Edit user details
├── session-management/           # Session pages
│   └── booking-history.tsx       # Booking history list
├── pricing.tsx                   # Pricing management
├── gift-cards.tsx                # Gift card management
├── contents.tsx                  # Content & ads management
├── firmware-updates.tsx          # DFU management
├── system-logs.tsx               # System logs viewer
├── session-settings.tsx          # Session configuration
├── contact-responses.tsx         # Contact form responses
└── roles.tsx                     # Role management
```

### Components (`src/components/`)

```
components/
├── base/                         # UI primitives
│   ├── buttons/                  # Button variants
│   │   ├── button.tsx
│   │   ├── icon-button.tsx
│   │   └── button-group.tsx
│   ├── input/                    # Input fields
│   │   ├── input.tsx
│   │   └── input-group.tsx
│   ├── form/                     # Form components
│   │   ├── form-field.tsx
│   │   └── form-group.tsx
│   ├── select/                   # Dropdown selects
│   ├── checkbox/                 # Checkbox components
│   ├── radio-buttons/            # Radio button groups
│   ├── textarea/                 # Text area inputs
│   ├── toggle/                   # Toggle switches
│   ├── avatar/                   # User avatars
│   ├── badges/                   # Status badges
│   ├── tags/                     # Tag components
│   ├── text-editor/              # Rich text (Tiptap)
│   ├── video-player/             # Video playback
│   ├── file-upload-trigger/      # Upload buttons
│   ├── tooltip/                  # Tooltips
│   ├── slider/                   # Range sliders
│   ├── progress-indicators/      # Progress bars
│   └── link/                     # Link components
│
├── application/                  # Application components
│   ├── app-navigation/           # Sidebar navigation
│   │   ├── sidebar.tsx
│   │   ├── nav-item.tsx
│   │   └── nav-section.tsx
│   ├── breadcrumbs/              # Breadcrumb navigation
│   ├── table/                    # Data tables
│   │   ├── table.tsx
│   │   ├── table-header.tsx
│   │   ├── table-row.tsx
│   │   └── table-cell.tsx
│   ├── pagination/               # Pagination controls
│   ├── modals/                   # Modal dialogs
│   │   ├── modal.tsx
│   │   ├── confirm-modal.tsx
│   │   └── delete-modal.tsx
│   ├── notifications/            # Notification components
│   ├── messaging/                # Messaging UI
│   ├── charts/                   # Chart components
│   ├── metrics/                  # Metric displays
│   ├── empty-state/              # Empty state UI
│   ├── loading-indicator/        # Loading spinners
│   ├── file-upload/              # File upload zone
│   ├── date-picker/              # Date selection
│   ├── section-headers/          # Page section headers
│   ├── section-footers/          # Page section footers
│   ├── slideout-menus/           # Drawer/slideout panels
│   └── tabs/                     # Tab components
│
├── foundations/                  # Design foundations
│   ├── logo/                     # Logo component
│   ├── social-icons/             # Social media icons
│   ├── payment-icons/            # Payment icons
│   └── featured-icon/            # Featured icon
│
├── marketing/                    # Marketing components
│   └── header-navigation/        # Marketing header
│
└── shared-assets/                # Shared assets
    ├── background-patterns/      # Background patterns
    └── illustrations/            # Illustrations
```

### Hooks (`src/hooks/`)

```
hooks/
├── use-auth.tsx                  # Authentication hook
├── use-users.tsx                 # User management
├── use-machines.tsx              # Machine management
├── use-bookings.tsx              # Booking management
├── use-roles.tsx                 # Role management
├── use-pricing.tsx               # Pricing management
├── use-gift-cards.tsx            # Gift card management
├── use-content.tsx               # Content management
├── use-firmware-update.tsx       # Firmware management
├── use-session-settings.tsx      # Session settings
├── use-system-logs.tsx           # System logs
├── use-contact-responses.tsx     # Contact responses
├── use-users-by-role.tsx         # Users filtered by role
├── use-firestore-collection.tsx  # Generic Firestore hook
├── use-firebase-storage.tsx      # File upload hook
├── use-algolia-search.tsx        # Search hook
├── use-google-places.tsx         # Google Places API
├── use-clipboard.ts              # Clipboard utilities
├── use-breakpoint.ts             # Responsive design
└── use-resize-observer.ts        # Element resize
```

### Types (`src/types/`)

```
types/
├── user.ts                       # User type definitions
├── machine.ts                    # Machine types
├── booking.ts                    # Booking/session types
├── role.ts                       # RBAC types
├── pricing.ts                    # Pricing types
├── gift-card.ts                  # Gift card types
├── content.ts                    # Content types
├── session-setting.ts            # Session settings
├── firmware-updates.ts           # Firmware types
├── system-logs.ts                # Log types
├── contact-responses.ts          # Contact types
└── uploaded-file.ts              # File upload types
```

### Other Directories

```
contexts/
└── auth-context.tsx              # Authentication context

guards/
├── auth-guard.tsx                # Protected route guard
└── guest-guard.tsx               # Guest-only route guard

routes/
└── index.tsx                     # Route definitions

layouts/
├── sidebar-layout.tsx            # Main app layout
└── auth-layout.tsx               # Auth page layout

providers/
├── theme-provider.tsx            # Theme management
└── router-provider.tsx           # Router wrapper

constants/
└── machine-options.ts            # Machine config options

utils/
├── cx.ts                         # Class name utilities
├── string-utils.ts               # String helpers
├── countries.tsx                 # Country data
├── timezones.tsx                 # Timezone data
└── is-react-component.ts         # Component detection

styles/
└── globals.css                   # Global CSS
```

## Path Aliases

The project uses path aliases for cleaner imports:

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Usage:**
```typescript
// Instead of:
import { useAuth } from "../../../hooks/use-auth";

// Use:
import { useAuth } from "@/hooks/use-auth";
```
