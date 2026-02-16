import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import AppLayout from "./layouts/AppLayout.jsx";
import Overview from "./pages/Overview.jsx";
import EmployeeDashboard from "./features/dashboard/EmployeeDashboard.jsx";
import Login from "./pages/auth_pages/Login.jsx";
import Register from "./pages/auth_pages/Register.jsx";
import Notifications from "./features/notification/Notifications.jsx";
import Attendance from "./features/Attendance/Attendance.jsx";

function App() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />

            {/* Dashboard Layout */}
            <Route path="/app" element={<AppLayout />}>
                <Route index element={<Overview />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="Attendance" element={<Attendance />} />
            </Route>

            <Route path="/login" element={<Login/>}></Route>
            <Route path="/register" element={<Register/>}></Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
