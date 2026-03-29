import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { authStore } from "./features/auth/store";

import Landing from "./pages/Landing.jsx";
import Login from "./pages/auth_pages/Login.jsx";

import EmployeeDashboard from "./pages/emp/EmployeeDashboard.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import ForceChangePassword from "./features/employee/ForceChangePassword.jsx";

function Unauthorized() {
    return (
        <div style={{ padding: 24 }}>
            <h2>403 - Unauthorized</h2>
            <p>You don’t have permission to view this page.</p>
        </div>
    );
}

function ProtectedRoute({ children, allowedRoles }) {
    const location = useLocation();

    const token = authStore((s) => s.accessToken);
    const role = authStore((s) => s.user?.role);
    const mustChange = authStore((s) => s.user?.passwordMustChange);

    if (!token) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (mustChange) {
        return <Navigate to="/force-change-password" replace />;
    }

    if (allowedRoles && allowedRoles.length > 0) {
        if (!role || !allowedRoles.includes(role)) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return children;
}

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/force-change-password" element={<ForceChangePassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            <Route
                path="/emp/*"
                element={
                    <ProtectedRoute allowedRoles={["EMPLOYEE", "SUPERVISOR", "HR", "ADMIN"]}>
                        <EmployeeDashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/*"
                element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}