import { createContext, useEffect } from "react";
import type { ReactNode } from "react";
import { authApi, type OtpPurpose, type SuccessMessageResponse, type SuccessResponse } from "@/api/auth";
import { uploadsApi } from "@/api/uploads";
import { refreshAuthSession } from "@/lib/api-client";
import { createAuthSession, useAuthStore } from "@/stores/auth-store";
import type { AuthSession, AuthStorageMode, AuthUser } from "@/stores/auth-store";

type AuthContextUser = AuthUser;

type AuthState = {
    isAuthenticated: boolean;
    isInitialized: boolean;
    user: AuthContextUser;
};

type AuthContextType = AuthState & {
    method: "node";
    login: (email: string, password: string, rememberMe?: boolean) => Promise<AuthSession>;
    resetPassword: (email: string) => Promise<SuccessMessageResponse>;
    sendPasswordReset: (email: string) => Promise<SuccessMessageResponse>;
    resetPasswordWithOtp: (email: string, otp: string, newPassword: string) => Promise<SuccessResponse>;
    sendVerification: (email: string) => Promise<SuccessMessageResponse>;
    verifyEmail: (email: string, otp: string) => Promise<SuccessResponse>;
    resendOtp: (email: string, purpose: OtpPurpose) => Promise<SuccessMessageResponse>;
    logout: () => Promise<void>;
    reload: () => Promise<void>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
    updateName: (name: string) => Promise<void>;
    updatePhotoURL: (file: File) => Promise<string>;
};

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    isInitialized: false,
    user: {},
    method: "node",
    login: () => Promise.reject(new Error("AuthProvider is not mounted.")),
    resetPassword: () => Promise.reject(new Error("AuthProvider is not mounted.")),
    sendPasswordReset: () => Promise.reject(new Error("AuthProvider is not mounted.")),
    resetPasswordWithOtp: () => Promise.reject(new Error("AuthProvider is not mounted.")),
    sendVerification: () => Promise.reject(new Error("AuthProvider is not mounted.")),
    verifyEmail: () => Promise.reject(new Error("AuthProvider is not mounted.")),
    resendOtp: () => Promise.reject(new Error("AuthProvider is not mounted.")),
    logout: () => Promise.reject(new Error("AuthProvider is not mounted.")),
    reload: () => Promise.reject(new Error("AuthProvider is not mounted.")),
    changePassword: () => Promise.reject(new Error("AuthProvider is not mounted.")),
    updateName: () => Promise.reject(new Error("AuthProvider is not mounted.")),
    updatePhotoURL: () => Promise.reject(new Error("AuthProvider is not mounted.")),
});

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const assertEmailAndPassword = (email: string, password: string) => {
    if (!normalizeEmail(email)) {
        throw new Error("Email is required.");
    }

    if (!password) {
        throw new Error("Password is required.");
    }
};

function AuthProvider({ children }: { children: ReactNode }) {
    const session = useAuthStore((state) => state.session);
    const isInitialized = useAuthStore((state) => state.isInitialized);
    const setInitialized = useAuthStore((state) => state.setInitialized);
    const setSession = useAuthStore((state) => state.setSession);
    const updateStoredUser = useAuthStore((state) => state.updateUser);
    const clearSession = useAuthStore((state) => state.clearSession);

    useEffect(() => {
        const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
            setInitialized(true);
        });

        if (useAuthStore.persist.hasHydrated()) {
            setInitialized(true);
        }

        return unsubscribe;
    }, [setInitialized]);

    const login = async (email: string, password: string, rememberMe = false): Promise<AuthSession> => {
        assertEmailAndPassword(email, password);

        const normalizedEmail = normalizeEmail(email);
        const storageMode: AuthStorageMode = rememberMe ? "local" : "session";

        const response = await authApi.login({ email: normalizedEmail, password });

        const nextSession = createAuthSession({
            ...response,
            user: {
                email: normalizedEmail,
                ...response.user,
            },
        });
        setSession(nextSession, storageMode);

        return nextSession;
    };

    const sendPasswordReset = async (email: string): Promise<SuccessMessageResponse> => {
        const normalizedEmail = normalizeEmail(email);
        return authApi.sendPasswordReset({ email: normalizedEmail });
    };

    const resetPassword = sendPasswordReset;

    const resetPasswordWithOtp = async (email: string, otp: string, newPassword: string): Promise<SuccessResponse> => {
        return authApi.resetPassword({ email: normalizeEmail(email), otp, newPassword });
    };

    const sendVerification = async (email: string): Promise<SuccessMessageResponse> => {
        return authApi.sendVerification({ email: normalizeEmail(email) });
    };

    const verifyEmail = async (email: string, otp: string): Promise<SuccessResponse> => {
        return authApi.verifyEmail({ email: normalizeEmail(email), otp });
    };

    const resendOtp = async (email: string, purpose: OtpPurpose): Promise<SuccessMessageResponse> => {
        return authApi.resendOtp({ email: normalizeEmail(email), purpose });
    };

    const logout = async (): Promise<void> => {
        const refreshToken = useAuthStore.getState().session?.refreshToken;
        let logoutError: unknown;

        try {
            if (refreshToken) {
                await authApi.logout({ refreshToken });
            }
        } catch (error) {
            logoutError = error;
        } finally {
            clearSession();
        }

        if (logoutError) {
            throw logoutError instanceof Error ? logoutError : new Error("Logout failed.");
        }
    };

    const reload = async (): Promise<void> => {
        await refreshAuthSession();
    };

    const changePassword = async (_currentPassword: string, _newPassword: string): Promise<void> => {
        throw new Error("Password change requires a Node.js API endpoint mapping.");
    };

    const updateName = async (_name: string): Promise<void> => {
        throw new Error("Profile name update requires a Node.js API endpoint mapping.");
    };

    const updatePhotoURL = async (file: File): Promise<string> => {
        const { url } = await uploadsApi.uploadProfilePhoto(file);
        updateStoredUser({ photoURL: url });
        return url;
    };

    const user: AuthContextUser = {
        ...session?.user,
        id: session?.user?.id ?? session?.uid,
        uid: session?.user?.uid ?? session?.uid,
        role: session?.user?.role ?? session?.role,
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated: Boolean(session?.token),
                isInitialized,
                user,
                method: "node",
                login,
                resetPassword,
                sendPasswordReset,
                resetPasswordWithOtp,
                sendVerification,
                verifyEmail,
                resendOtp,
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
