import { useCallback } from "react";
import {
    deleteObject,
    // Optional: For deleting files
    getDownloadURL,
    ref,
    uploadBytesResumable,
} from "firebase/storage";
import type { UploadMetadata } from "firebase/storage";
// Assuming STORAGE is your initialized Storage instance (getStorage())
// If not, you can call getStorage() directly inside the hook.
import { STORAGE } from "@/config";

// Example if you export it

// Define the structure of the returned object for clarity
export interface UseFirebaseStorageReturn {
    deleteFile: (path: string) => Promise<void>; // Optional delete functionality
    uploadFile: (
        file: File,
        folderPath: string,
        onProgress: (progress: number) => void,
        metadata?: UploadMetadata,
    ) => { cancelUpload: () => void; uploadPromise: Promise<string> }; // Returns download URL on success, null on failure
}

/**
 * Custom Hook to manage file uploads to Firebase Storage with progress tracking.
 *
 * @returns {UseFirebaseStorageReturn} An object containing state and functions for storage operations.
 */
const useFirebaseStorage = (): UseFirebaseStorageReturn => {
    // --- Upload File ---
    const uploadFile = useCallback(
        (
            file: File,
            folderPath: string,
            onProgress: (progress: number) => void,
            metadata?: UploadMetadata,
        ): { cancelUpload: () => void; uploadPromise: Promise<string> } => {
            const storageRef = ref(STORAGE, `${folderPath}/${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file, metadata);

            // Create a promise that resolves with the download URL
            const uploadPromise = new Promise<string>((resolve, reject) => {
                // Listen for upload progress
                uploadTask.on(
                    "state_changed",
                    (snapshot) => {
                        // Get upload progress (rounded to integer)
                        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                        onProgress(progress);
                    },
                    (error) => {
                        console.error("Upload failed:", error);
                        onProgress(0); // Reset progress on failure
                        reject(error);
                    },
                    async () => {
                        // Upload completed successfully
                        try {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            onProgress(100);
                            resolve(downloadURL); // Resolve the promise with the URL
                        } catch (firestoreError) {
                            console.error("Failed to get download URL:", firestoreError);
                            reject(firestoreError);
                        }
                    },
                );
            });

            // Return both cancel function and promise
            return {
                cancelUpload: () => {
                    uploadTask.cancel();
                    onProgress(0); // Reset progress when cancelled
                },
                uploadPromise,
            };
        },
        [STORAGE],
    );

    // --- Optional: Delete File ---
    const deleteFile = useCallback(
        async (path: string): Promise<void> => {
            if (!path) {
                console.error("[useFirebaseStorage] Delete requires a valid path.");
                throw new Error("Delete requires a valid path.");
            }
            console.log(`[useFirebaseStorage] Attempting to delete: ${path}`);
            const fileRef = ref(STORAGE, path);
            try {
                await deleteObject(fileRef);
                console.log(`[useFirebaseStorage] Successfully deleted: ${path}`);
                // Optionally reset state if the deleted file was the last uploaded one
                // if (downloadURL && downloadURL.includes(path)) {
                //   resetState();
                // }
            } catch (err) {
                console.error(`[useFirebaseStorage] Error deleting file ${path}:`, err);
                throw err; // Re-throw error for component handling
            }
        },
        [STORAGE], // Dependency: storage instance
    );

    // Return state and control functions
    return {
        deleteFile, // Include delete function
        uploadFile,
    };
};

export default useFirebaseStorage;
