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
    return Array.isArray(response) ? response : response.roles ?? [];
};

const buildRolePayload = (role: Omit<Partial<Role>, "id" | "createdAt" | "updatedAt">): Record<string, unknown> => {
    return Object.fromEntries(
        Object.entries({
            name: role.name?.trim(),
            permissions: role.permissions,
            isSystemRole: role.isSystemRole,
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

        return apiFetch<RawRole>("/v1/api/roles", {
            method: "POST",
            body: {
                name: role.name.trim(),
                permissions: role.permissions,
            },
        }).then((response) => normalizeRole(response, 0));
    },

    updateRole: ({ id, role }: UpdateRoleRequest): Promise<Role> => {
        assertRoleId(id);

        return apiFetch<RawRole>(`/v1/api/roles/${encodeURIComponent(id)}`, {
            method: "PUT",
            body: buildRolePayload(role),
        }).then((response) => normalizeRole(response, 0));
    },

    deleteRole: (id: string): Promise<DeleteRoleResponse> => {
        assertRoleId(id);

        return apiFetch<DeleteRoleResponse>(`/v1/api/roles/${encodeURIComponent(id)}`, {
            method: "DELETE",
        });
    },
};
