import { Suspense, lazy } from "react";
import type { ComponentType } from "react";
import { Navigate, useRoutes } from "react-router-dom";
// pages
import ProgressBar from "@/components/progress-bar";
// Guards
import AppHomeRedirect from "@/components/app-home-redirect";
import AuthGuard from "@/guards/auth-guard";
import GuestGuard from "@/guards/guest-guard";
import SidebarLayout from "@/layouts/sidebar-layout";

// layouts

// Define type for the Loadable HOC
const Loadable = <P extends object>(Component: ComponentType<P>) => {
    return function LoadableComponent(props: P) {
        return (
            <Suspense fallback={<ProgressBar />}>
                <Component {...props} />
            </Suspense>
        );
    };
};

export default function Router() {
    return useRoutes([
        { path: "/", element: <Navigate to="/app" replace /> },

        {
            path: "signin",
            element: (
                <GuestGuard>
                    <Signin />
                </GuestGuard>
            ),
        },
        {
            path: "forgot-password",
            element: (
                <GuestGuard>
                    <ForgotPassword />
                </GuestGuard>
            ),
        },
        {
            path: "app",
            element: (
                <AuthGuard>
                    <SidebarLayout />
                </AuthGuard>
            ),
            children: [
                {
                    index: true,
                    element: <AppHomeRedirect />,
                },
                {
                    path: "account",
                    element: <Account />,
                },
                // {
                //     path: "dashboard",
                //     element: <Dashboard />,
                // },
                {
                    path: "user",
                    element: <Users />,
                },
                {
                    path: "users",
                    element: <Users />,
                },
                {
                    path: "machines",
                    element: <Machines />,
                },
                {
                    path: "machines/register",
                    element: <RegisterMachine />,
                },
                {
                    path: "machines/edit/:id",
                    element: <EditMachine />,
                },
                {
                    path: "users/create",
                    element: <CreateUser />,
                },
                {
                    path: "users/edit/:id",
                    element: <EditUser />,
                },
                {
                    path: "session-management/booking-history",
                    element: <BookingHistory />,
                },
                {
                    path: "content",
                    element: <Contents />,
                },
                {
                    path: "dfu",
                    element: <FirmwareUpdates />,
                },
                {
                    path: "pricing",
                    element: <Pricing />,
                },
                {
                    path: "session-settings",
                    element: <SessionSettings />,
                },
                {
                    path: "contact-responses",
                    element: <ContactResponses />,
                },
                // {
                //     path: "chat-support",
                //     element: <ChatSupport />,
                // },
                {
                    path: "system-logs",
                    element: <SystemLogs />,
                },
                {
                    path: "roles",
                    element: <Roles />,
                },
                {
                    path: "gift-cards",
                    element: <GiftCards />,
                },
            ],
        },

        {
            path: "403",
            element: (
                <AuthGuard>
                    <PermissionDenied />
                </AuthGuard>
            ),
        },

        {
            path: "*",
            children: [
                { path: "404", element: <NotFound /> },
                { path: "*", element: <Navigate to="/404" replace /> },
            ],
        },
        { path: "*", element: <Navigate to="/404" replace /> },
    ]);
}

// Authenticated pages
const Account = Loadable(lazy(() => import("../pages/auth/account")));
// const Dashboard = Loadable(lazy(() => import("../pages/dashboard")));
const Users = Loadable(lazy(() => import("../pages/users")));
const CreateUser = Loadable(lazy(() => import("../pages/users/create")));
const EditUser = Loadable(lazy(() => import("../pages/users/edit")));
const Machines = Loadable(lazy(() => import("../pages/machines")));
const RegisterMachine = Loadable(lazy(() => import("../pages/machines/register")));
const EditMachine = Loadable(lazy(() => import("../pages/machines/edit")));
const BookingHistory = Loadable(lazy(() => import("../pages/session-management/booking-history")));
const Contents = Loadable(lazy(() => import("../pages/contents")));
const FirmwareUpdates = Loadable(lazy(() => import("../pages/firmware-updates")));
const Pricing = Loadable(lazy(() => import("../pages/pricing")));
const GiftCards = Loadable(lazy(() => import("../pages/gift-cards")));
const ContactResponses = Loadable(lazy(() => import("../pages/contact-responses")));
// const ChatSupport = Loadable(lazy(() => import("../pages/chat-support")));
const SystemLogs = Loadable(lazy(() => import("../pages/system-logs")));
const SessionSettings = Loadable(lazy(() => import("../pages/session-settings")));
const Roles = Loadable(lazy(() => import("../pages/roles")));

// Guest pages
const Signin = Loadable(lazy(() => import("../pages/auth/signin")));
const ForgotPassword = Loadable(lazy(() => import("../pages/auth/forgot-password")));
const NotFound = Loadable(lazy(() => import("../pages/not-found")));
const PermissionDenied = Loadable(lazy(() => import("../pages/forbidden")));
