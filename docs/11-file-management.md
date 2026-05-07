# File Management

## Overview

The application uses Firebase Storage for file management, including profile photos, content media, and firmware packages.

## Storage Structure

```
Firebase Storage
├── profile_photos/
│   └── {userId}/
│       └── {filename}
├── content/
│   └── {filename}
├── firmware/
│   └── {filename}
└── machines/
    └── {machineId}/
        └── {filename}
```

## useFirebaseStorage Hook

### Interface

```typescript
interface UseFirebaseStorageReturn {
    uploadFile: (file: File, path: string) => Promise<string>;
    deleteFile: (path: string) => Promise<void>;
    uploadProgress: number;
    isUploading: boolean;
    error: Error | null;
}
```

### Basic Usage

```typescript
import { useFirebaseStorage } from "@/hooks/use-firebase-storage";

function FileUploader() {
    const {
        uploadFile,
        deleteFile,
        uploadProgress,
        isUploading,
        error
    } = useFirebaseStorage();

    const handleUpload = async (file: File) => {
        try {
            const url = await uploadFile(file, `content/${file.name}`);
            console.log("File URL:", url);
        } catch (err) {
            console.error("Upload failed:", err);
        }
    };

    return (
        <div>
            <input
                type="file"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                }}
                disabled={isUploading}
            />
            {isUploading && (
                <ProgressBar value={uploadProgress} max={100} />
            )}
            {error && <ErrorMessage>{error.message}</ErrorMessage>}
        </div>
    );
}
```

## File Upload Patterns

### Profile Photo Upload

```typescript
function ProfilePhotoUpload({ userId }: { userId: string }) {
    const { uploadFile, isUploading, uploadProgress } = useFirebaseStorage();
    const { updatePhotoURL } = useAuth();

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB
            toast.error("Image must be less than 5MB");
            return;
        }

        try {
            const path = `profile_photos/${userId}/${Date.now()}_${file.name}`;
            const url = await uploadFile(file, path);
            await updatePhotoURL(url);
            toast.success("Photo updated");
        } catch (error) {
            toast.error("Failed to upload photo");
        }
    };

    return (
        <div>
            <label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    disabled={isUploading}
                    className="hidden"
                />
                <Button as="span" disabled={isUploading}>
                    {isUploading ? `Uploading ${uploadProgress}%` : "Change Photo"}
                </Button>
            </label>
        </div>
    );
}
```

### Video Content Upload

```typescript
function VideoUpload({ onUploadComplete }: { onUploadComplete: (url: string) => void }) {
    const { uploadFile, isUploading, uploadProgress } = useFirebaseStorage();

    const handleVideoUpload = async (file: File) => {
        // Validate video
        if (!file.type.startsWith("video/")) {
            toast.error("Please select a video file");
            return;
        }

        if (file.size > 100 * 1024 * 1024) { // 100MB
            toast.error("Video must be less than 100MB");
            return;
        }

        try {
            const path = `content/${Date.now()}_${file.name}`;
            const url = await uploadFile(file, path);
            onUploadComplete(url);
            toast.success("Video uploaded");
        } catch (error) {
            toast.error("Failed to upload video");
        }
    };

    return (
        <FileUploadZone
            accept="video/*"
            onDrop={(files) => handleVideoUpload(files[0])}
            isUploading={isUploading}
            progress={uploadProgress}
        />
    );
}
```

### Firmware Package Upload

```typescript
function FirmwareUpload() {
    const { uploadFile, isUploading, uploadProgress } = useFirebaseStorage();
    const { createItem } = useFirmwareUpdate();

    const handleFirmwareUpload = async (
        file: File,
        version: { upstream: string; debian: string }
    ) => {
        try {
            // Upload file
            const path = `firmware/${Date.now()}_${file.name}`;
            const url = await uploadFile(file, path);

            // Create database record
            await createItem({
                file: url,
                fileName: file.name,
                upstreamVersion: version.upstream,
                debianRevision: version.debian,
                uploadedBy: auth.currentUser?.uid
            });

            toast.success("Firmware uploaded");
        } catch (error) {
            toast.error("Failed to upload firmware");
        }
    };

    return (
        <FirmwareUploadForm
            onSubmit={handleFirmwareUpload}
            isUploading={isUploading}
            progress={uploadProgress}
        />
    );
}
```

## File Validation

### Common Validators

```typescript
// File size validation
function validateFileSize(file: File, maxSizeMB: number): boolean {
    const maxBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxBytes;
}

// File type validation
function validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.some(type => {
        if (type.endsWith("/*")) {
            const category = type.replace("/*", "");
            return file.type.startsWith(category);
        }
        return file.type === type;
    });
}

// Image dimensions validation
async function validateImageDimensions(
    file: File,
    maxWidth: number,
    maxHeight: number
): Promise<boolean> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            resolve(img.width <= maxWidth && img.height <= maxHeight);
        };
        img.onerror = () => resolve(false);
        img.src = URL.createObjectURL(file);
    });
}
```

### Usage

```typescript
async function handleFileSelect(file: File) {
    // Size check
    if (!validateFileSize(file, 10)) {
        toast.error("File must be less than 10MB");
        return;
    }

    // Type check
    if (!validateFileType(file, ["image/*", "video/*"])) {
        toast.error("Only images and videos are allowed");
        return;
    }

    // Image dimensions (if image)
    if (file.type.startsWith("image/")) {
        const validDimensions = await validateImageDimensions(file, 4096, 4096);
        if (!validDimensions) {
            toast.error("Image dimensions must be 4096x4096 or less");
            return;
        }
    }

    // Proceed with upload
    await uploadFile(file, `content/${file.name}`);
}
```

## File Deletion

```typescript
import { ref, deleteObject } from "firebase/storage";
import { storage } from "@/config";

async function deleteStorageFile(path: string): Promise<void> {
    const fileRef = ref(storage, path);
    await deleteObject(fileRef);
}

// Usage in component
function ContentItem({ content }: { content: Content }) {
    const { deleteItem } = useContent();

    const handleDelete = async () => {
        try {
            // Delete from storage
            await deleteStorageFile(content.url);

            // Delete from database
            await deleteItem(content.id);

            toast.success("Content deleted");
        } catch (error) {
            toast.error("Failed to delete content");
        }
    };

    return (
        <div>
            <video src={content.url} />
            <Button onClick={handleDelete}>Delete</Button>
        </div>
    );
}
```

## FileUpload Component

### Interface

```typescript
interface FileUploadProps {
    accept?: string;
    maxSize?: number;          // in bytes
    multiple?: boolean;
    onUpload: (files: File[]) => void;
    isUploading?: boolean;
    progress?: number;
    disabled?: boolean;
}
```

### Usage

```typescript
<FileUpload
    accept="image/*,video/*"
    maxSize={50 * 1024 * 1024}  // 50MB
    multiple={false}
    onUpload={(files) => handleUpload(files[0])}
    isUploading={isUploading}
    progress={uploadProgress}
/>
```

## Drag and Drop Upload

```typescript
function DropZone({ onDrop, accept }: { onDrop: (files: File[]) => void; accept: string }) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        onDrop(files);
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed p-8 ${
                isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
        >
            <p>Drag and drop files here</p>
        </div>
    );
}
```

## Storage Security Rules

Firebase Storage security rules control access:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile photos - users can manage their own
    match /profile_photos/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // Content - authenticated users can read, admins can write
    match /content/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    // Firmware - authenticated users can read, admins can write
    match /firmware/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    // Machine files - machine owners can manage
    match /machines/{machineId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if isMachineOwner(machineId);
    }

    function isAdmin() {
      return request.auth.token.admin == true;
    }

    function isMachineOwner(machineId) {
      return request.auth.uid == firestore.get(
        /databases/(default)/documents/machines/$(machineId)
      ).data.ownerUserId;
    }
  }
}
```

## Best Practices

1. **Always validate files** before uploading (size, type, dimensions)
2. **Use unique filenames** to prevent overwrites (include timestamp)
3. **Clean up storage** when deleting database records
4. **Show upload progress** for better UX
5. **Handle errors gracefully** with user-friendly messages
6. **Use appropriate file paths** for organization
7. **Set proper security rules** to control access
