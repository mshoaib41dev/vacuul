# API & Backend Integration

## Firebase Configuration

### Initialization

```typescript
// src/config.tsx
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

### Region

All Firebase Cloud Functions are deployed to `europe-west6` (Zurich).

---

## Firestore Database

### Collections Overview

| Collection | Description | Primary Use |
|------------|-------------|-------------|
| `users` | User accounts | User management |
| `machines` | IoT devices | Machine management |
| `bookings` | Session bookings | Booking history |
| `sessions` | Active sessions | Real-time tracking |
| `roles` | RBAC definitions | Authorization |
| `pricing` | Pricing plans | Subscription management |
| `gift_cards` | Gift card records | Redemption tracking |
| `content` | Media content | Content library |
| `firmware_packages` | Firmware files | DFU management |
| `system_logs` | Event logs | Monitoring |
| `session_settings` | Config templates | Session configuration |
| `contact_us` | Contact submissions | Support |
| `time_slots` | Booking slots | Scheduling |

### Basic Operations

#### Reading Documents

```typescript
import { doc, getDoc, collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/config";

// Single document
const userRef = doc(db, "users", "userId");
const userSnap = await getDoc(userRef);
const user = userSnap.data();

// Collection query
const usersQuery = query(
    collection(db, "users"),
    where("disabled", "==", false),
    orderBy("createdAt", "desc")
);
const snapshot = await getDocs(usersQuery);
const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

#### Writing Documents

```typescript
import { doc, setDoc, addDoc, updateDoc, deleteDoc, collection } from "firebase/firestore";

// Create with auto-generated ID
const docRef = await addDoc(collection(db, "users"), {
    displayName: "John Doe",
    email: "john@example.com",
    createdAt: serverTimestamp()
});

// Create with specific ID
await setDoc(doc(db, "users", "specificId"), {
    displayName: "Jane Doe",
    createdAt: serverTimestamp()
});

// Update
await updateDoc(doc(db, "users", "userId"), {
    displayName: "Updated Name",
    updatedAt: serverTimestamp()
});

// Delete
await deleteDoc(doc(db, "users", "userId"));
```

#### Real-time Listeners

```typescript
import { onSnapshot, query, collection, orderBy } from "firebase/firestore";

const q = query(collection(db, "machines"), orderBy("lastOnline", "desc"));

const unsubscribe = onSnapshot(q, (snapshot) => {
    const machines = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    setMachines(machines);
});

// Cleanup on unmount
useEffect(() => {
    return () => unsubscribe();
}, []);
```

#### Pagination

```typescript
import { query, collection, orderBy, limit, startAfter, getDocs } from "firebase/firestore";

// First page
const firstQuery = query(
    collection(db, "bookings"),
    orderBy("createdAt", "desc"),
    limit(20)
);
const firstSnapshot = await getDocs(firstQuery);

// Next page
const lastDoc = firstSnapshot.docs[firstSnapshot.docs.length - 1];
const nextQuery = query(
    collection(db, "bookings"),
    orderBy("createdAt", "desc"),
    startAfter(lastDoc),
    limit(20)
);
const nextSnapshot = await getDocs(nextQuery);
```

---

## Cloud Functions

### Available Functions

| Function | Purpose | Access |
|----------|---------|--------|
| `createUser` | Create new user with email/password | Admin only |
| `updateUserStatus` | Enable/disable user accounts | Admin only |
| `sendPasswordResetEmail` | Initiate password reset | Public |

### Calling Functions

```typescript
import { httpsCallable } from "firebase/functions";
import { functions } from "@/config";

// Create user
const createUserFn = httpsCallable(functions, "createUser");

async function createUser(email: string, password: string, displayName: string) {
    try {
        const result = await createUserFn({
            email,
            password,
            displayName
        });
        return result.data;
    } catch (error) {
        console.error("Failed to create user:", error);
        throw error;
    }
}

// Update user status
const updateStatusFn = httpsCallable(functions, "updateUserStatus");

async function disableUser(userId: string) {
    await updateStatusFn({
        userId,
        disabled: true
    });
}

// Password reset
const resetPasswordFn = httpsCallable(functions, "sendPasswordResetEmail");

async function requestPasswordReset(email: string) {
    await resetPasswordFn({ email });
}
```

---

## Firebase Storage

### Storage Structure

```
Firebase Storage
├── profile_photos/
│   └── {userId}/
│       └── {fileName}
├── content/
│   └── {fileName}
├── firmware/
│   └── {fileName}
└── machines/
    └── {machineId}/
        └── {fileName}
```

### Upload Files

```typescript
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/config";

async function uploadFile(
    file: File,
    path: string,
    onProgress?: (progress: number) => void
): Promise<string> {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress?.(progress);
            },
            (error) => {
                reject(error);
            },
            async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(url);
            }
        );
    });
}

// Usage
const url = await uploadFile(
    file,
    `profile_photos/${userId}/${file.name}`,
    (progress) => console.log(`Upload: ${progress}%`)
);
```

### Delete Files

```typescript
import { ref, deleteObject } from "firebase/storage";
import { storage } from "@/config";

async function deleteFile(path: string): Promise<void> {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
}
```

---

## Algolia Search

### Configuration

```typescript
import algoliasearch from "algoliasearch";

const client = algoliasearch(
    import.meta.env.VITE_ALGOLIA_APP_ID,
    import.meta.env.VITE_ALGOLIA_SEARCH_API_KEY
);
```

### Indexed Collections

| Index | Searchable Attributes |
|-------|----------------------|
| `users` | displayName, email |
| `machines` | name, address, commissionId |
| `bookings` | machineName, userId |
| `content` | name |
| `pricing` | name |
| `gift_cards` | code |
| `system_logs` | machineId, error.message |
| `firmware_packages` | fileName, upstreamVersion |

### Search Implementation

```typescript
const index = client.initIndex("users");

async function searchUsers(query: string, page: number = 0): Promise<SearchResult<User>> {
    const result = await index.search<User>(query, {
        page,
        hitsPerPage: 20
    });

    return {
        hits: result.hits,
        totalHits: result.nbHits,
        page: result.page,
        totalPages: result.nbPages
    };
}
```

---

## Google Maps API

### Places Autocomplete

```typescript
import { useGooglePlaces } from "@/hooks/use-google-places";

function AddressInput() {
    const { predictions, search, selectPlace } = useGooglePlaces();

    const handleInputChange = (value: string) => {
        search(value);
    };

    const handleSelect = async (placeId: string) => {
        const place = await selectPlace(placeId);
        // place contains: address, lat, lng
    };

    return (
        <div>
            <input onChange={(e) => handleInputChange(e.target.value)} />
            <ul>
                {predictions.map((p) => (
                    <li key={p.place_id} onClick={() => handleSelect(p.place_id)}>
                        {p.description}
                    </li>
                ))}
            </ul>
        </div>
    );
}
```

### Geocoding

```typescript
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
    const geocoder = new google.maps.Geocoder();
    const result = await geocoder.geocode({ address });

    if (result.results.length === 0) {
        throw new Error("Address not found");
    }

    const location = result.results[0].geometry.location;
    return {
        lat: location.lat(),
        lng: location.lng()
    };
}
```

---

## Error Handling

### Firebase Errors

```typescript
import { FirebaseError } from "firebase/app";

try {
    await someFirebaseOperation();
} catch (error) {
    if (error instanceof FirebaseError) {
        switch (error.code) {
            case "auth/user-not-found":
                showError("User not found");
                break;
            case "auth/wrong-password":
                showError("Invalid password");
                break;
            case "permission-denied":
                showError("You don't have permission");
                break;
            default:
                showError("An error occurred");
        }
    }
}
```

### Common Error Codes

| Service | Code | Description |
|---------|------|-------------|
| Auth | `auth/user-not-found` | No user with this email |
| Auth | `auth/wrong-password` | Invalid password |
| Auth | `auth/email-already-in-use` | Email taken |
| Auth | `auth/weak-password` | Password too weak |
| Firestore | `permission-denied` | Security rules blocked |
| Firestore | `not-found` | Document doesn't exist |
| Storage | `storage/unauthorized` | Not authorized |
| Storage | `storage/object-not-found` | File doesn't exist |
