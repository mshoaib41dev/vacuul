import { httpsCallable } from "@firebase/functions";
import { FUNCTION, kDebugMode } from "@/config";
// Import Algolia search hook
import useAlgoliaSearch from "@/hooks/use-algolia-search";
import useFirebaseStorage from "@/hooks/use-firebase-storage";
// Import the generic hook
import useFirestoreCollection, { FirestoreQueryConstraints } from "@/hooks/use-firestore-collection";
// Import the User type
import type { UseUser, User } from "@/types/user";

// Define the specific collection path
const USERS_COLLECTION = "users";
// Define the Algolia index name (adjust as needed based on your Firebase extension config)
const USERS_INDEX = "users";

interface UseUserOptions extends FirestoreQueryConstraints {
    // Add any user-specific options here if needed
}

/**
 * Custom Hook specifically for managing CRUD operations for the 'users'
 * Firestore collection with real-time updates and pagination support.
 *
 * This hook uses useFirestoreCollection.
 *
 * @param options - Query options including pagination parameters
 * @returns {UseUser} An object containing user state and functions.
 */
const useUser = (options?: UseUserOptions): UseUser => {
    // Call the generic hook with the specific type (User) and collection path
    const { docs, loading, error, count, countLoading, totalPages, currentPage, hasNextPage, hasPreviousPage, getDocument, updateDocument } =
        useFirestoreCollection<User>(USERS_COLLECTION, {
            // Temporarily removing orderBy to see all users
            // orderByField: "lastUpdated",
            // orderByDirection: "desc",
            getCount: true,
            ...options,
        });

    // Initialize Algolia search hook
    const { searchResults, loading: searchLoading, error: searchError, totalHits: searchTotalHits, search, clearSearch } = useAlgoliaSearch<User>();

    // Get storage functions
    const { uploadFile } = useFirebaseStorage();

    const getUser = async (userId: string): Promise<User | null> => {
        try {
            const doc = await getDocument(userId);
            return doc as User | null;
        } catch (err) {
            if (kDebugMode) {
                console.error("[useUser] Error getting user:", err);
            }
            throw err;
        }
    };

    // Add a new user
    const createUser = async (user: { displayName: string; email: string; password: string }): Promise<void> => {
        try {
            // use firebase cloud function to create user
            const create = httpsCallable(FUNCTION, "createUser");

            await create({
                displayName: user.displayName,
                email: user.email,
                password: user.password,
            });
        } catch (err) {
            if (kDebugMode) {
                console.error("[useUser] Error creating user:", err);
            }
            throw err;
        }
    };

    // Update an existing user
    const updateUser = async (userId: string, user: Omit<Partial<User>, "id" | "createdAt" | "lastUpdated">, selectedFile: File | undefined): Promise<void> => {
        try {
            let imageURL = null;
            if (selectedFile !== null && selectedFile !== undefined) {
                // upload the photo first
                const folderPath = `profile_photos/${userId}`;

                const { uploadPromise } = uploadFile(selectedFile, folderPath, (_) => {});

                imageURL = await uploadPromise;

                if (!imageURL) {
                    throw new Error("Failed to upload image");
                }
            }

            await updateDocument(userId, { ...user, photoURL: imageURL || user.photoURL });
        } catch (err) {
            if (kDebugMode) {
                console.error("[useUser] Error updating user:", err);
            }
            throw err;
        }
    };

    // Disable a user
    const disableUser = async (uid: string): Promise<void> => {
        try {
            const disable = httpsCallable(FUNCTION, "updateUserStatus");
            await disable({
                uid,
                disabled: true,
            });
        } catch (err) {
            if (kDebugMode) {
                console.error("[useUser] Error disabling user:", err);
            }
            throw err;
        }
    };

    // Enable a user
    const enableUser = async (uid: string): Promise<void> => {
        try {
            const disable = httpsCallable(FUNCTION, "updateUserStatus");
            await disable({
                uid,
                disabled: false,
            });
        } catch (err) {
            if (kDebugMode) {
                console.error("[useUser] Error enabling user:", err);
            }
            throw err;
        }
    };

    // Search users using Algolia
    const searchUsers = async (query: string): Promise<void> => {
        try {
            await search(query, USERS_INDEX, {
                attributesToRetrieve: ["objectID", "displayName", "email", "sessions", "disabled", "photoURL"],
                hitsPerPage: 20,
            });
        } catch (err) {
            if (kDebugMode) {
                console.error("[useUser] Error searching users:", err);
            }
            throw err;
        }
    };

    return {
        users: docs,
        loading: loading,
        error,
        count,
        countLoading,
        totalPages,
        currentPage,
        hasNextPage,
        hasPreviousPage,
        getUser,
        createUser,
        updateUser,
        disableUser,
        enableUser,
        // Algolia search functionality
        searchResults,
        searchLoading,
        searchError,
        searchTotalHits,
        searchUsers,
        clearSearch,
    };
};

export default useUser;
