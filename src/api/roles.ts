import { apiFetch } from "@/lib/api-client";
import type { PermissionMap, Role } from "@/types/role";
import { createEmptyPermissionMap } from "@/types/role";

export type ListRolesResponse = {
    roles: Role[];
};

export type CreateRoleRequest = {
    name: string;
    permissions: PermissionMap;
    isSystemRole?: boolean;
};

export type UpdateRoleRequest = {
    id: string;
    role: Omit<Partial<Role>, "id" | "createdAt" | "updatedAt">;
};

export type DeleteRoleResponse = {
    success: boolean;
};

type RawRole = Record<string, unknown>;

type RawListRolesResponse =
    | RawRole[]
    | {
          roles?: RawRole[];
          items?: RawRole[];
          data?: RawRole[];
      };

type RawRoleResponse =
    | RawRole
    | {
          role?: RawRole;
          data?: RawRole;
      };

const assertRoleId = (id: string) => {
    if (!id.trim()) {
        throw new Error("Role ID is required.");
    }
};

const assertRoleName = (name: string) => {
    if (!name.trim()) {
        throw new Error("Role name is required.");
    }
};

const assertPermissions = (permissions: unknown) => {
    if (!permissions || typeof permissions !== "object" || Array.isArray(permissions)) {
        throw new Error("Role permissions are required.");
    }
};

const normalizePermissions = (permissions: unknown): PermissionMap => {
    return {
        ...createEmptyPermissionMap(),
        ...(permissions && typeof permissions === "object" ? permissions : {}),
    } as PermissionMap;
};

const normalizeRole = (role: RawRole, index: number): Role => {
    return {
        ...role,
        id: String(role.id ?? role._id ?? role.objectID ?? `role-${index}`),
        name: typeof role.name === "string" ? role.name : "",
        permissions: normalizePermissions(role.permissions),
        isSystemRole: typeof role.isSystemRole === "boolean" ? role.isSystemRole : Boolean(role.isSystemRole),
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
    };
};

const extractRoles = (response: RawListRolesResponse): RawRole[] => {
    return Array.isArray(response) ? response : response.roles ?? response.items ?? response.data ?? [];
};

const hasNestedRole = (value: unknown, key: "role" | "data"): value is Record<typeof key, RawRole> => {
    if (!value || typeof value !== "object" || !(key in value)) return false;

    const nested = (value as Record<string, unknown>)[key];
    return Boolean(nested && typeof nested === "object" && !Array.isArray(nested));
};

const extractRole = (response: RawRoleResponse): RawRole => {
    if (hasNestedRole(response, "role")) return response.role;
    if (hasNestedRole(response, "data")) return response.data;

    return response as RawRole;
};

const buildRolePayload = (role: Omit<Partial<Role>, "id" | "createdAt" | "updatedAt">): Record<string, unknown> => {
    return Object.fromEntries(
        Object.entries({
            name: role.name?.trim(),
            permissions: role.permissions,
        }).filter(([, value]) => value !== undefined),
    );
};

export const rolesApi = {
    listRoles: async (): Promise<ListRolesResponse> => {
        const response = await apiFetch<RawListRolesResponse>("/v1/api/roles", {
            method: "GET",
        });

        return {
            roles: extractRoles(response).map(normalizeRole),
        };
    },

    createRole: (role: CreateRoleRequest): Promise<Role> => {
        assertRoleName(role.name);
        assertPermissions(role.permissions);

        return apiFetch<RawRoleResponse>("/v1/api/roles", {
            method: "POST",
            body: {
                name: role.name.trim(),
                permissions: role.permissions,
            },
        }).then((response) => normalizeRole(extractRole(response), 0));
    },

    updateRole: ({ id, role }: UpdateRoleRequest): Promise<Role> => {
        assertRoleId(id);

        const payload = buildRolePayload(role);
        if (Object.keys(payload).length === 0) {
            throw new Error("At least one role field is required.");
        }

        if ("permissions" in payload) {
            assertPermissions(payload.permissions);
        }

        return apiFetch<RawRoleResponse>(`/v1/api/roles/${encodeURIComponent(id)}`, {
            method: "PUT",
            body: payload,
        }).then((response) => normalizeRole(extractRole(response), 0));
    },

    deleteRole: async (id: string): Promise<DeleteRoleResponse> => {
        assertRoleId(id);

        const response = await apiFetch<DeleteRoleResponse | undefined>(`/v1/api/roles/${encodeURIComponent(id)}`, {
            method: "DELETE",
        });

        return response ?? { success: true };
    },
};
