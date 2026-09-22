import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../../modules/auth/pages/LoginPage";
import RegisterPage from "../../modules/auth/pages/RegisterPage";
import ProtectedRoute from "../../modules/auth/components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";

const Dashboard = ({ title }) => (
  <div style={{ padding: 20 }}>
    <h2>{title}</h2>
    <p>This is a protected route.</p>
  </div>
);

const HomeRedirect = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (user.role === "vendor") return <Navigate to="/vendor/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
};

const UnauthorizedPage = () => (
  <div style={{ padding: 20 }}>
    <h2>Unauthorized</h2>
    <p>You do not have permission to access this page.</p>
  </div>
);

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
        <Route path="/student/dashboard" element={<Dashboard title="Student Dashboard" />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["vendor"]} />}>
        <Route path="/vendor/dashboard" element={<Dashboard title="Vendor Dashboard" />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/admin/dashboard" element={<Dashboard title="Admin Dashboard" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
