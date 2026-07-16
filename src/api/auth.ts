import { apiFetch } from "@/lib/api-client";
import type { AuthSessionResponse, AuthUser } from "@/stores/auth-store";

export type OtpPurpose = "EMAIL_VERIFICATION" | "PASSWORD_RESET";

export type SuccessMessageResponse = {
    success: boolean;
    message: string;
};

export type SuccessResponse = {
    success: boolean;
};

export type LoginRequest = {
    email: string;
    password: string;
};

export type RefreshRequest = {
    refreshToken: string;
};

export type LogoutRequest = {
    refreshToken: string;
};

export type ResendOtpRequest = {
    email: string;
    purpose: OtpPurpose;
};

export type ResetPasswordRequest = {
    email: string;
    otp: string;
    newPassword: string;
};

export type SendPasswordResetRequest = {
    email: string;
};

export type SendVerificationRequest = {
    email: string;
};

export type VerifyEmailRequest = {
    email: string;
    otp: string;
};

export type UpdateMeRequest = {
    displayName?: string;
    languageCode?: "en" | "de";
};

type RawAuthUser = Record<string, unknown>;

type RawAuthUserResponse =
    | RawAuthUser
    | {
          user?: RawAuthUser;
          profile?: RawAuthUser;
      };

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const assertEmail = (email: string) => {
    if (!normalizeEmail(email)) {
        throw new Error("Email is required.");
    }
};

const assertPassword = (password: string) => {
    if (!password) {
        throw new Error("Password is required.");
    }
};

const assertNewPassword = (password: string) => {
    if (!password || password.length < 8) {
        throw new Error("Password must be at least 8 characters.");
    }
};

const assertOtp = (otp: string) => {
    if (!/^\d{6}$/.test(otp.trim())) {
        throw new Error("OTP must be a 6-digit code.");
    }
};

const toOptionalString = (value: unknown): string | undefined => {
    return typeof value === "string" && value.trim() ? value : undefined;
};

const extractAuthUser = (response: RawAuthUserResponse): RawAuthUser => {
    if ("user" in response && response.user && typeof response.user === "object") {
        return response.user as RawAuthUser;
    }

    if ("profile" in response && response.profile && typeof response.profile === "object") {
        return response.profile as RawAuthUser;
    }

    return response as RawAuthUser;
};

const normalizeAuthUser = (response: RawAuthUserResponse): AuthUser => {
    const user = extractAuthUser(response);
    const uid = toOptionalString(user.uid ?? user.id);
    const photoURL = user.photoURL ?? user.photoUrl;

    return {
        id: toOptionalString(user.id ?? uid),
        uid,
        email: typeof user.email === "string" ? user.email : undefined,
        displayName: typeof user.displayName === "string" ? user.displayName : undefined,
        photoURL: typeof photoURL === "string" ? photoURL : undefined,
        languageCode: typeof user.languageCode === "string" ? user.languageCode : undefined,
        verified: typeof user.verified === "boolean" ? user.verified : undefined,
        role: typeof user.role === "string" ? user.role : undefined,
        roleId: toOptionalString(user.roleId),
    };
};

const assertUpdateMe = ({ displayName, languageCode }: UpdateMeRequest) => {
    if (displayName !== undefined && !displayName.trim()) {
        throw new Error("Display name cannot be empty.");
    }

    if (languageCode !== undefined && languageCode !== "en" && languageCode !== "de") {
        throw new Error("Language code must be en or de.");
    }
};

export const authApi = {
    getMe: async (): Promise<AuthUser> => {
        const response = await apiFetch<RawAuthUserResponse>("/v1/auth/me", {
            method: "GET",
        });

        return normalizeAuthUser(response);
    },

    updateMe: async (profile: UpdateMeRequest): Promise<AuthUser> => {
        assertUpdateMe(profile);

        const response = await apiFetch<RawAuthUserResponse>("/v1/auth/me", {
            method: "PATCH",
            body: {
                displayName: profile.displayName?.trim(),
                languageCode: profile.languageCode,
            },
        });

        return normalizeAuthUser(response);
    },

    login: ({ email, password }: LoginRequest) => {
        assertEmail(email);
        assertPassword(password);

        return apiFetch<AuthSessionResponse>("/v1/auth/login", {
            method: "POST",
            body: {
                email: normalizeEmail(email),
                password,
            },
            skipAuth: true,
            retryOnUnauthorized: false,
        });
    },
    logout: ({ refreshToken }: LogoutRequest) => {
        if (!refreshToken) {
            throw new Error("Refresh token is required.");
        }

        return apiFetch<SuccessResponse>("/v1/auth/logout", {
            method: "POST",
            body: { refreshToken },
            retryOnUnauthorized: false,
        });
    },

    resendOtp: ({ email, purpose }: ResendOtpRequest) => {
        assertEmail(email);

        return apiFetch<SuccessMessageResponse>("/v1/auth/resend-otp", {
            method: "POST",
            body: {
                email: normalizeEmail(email),
                purpose,
            },
            skipAuth: true,
            retryOnUnauthorized: false,
        });
    },

    resetPassword: ({ email, otp, newPassword }: ResetPasswordRequest) => {
        assertEmail(email);
        assertOtp(otp);
        assertNewPassword(newPassword);

        return apiFetch<SuccessResponse>("/v1/auth/reset-password", {
            method: "POST",
            body: {
                email: normalizeEmail(email),
                otp: otp.trim(),
                newPassword,
            },
            skipAuth: true,
            retryOnUnauthorized: false,
        });
    },

    sendPasswordReset: ({ email }: SendPasswordResetRequest) => {
        assertEmail(email);

        return apiFetch<SuccessMessageResponse>("/v1/auth/send-password-reset", {
            method: "POST",
            body: {
                email: normalizeEmail(email),
            },
            skipAuth: true,
            retryOnUnauthorized: false,
        });
    },

    sendVerification: ({ email }: SendVerificationRequest) => {
        assertEmail(email);

        return apiFetch<SuccessMessageResponse>("/v1/auth/send-verification", {
            method: "POST",
            body: {
                email: normalizeEmail(email),
            },
            skipAuth: true,
            retryOnUnauthorized: false,
        });
    },

    verifyEmail: ({ email, otp }: VerifyEmailRequest) => {
        assertEmail(email);
        assertOtp(otp);

        return apiFetch<SuccessResponse>("/v1/auth/verify-email", {
            method: "POST",
            body: {
                email: normalizeEmail(email),
                otp: otp.trim(),
            },
            skipAuth: true,
            retryOnUnauthorized: false,
        });
    },
};
