# Data Models

This document describes the TypeScript interfaces and Firestore document schemas used throughout the application.

## User

**Collection:** `users`

```typescript
interface User {
    id: string;
    displayName?: string;
    email?: string;
    lastUpdated?: Timestamp;
    photoURL?: string;
    sessions?: number;           // Number of sessions completed
    stripeId?: string;           // Stripe customer ID
    stripeLink?: string;         // Stripe dashboard link
    roleId?: string | null;      // Reference to Role document
    disabled?: boolean;          // Account status
    createdAt?: Timestamp;
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Document ID |
| displayName | string | No | User's display name |
| email | string | No | User's email address |
| lastUpdated | Timestamp | No | Last update timestamp |
| photoURL | string | No | Profile photo URL |
| sessions | number | No | Total sessions completed |
| stripeId | string | No | Stripe customer identifier |
| stripeLink | string | No | Link to Stripe dashboard |
| roleId | string | No | Reference to assigned role |
| disabled | boolean | No | Whether account is disabled |
| createdAt | Timestamp | No | Account creation timestamp |

---

## Machine

**Collection:** `machines`

```typescript
interface Machine {
    id: string;
    commissionId: string;        // Unique commission identifier
    name: string;
    address: string;
    geo: {
        geopoint: GeoPoint;      // Firebase GeoPoint
        geohash: string;         // Geohash for queries
    };
    status: "online" | "offline";
    lastOnline: Timestamp;
    ownerUserId?: string;        // Owner user reference

    // Content references
    idleVideos?: string[];
    pauseVideos?: string[];
    duringSessionVideos?: string[];

    // Configuration
    schedule?: MachineSchedule;
    timezone: string;
    volume: number;              // 0-100
    brightness: number;          // 0-100
    wifiCountry: string;
    languageCode: string;

    createdAt: Timestamp;
    updatedAt: Timestamp;
}

interface MachineSchedule {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
}

interface DaySchedule {
    isOpen: boolean;
    openTime: string;            // "HH:MM" format
    closeTime: string;           // "HH:MM" format
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Document ID |
| commissionId | string | Yes | Unique hardware identifier |
| name | string | Yes | Machine display name |
| address | string | Yes | Physical address |
| geo | object | Yes | Geolocation data |
| status | enum | Yes | Online/offline status |
| lastOnline | Timestamp | Yes | Last online timestamp |
| ownerUserId | string | No | Owner user ID |
| idleVideos | string[] | No | Content URLs for idle state |
| pauseVideos | string[] | No | Content URLs for paused state |
| duringSessionVideos | string[] | No | Content URLs during session |
| schedule | object | No | Weekly schedule |
| timezone | string | Yes | Machine timezone |
| volume | number | Yes | Volume level (0-100) |
| brightness | number | Yes | Brightness level (0-100) |
| wifiCountry | string | Yes | WiFi country code |
| languageCode | string | Yes | Display language |

---

## Booking

**Collection:** `bookings`

```typescript
interface Booking {
    id: string;
    machineId: string;
    machineName: string;
    userId: string;
    startTime: Timestamp;
    endTime: Timestamp;
    status: "booked" | "cancelled" | "completed";
    sessionStatus?: "started" | "done" | "paused" | "cancelled" | "running";
    treatmentConfig: TreatmentConfig;
    location?: {
        lat: number;
        lng: number;
        address: string;
    };
    rating?: number;             // 1-5 star rating
    review?: string;             // User review text
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

interface TreatmentConfig {
    led: {
        staticColour: string;    // Hex color code
    };
    blocks: Array<{
        type: number;            // Block type identifier
        temperature: number;     // Temperature setting
        duration: number;        // Duration in seconds
    }>;
    frequency: number;           // Treatment frequency
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Document ID |
| machineId | string | Yes | Reference to machine |
| machineName | string | Yes | Denormalized machine name |
| userId | string | Yes | Reference to user |
| startTime | Timestamp | Yes | Session start time |
| endTime | Timestamp | Yes | Session end time |
| status | enum | Yes | Booking status |
| sessionStatus | enum | No | Current session state |
| treatmentConfig | object | Yes | Treatment configuration |
| location | object | No | Machine location snapshot |
| rating | number | No | User rating (1-5) |
| review | string | No | User review text |

---

## Role

**Collection:** `roles`

```typescript
interface Role {
    id: string;
    name: string;
    permissions: PermissionMap;
    isSystemRole: boolean;       // System roles cannot be deleted
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

**Example Role:**
```json
{
    "id": "admin",
    "name": "Administrator",
    "isSystemRole": true,
    "permissions": {
        "users": { "create": true, "read": true, "update": true, "delete": true },
        "machines": { "create": true, "read": true, "update": true, "delete": true },
        "bookings": { "create": false, "read": true, "update": true, "delete": false }
    }
}
```

---

## Pricing

**Collection:** `pricing`

```typescript
interface Pricing {
    id: string;
    name: string;
    price: number;
    currency: string;            // e.g., "USD", "EUR"
    sessions: number;            // Number of sessions included
    savings?: number;            // Savings percentage
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
```

---

## Gift Card

**Collection:** `gift_cards`

```typescript
interface GiftCard {
    id: string;
    code: string;                // Unique redemption code
    amount: number;              // Monetary value
    sessions: number;            // Sessions included
    used: boolean;
    usedBy?: string;             // User ID who redeemed
    usedDate?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
```

---

## Content

**Collection:** `content`

```typescript
interface Content {
    id: string;
    name: string;
    url: string;                 // Firebase Storage URL
    type: "video" | "image";
    size: number;                // File size in bytes
    uploadedBy: string;          // User ID
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
```

---

## Firmware Update

**Collection:** `firmware_packages`

```typescript
interface FirmwareUpdate {
    id: string;
    file: string;                // Storage URL
    fileName: string;
    debianRevision: string;
    upstreamVersion: string;
    uploadedBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
```

---

## Session Settings

**Collection:** `session_settings`

```typescript
interface SessionSetting {
    id: string;
    name: string;
    frequency: number;
    temperature: number;
    ledColors: string[];         // Array of hex colors
    presets: SessionPreset[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

interface SessionPreset {
    name: string;
    blocks: TreatmentBlock[];
}

interface TreatmentBlock {
    type: number;
    temperature: number;
    duration: number;
}
```

---

## System Log

**Collection:** `system_logs`

```typescript
interface SystemLog {
    id: string;
    machineId: string;
    sessionId?: string;
    error: {
        code: string;
        message: string;
        severity: "info" | "warning" | "error" | "critical";
        stack?: string;
    };
    createdAt: Timestamp;
}
```

---

## Contact Response

**Collection:** `contact_us`

```typescript
interface ContactResponse {
    id: string;
    uid?: string;                // User ID if logged in
    email: string;
    name: string;
    message: string;
    createdAt: Timestamp;
}
```

---

## Time Slot

**Collection:** `time_slots`

```typescript
interface TimeSlot {
    id: string;
    machineId: string;
    date: Timestamp;
    startTime: string;           // "HH:MM" format
    endTime: string;             // "HH:MM" format
    isAvailable: boolean;
    bookingId?: string;          // Reference if booked
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
```

---

## Common Types

### Firebase Types

```typescript
import { Timestamp, GeoPoint } from "firebase/firestore";

// Timestamp: Firebase server timestamp
// GeoPoint: { latitude: number, longitude: number }
```

### Uploaded File

```typescript
interface UploadedFile {
    name: string;
    url: string;
    size: number;
    type: string;
    uploadedAt: Timestamp;
}
```
