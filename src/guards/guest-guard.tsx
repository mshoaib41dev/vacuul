import { Navigate } from "react-router-dom";
// components
import ProgressBar from "@/components/progress-bar";
// hooks
import { useAuth } from "@/hooks/use-auth";

// ----------------------------------------------------------------------

interface GuestGuardProps {
    children: React.ReactNode;
}

export default function GuestGuard({ children }: GuestGuardProps) {
    const { isAuthenticated, isInitialized } = useAuth();

    if (isAuthenticated) {
        return <Navigate to="/app" />;
    }

    if (!isInitialized) {
        return <ProgressBar />;
    }

    return <>{children}</>;
}
