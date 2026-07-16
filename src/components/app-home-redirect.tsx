import { Navigate } from "react-router-dom";
import ProgressBar from "@/components/progress-bar";
import usePermissions from "@/hooks/use-permissions";
import { ROLES_FALLBACK_PATH } from "@/lib/permissions";

const AppHomeRedirect = () => {
    const { canAccess, loading } = usePermissions();

    if (loading) {
        return <ProgressBar />;
    }

    if (canAccess("/app/users")) {
        return <Navigate to="/app/users" replace />;
    }

    return <Navigate to={ROLES_FALLBACK_PATH} replace />;
};

export default AppHomeRedirect;
