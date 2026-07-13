import { apiFetch } from "@/lib/api-client";
import type { User } from "@/types/user";

export type ListUsersRequest = {
    search?: string;
    page?: number;
    limit?: number;
};

export type ListUsersResponse = {
    users: User[];
    total: number;
    page: number;
    totalPages: number;
};

export type CreateUserRequest = {
    email: string;
    displayName: string;
    password: string;
    roleId?: string | null;
};

export type CreateUserResponse = {
    success: boolean;
    uid: string;
};

export type UpdateUserStatusRequest = {
    uid: string;
    disabled: boolean;
};

export type UpdateUserRequest = {
    uid: string;
    displayName?: string;
    sessions?: number;
    roleId?: string | null;
    photoURL?: string | null;
    disabled?: boolean;
};

export type SuccessResponse = {
    success: boolean;
};

type RawUser = Record<string, unknown>;

type RawListUsersResponse = {
    users?: RawUser[];
    total?: number | string;
    page?: number | string;
    totalPages?: number | string;
};

type RawUpdateUserResponse =
    | RawUser
    | {
          success?: boolean;
          user?: RawUser;
      };

const toPositiveInteger = (value: number | undefined, fallback: number): number => {
    return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;
};

const toNumber = (value: number | string | undefined, fallback: number): number => {
    const parsed = Number(value ?? fallback);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const assertEmail = (email: string) => {
    if (!normalizeEmail(email)) {
        throw new Error("Email is required.");
    }
};

const assertUserId = (uid: string) => {
    if (!uid.trim()) {
        throw new Error("User ID is required.");
    }
};

const removeUndefined = <T extends Record<string, unknown>>(payload: T): Partial<T> => {
    return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)) as Partial<T>;
};

const buildUpdateUserPayload = ({ displayName, sessions, roleId, photoURL }: Omit<UpdateUserRequest, "uid" | "disabled">): Record<string, unknown> => {
    return removeUndefined({
        displayName: displayName?.trim(),
        sessions,
        roleId,
        photoUrl: photoURL,
    });
};

const normalizeSuccessResponse = (response: RawUpdateUserResponse | undefined): SuccessResponse => {
    if (response && "success" in response && response.success === false) {
        throw new Error("User update failed.");
    }

    return {
        success: true,
    };
};

const hasNestedUser = (value: unknown): value is { user: RawUser } => {
    if (!value || typeof value !== "object" || !("user" in value)) return false;

    const user = (value as { user?: unknown }).user;
    return Boolean(user && typeof user === "object");
};

const extractRawUser = (response: RawUser | { user?: RawUser }): RawUser => {
    return hasNestedUser(response) ? response.user : (response as RawUser);
};

const normalizeUser = (user: RawUser, index: number): User => {
    const id = String(user.id ?? user.uid ?? user._id ?? user.objectID ?? `user-${index}`);
    const photoURL = user.photoURL ?? user.photoUrl;

    return {
        ...user,
        id,
        displayName: typeof user.displayName === "string" ? user.displayName : undefined,
        email: typeof user.email === "string" ? user.email : undefined,
        photoURL: typeof photoURL === "string" ? photoURL : undefined,
        stripeId: typeof user.stripeId === "string" ? user.stripeId : undefined,
        stripeLink: typeof user.stripeLink === "string" ? user.stripeLink : undefined,
        roleId: typeof user.roleId === "string" ? user.roleId : null,
        disabled: typeof user.disabled === "boolean" ? user.disabled : Boolean(user.disabled),
        sessions: toNumber(user.sessions as number | string | undefined, 0),
    };
};

export const usersApi = {
    listUsers: async ({ search, page, limit }: ListUsersRequest = {}): Promise<ListUsersResponse> => {
        const currentPage = toPositiveInteger(page, 1);
        const pageSize = toPositiveInteger(limit, 20);
        const params = new URLSearchParams({
            page: String(currentPage),
            limit: String(pageSize),
        });
        const normalizedSearch = search?.trim();

        if (normalizedSearch) {
            params.set("search", normalizedSearch);
        }

        const response = await apiFetch<RawListUsersResponse>(`/v1/api/users?${params.toString()}`, {
            method: "GET",
        });
        const total = toNumber(response.total, 0);
        const users = (response.users ?? []).map(normalizeUser);

        return {
            users,
            total,
            page: toNumber(response.page, currentPage),
            totalPages: toNumber(response.totalPages, Math.ceil(total / pageSize)),
        };
    },

    getUser: async (userId: string): Promise<User | null> => {
        assertUserId(userId);

        const response = await apiFetch<RawUser | { user?: RawUser }>(`/v1/api/users/${encodeURIComponent(userId)}`, {
            method: "GET",
        });

        return normalizeUser(extractRawUser(response), 0);
    },

    createUser: ({ email, displayName, password, roleId }: CreateUserRequest): Promise<CreateUserResponse> => {
        assertEmail(email);

        if (!displayName.trim()) {
            throw new Error("Display name is required.");
        }

        if (!password || password.length < 8) {
            throw new Error("Password must be at least 8 characters.");
        }

        return apiFetch<CreateUserResponse>("/v1/api/createUser", {
            method: "POST",
            body: {
                email: normalizeEmail(email),
                displayName: displayName.trim(),
                password,
                roleId: roleId || undefined,
            },
        });
    },

    updateUserStatus: ({ uid, disabled }: UpdateUserStatusRequest): Promise<SuccessResponse> => {
        assertUserId(uid);

        return apiFetch<SuccessResponse>("/v1/api/updateUserStatus", {
            method: "PATCH",
            body: {
                uid,
                disabled,
            },
        });
    },

    updateUser: async ({ uid, disabled, ...profileFields }: UpdateUserRequest): Promise<SuccessResponse> => {
        assertUserId(uid);

        const payload = buildUpdateUserPayload(profileFields);
        const attemptedProfileUpdate = Object.keys(payload).length > 0;

        if (attemptedProfileUpdate) {
            const response = await apiFetch<RawUpdateUserResponse>(`/v1/api/users/${encodeURIComponent(uid)}`, {
                method: "PUT",
                body: payload,
            });

            return normalizeSuccessResponse(response);
        }

        if (typeof disabled === "boolean") {
            return usersApi.updateUserStatus({ uid, disabled });
        }

        throw new Error("No supported user update fields were provided.");
    },

    deleteUserAccount: async (uid: string): Promise<SuccessResponse> => {
        assertUserId(uid);

        return apiFetch<SuccessResponse>("/v1/api/deleteUserAccount", {
            method: "DELETE",
            body: {
                uid,
            },
        });
    },
};
