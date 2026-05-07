import { useState } from "react";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
// components
import ProgressBar from "@/components/progress-bar";
// hooks
import { useAuth } from "@/hooks/use-auth";

export default function AuthGuard({ children }: { children: ReactNode }) {
    const { isAuthenticated, isInitialized } = useAuth();

    const { pathname } = useLocation();

    const [requestedLocation, setRequestedLocation] = useState<string | null>(null);

    if (!isInitialized) {
        return <ProgressBar />;
    }

    if (!isAuthenticated) {
        if (pathname !== requestedLocation) {
            setRequestedLocation(pathname);
        }
        return <Navigate to="/signin" replace />;
    }

    if (requestedLocation && pathname !== requestedLocation) {
        setRequestedLocation(null);
        return <Navigate to={requestedLocation} />;
    }

    // check if user is not admin
    // if (pathname === "/403") {
    //     return <Navigate to="/403" replace />;
    // }

    // if (pathname === "/403") {
    //   return <Navigate to="/app" replace />;
    // }

    return <>{children}</>;
}
