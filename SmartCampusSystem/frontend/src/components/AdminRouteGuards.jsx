import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const RequireSuperAdminOutlet = () => {
  const { user } = useAuth();
  if (user?.canteenKey) return <Navigate to="/admin/dashboard" replace />;
  return <Outlet />;
};

export const RequireCanteenOwnerOutlet = () => {
  const { user } = useAuth();
  if (!user?.canteenKey) return <Navigate to="/admin/dashboard" replace />;
  return <Outlet />;
};
