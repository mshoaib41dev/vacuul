import { Calendar, CpuChip01, CurrencyDollar, Gift02, Inbox01, Lock01, Package, PlaySquare, Settings04, TerminalSquare, Users01 } from "@untitledui/icons";
import { Outlet, useLocation } from "react-router-dom";
import type { NavItemType } from "@/components/application/app-navigation/config";
import { SidebarNavigationSimple } from "@/components/application/app-navigation/sidebar-navigation/sidebar-simple";
import { useTranslations } from "@/lib/LanguageContext";

const SidebarLayout = () => {
    const { pathname } = useLocation();
    const t = useTranslations();
    const activeUrl = pathname === "/app/user" ? "/app/users" : pathname;

    const navItemsSimple: NavItemType[] = [
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
