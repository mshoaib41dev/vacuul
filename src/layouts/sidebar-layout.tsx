import { useMemo } from "react";
import { Calendar, CpuChip01, CurrencyDollar, Gift02, Inbox01, Lock01, Package, PlaySquare, Settings04, TerminalSquare, Users01 } from "@untitledui/icons";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { NavItemType } from "@/components/application/app-navigation/config";
import { SidebarNavigationSimple } from "@/components/application/app-navigation/sidebar-navigation/sidebar-simple";
import ProgressBar from "@/components/progress-bar";
import usePermissions from "@/hooks/use-permissions";
import { ROLES_FALLBACK_PATH } from "@/lib/permissions";
import { useTranslations } from "@/lib/LanguageContext";

const SidebarLayout = () => {
    const { pathname } = useLocation();
    const t = useTranslations();
    const { canShowNavHref, canAccess, loading } = usePermissions();
    const activeUrl = pathname === "/app/user" ? "/app/users" : pathname;

    const navItemsSimple: NavItemType[] = useMemo(() => {
        const items: NavItemType[] = [
            {
                label: t("nav.users"),
                href: "/app/users",
                icon: Users01,
            },
            {
                label: t("nav.machines"),
                href: "/app/machines",
                icon: CpuChip01,
            },
            {
                label: t("nav.bookingHistory"),
                href: "/app/session-management/booking-history",
                icon: Calendar,
            },
            {
                label: t("nav.sessionSettings"),
                href: "/app/session-settings",
                icon: Settings04,
            },
            {
                label: t("nav.pricings"),
                href: "/app/pricing",
                icon: CurrencyDollar,
            },
            {
                label: t("nav.giftCards"),
                href: "/app/gift-cards",
                icon: Gift02,
            },
            {
                label: t("nav.contentAds"),
                href: "/app/content",
                icon: PlaySquare,
            },
            {
                label: t("nav.contactResponses"),
                href: "/app/contact-responses",
                icon: Inbox01,
                disabled: true,
            },
            {
                label: t("nav.firmwareUpdates"),
                href: "/app/dfu",
                icon: Package,
                disabled: true,
            },
            {
                label: t("nav.systemLogs"),
                href: "/app/system-logs",
                icon: TerminalSquare,
                disabled: true,
            },
            {
                label: t("nav.roles"),
                href: "/app/roles",
                icon: Lock01,
            },
        ];

        const visibleItems = items.filter((item) => {
            if (!item.href) {
                return true;
            }

            return canShowNavHref(item.href);
        });

        // If nothing is readable, keep Roles as the shared fallback destination.
        if (visibleItems.length === 0) {
            const rolesItem = items.find((item) => item.href === ROLES_FALLBACK_PATH);
            return rolesItem ? [rolesItem] : [];
        }

        return visibleItems;
    }, [canShowNavHref, t]);

    if (loading) {
        return <ProgressBar />;
    }

    if (!canAccess(pathname)) {
        return <Navigate to={ROLES_FALLBACK_PATH} replace />;
    }

    return (
        <div className="h-screen">
            <SidebarNavigationSimple items={navItemsSimple} activeUrl={activeUrl} />
            <main className="lg:pl-[296px]">
                <Outlet />
            </main>
        </div>
    );
};

export default SidebarLayout;
