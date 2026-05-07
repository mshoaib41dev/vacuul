import { createContext, useEffect, useReducer, useState } from "react";
import {
    EmailAuthProvider,
    browserLocalPersistence,
    browserSessionPersistence,
    onAuthStateChanged,
    reauthenticateWithCredential,
    setPersistence,
    signInWithEmailAndPassword,
    signOut,
    updatePassword,
    updateProfile,
} from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
//
import { AUTH, FUNCTION, STORAGE } from "../config";

// ----------------------------------------------------------------------

export type UserProfile = {
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    uid: string;
    verified: boolean;
} | null;

type AuthState = {
    isAuthenticated: boolean;
    isInitialized: boolean;
    user: any | null;
};

type AuthContextType = AuthState & {
    method: "firebase";
    login: (email: string, password: string, rememberMe?: boolean) => Promise<any>;
    resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
    logout: () => Promise<void>;
    reload: () => Promise<void>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
    updateName: (name: string) => Promise<void>;
    updatePhotoURL: (file: File) => Promise<string>;
    user: {
        id?: string;
        email?: string | null;
        displayName?: string | null;
        photoURL?: string | null;
        verified?: boolean;
    };
};

type AuthAction = {
    type: "INITIALISE";
    payload: {
        isAuthenticated: boolean;
        user: any | null;
    };
};

type AuthProviderProps = {
    children: React.ReactNode;
};

const initialState: AuthState = {
    isAuthenticated: false,
    isInitialized: false,
    user: null,
};

const reducer = (state: AuthState, action: AuthAction): AuthState => {
    if (action.type === "INITIALISE") {
        const { isAuthenticated, user } = action.payload;
        return {
            ...state,
            isAuthenticated,
            isInitialized: true,
            user,
        };
    }
    return state;
};

const AuthContext = createContext<AuthContextType>({
    ...initialState,
    method: "firebase",
    login: () => Promise.resolve(),
    resetPassword: () => Promise.resolve({ success: true, message: "" }),
    logout: () => Promise.resolve(),
    reload: () => Promise.resolve(),
    changePassword: () => Promise.resolve(),
    updateName: () => Promise.resolve(),
    updatePhotoURL: () => Promise.resolve(""),
    user: {},
});

// ----------------------------------------------------------------------

function AuthProvider({ children }: AuthProviderProps) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [profile, setProfile] = useState<UserProfile>(null);

    // Initialize Firebase Functions
    const functions = FUNCTION;
    const sendPasswordResetEmailFn = httpsCallable(functions, "sendPasswordResetEmail");

    useEffect(
        () =>
            onAuthStateChanged(AUTH, (user) => {
                if (user) {
                    setProfile({
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        uid: user.uid,
                        verified: user.emailVerified,
                    });
                    dispatch({
                        type: "INITIALISE",
                        payload: { isAuthenticated: true, user },
                    });
                } else {
                    dispatch({
                        type: "INITIALISE",
                        payload: { isAuthenticated: false, user: null },
                    });
                }
            }),
        [dispatch],
    );

    const login = async (email: string, password: string, rememberMe: boolean = false) => {
        try {
            const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
            await setPersistence(AUTH, persistence);
            return await signInWithEmailAndPassword(AUTH, email, password);
        } catch (error: any) {
            const errorCode = error?.code;
            
            let errorMessage: string;
            
            switch (errorCode) {
                case "auth/email-already-in-use":
                    errorMessage = "This email address is already associated with an existing account.";
                    break;
                case "auth/invalid-email":
                    errorMessage = "Please enter a valid email address.";
                    break;
                case "auth/operation-not-allowed":
                    errorMessage = "Email/password authentication is not enabled. Please contact support.";
                    break;
                case "auth/weak-password":
                    errorMessage = "Password is too weak. Please choose a stronger password.";
                    break;
                case "auth/user-not-found":
                    errorMessage = "No account found with this email address.";
                    break;
                case "auth/wrong-password":
                    errorMessage = "Incorrect password. Please try again.";
                    break;
                case "auth/too-many-requests":
                    errorMessage = "Too many failed login attempts. Please try again later.";
                    break;
                case "auth/invalid-credential":
                    errorMessage = "Invalid login credentials. Please check your email and password.";
                    break;
                case "auth/uid-already-exists":
                    errorMessage = "User account already exists.";
                    break;
                case "auth/unauthorized-continue-uri":
                    errorMessage = "The continue URL is not authorized.";
                    break;
                default:
                    errorMessage = "Login failed. Please try again.";
                    break;
            }
            
            const customError = new Error(errorMessage);
            customError.name = 'AuthError';
            throw customError;
        }
    };

    const resetPassword = async (email: string) => {
        const result = await sendPasswordResetEmailFn({ email });
        const response = result.data as { success: boolean; message: string };
        if (!response.success) {
            throw new Error(response.message);
        }
        return response;
    };

    const logout = () => signOut(AUTH);

    const reload = async () => {
        if (!AUTH.currentUser) return;

        await AUTH.currentUser.reload();
        const usr = AUTH.currentUser;

        if (usr) {
            setProfile({
                email: usr.email,
                displayName: usr.displayName,
                photoURL: usr.photoURL,
                uid: usr.uid,
                verified: usr.emailVerified,
            });
        }
    };

    const changePassword = async (currentPassword: string, newPassword: string) => {
        const user = AUTH.currentUser;
        if (!user || !user.email) throw new Error("No user logged in");

        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        const creds = await reauthenticateWithCredential(user, credential);

        if (creds.user !== AUTH.currentUser) {
            throw new Error("Invalid credentials");
        }
        await updatePassword(user, newPassword);
    };

    const updateName = (name: string) => {
        if (!AUTH.currentUser) throw new Error("No user logged in");
        return updateProfile(AUTH.currentUser, {
            displayName: name,
        });
    };

    const updatePhotoURL = async (file: File): Promise<string> => {
        if (!AUTH.currentUser) throw new Error("No user logged in");

        const userId = AUTH.currentUser.uid;
        const fileExtension = file.name.split(".").pop();
        const fileName = `profile_${Date.now()}.${fileExtension}`;
        const storageRef = ref(STORAGE, `profile_photos/${userId}/${fileName}`);

        try {
            // Upload the file
            const snapshot = await uploadBytes(storageRef, file);

            // Get the download URL
            const downloadURL = await getDownloadURL(snapshot.ref);

            // Update the user's profile with the new photo URL
            await updateProfile(AUTH.currentUser, {
                photoURL: downloadURL,
            });

            // Update the local profile state
            setProfile((prev) => (prev ? { ...prev, photoURL: downloadURL } : null));

            return downloadURL;
        } catch (error) {
            console.error("Error uploading profile image:", error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                ...state,
                method: "firebase",
                user: {
                    id: profile?.uid,
                    email: profile?.email,
                    displayName: profile?.displayName,
                    photoURL: profile?.photoURL,
                    verified: profile?.verified,
                },
                login,
                resetPassword,
                logout,
                reload,
                changePassword,
                updateName,
                updatePhotoURL,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export { AuthContext, AuthProvider };
