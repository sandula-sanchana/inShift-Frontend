import { Routes, Route, Navigate } from "react-router-dom";
import { authStore } from "./features/auth/store";

import Landing from "./pages/Landing.jsx";
import Login from "./pages/auth_pages/Login.jsx";
import Register from "./pages/auth_pages/Register.jsx";

import EmployeeDashboard from "./pages/emp/EmployeeDashboard.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";

function ProtectedRoute({ children }) {
    const user = authStore((s) => s.user);
    return user ? children : <Navigate to="/login" replace />;
}

function RoleRoute({ allow, children }) {
    const role = authStore((s) => s.user?.role);
    return role === allow ? children : <Navigate to="/login" replace />;
}

export default function App() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Employee App */}
            <Route
                path="/emp/*"
                element={
                    <ProtectedRoute>
                        <RoleRoute allow="EMPLOYEE">
                            <EmployeeDashboard />
                        </RoleRoute>
                    </ProtectedRoute>
                }
            />

            {/* Admin App */}
            <Route
                path="/admin/*"
                element={
                    <ProtectedRoute>
                        <RoleRoute allow="ADMIN">
                            <AdminDashboard />
                        </RoleRoute>
                    </ProtectedRoute>
                }
            />

            {/* Catch All */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
