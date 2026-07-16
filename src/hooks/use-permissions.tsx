import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import useRoles from "@/hooks/use-roles";
import {
    canAccessPath,
    canReadAnyPermission,
    canReadPermission,
    getNavPermissionKeys,
    type NavPermissionKey,
} from "@/lib/permissions";
import type { PermissionMap, Role } from "@/types/role";

type UsePermissionsResult = {
    role: Role | null;
    roleId: string | null;
    permissions: PermissionMap | undefined;
    loading: boolean;
    canRead: (key: NavPermissionKey | NavPermissionKey[]) => boolean;
    canAccess: (pathname: string) => boolean;
    canShowNavHref: (href: string) => boolean;
};

const usePermissions = (): UsePermissionsResult => {
    const { user } = useAuth();
    const { roles, loading } = useRoles();

    const roleId = user.roleId?.trim() || null;

    const role = useMemo(() => {
        if (!roleId) {
            return null;
        }

        return roles.find((entry) => entry.id === roleId) ?? null;
    }, [roleId, roles]);

    const permissions = role?.permissions;

    const canRead = (key: NavPermissionKey | NavPermissionKey[]): boolean => {
        return canReadAnyPermission(permissions, key);
    };

    const canAccess = (pathname: string): boolean => {
        return canAccessPath(pathname, permissions);
    };

    const canShowNavHref = (href: string): boolean => {
        const keys = getNavPermissionKeys(href);
        if (!keys) {
            return true;
        }

        // Roles is always available as the fallback destination.
        if (href === "/app/roles") {
            return true;
        }

        return canReadAnyPermission(permissions, keys);
    };

    return {
        role,
        roleId,
        permissions,
        loading,
        canRead,
        canAccess,
        canShowNavHref,
    };
};

export default usePermissions;

// Re-export helpers for convenience in callers that already import this hook.
export { canReadPermission };
