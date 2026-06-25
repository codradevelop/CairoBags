import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { LoadingPage } from "../components/ui/Spinner.jsx";
import { isStoreReadOnly } from "../utils/storePermissions.js";

/**
 * Redirects Admin users away from customer shopping routes to the admin panel.
 */
export function AdminShoppingBlockRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingPage label="Loading" />;
  }

  if (isStoreReadOnly(user)) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
