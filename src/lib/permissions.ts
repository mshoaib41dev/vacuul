import type { CollectionName, CrudPermissions, PermissionMap } from "@/types/role";

export const ROLES_FALLBACK_PATH = "/app/roles";

/** Paths that never require a collection permission check. */
export const PERMISSION_EXEMPT_PATHS = ["/app/account", "/app/roles"] as const;

export type NavPermissionKey = CollectionName | "session_settings";

type PermissionLookup = Partial<Record<string, Partial<CrudPermissions>>> | PermissionMap | undefined;

export const NAV_PERMISSION_BY_HREF: Record<string, NavPermissionKey | NavPermissionKey[]> = {
    "/app/users": "users",
    "/app/user": "users",
    "/app/machines": "machines",
    "/app/session-management/booking-history": "bookings",
    "/app/session-settings": ["sessions", "session_settings"],
    "/app/pricing": "pricing",
    "/app/gift-cards": "gift_cards",
    "/app/content": "content",
    "/app/contact-responses": "contact_us",
    "/app/dfu": "firmware_packages",
    "/app/system-logs": "system_logs",
    "/app/roles": "roles",
};

const normalizeAppPath = (pathname: string): string => {
    if (!pathname.startsWith("/app")) {
        return pathname;
    }

    // Match longest configured prefix first (e.g. /app/machines/edit/x → /app/machines)
    const candidates = Object.keys(NAV_PERMISSION_BY_HREF).sort((a, b) => b.length - a.length);
    const match = candidates.find((href) => pathname === href || pathname.startsWith(`${href}/`));

    return match ?? pathname;
};

export const canReadPermission = (permissions: PermissionLookup, key: NavPermissionKey): boolean => {
    return permissions?.[key]?.read === true;
};

export const canReadAnyPermission = (permissions: PermissionLookup, keys: NavPermissionKey | NavPermissionKey[]): boolean => {
    const list = Array.isArray(keys) ? keys : [keys];
    return list.some((key) => canReadPermission(permissions, key));
};

export const getNavPermissionKeys = (href: string): NavPermissionKey | NavPermissionKey[] | null => {
    const path = normalizeAppPath(href);
    return NAV_PERMISSION_BY_HREF[path] ?? null;
};

export const isPermissionExemptPath = (pathname: string): boolean => {
    return PERMISSION_EXEMPT_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
};

export const canAccessPath = (pathname: string, permissions: PermissionLookup): boolean => {
    if (isPermissionExemptPath(pathname)) {
        return true;
    }

    const keys = getNavPermissionKeys(pathname);
    if (!keys) {
        // Unknown /app routes (e.g. future pages) stay accessible until mapped.
        return true;
    }

    return canReadAnyPermission(permissions, keys);
};
