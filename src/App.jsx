import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { authStore } from "./features/auth/store";

import Landing from "./pages/Landing.jsx";
import Login from "./pages/auth_pages/Login.jsx";

import EmployeeDashboard from "./pages/emp/EmployeeDashboard.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";

// Optional: simple unauthorized page
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

    const token = authStore((s) => s.token);
    const role = authStore((s) => s.user?.role);

    // 1) Not logged in
    if (!token) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    // 2) Logged in but role not allowed
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
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Employee App */}
            <Route
                path="/emp/*"
                element={
                    <ProtectedRoute allowedRoles={["EMPLOYEE", "SUPERVISOR", "HR", "ADMIN"]}>
                        <EmployeeDashboard />
                    </ProtectedRoute>
                }
            />

            {/* Admin App */}
            <Route
                path="/admin/*"
                element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />

            {/* Catch All */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}