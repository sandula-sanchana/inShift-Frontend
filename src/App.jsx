import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import AppLayout from "./layouts/AppLayout.jsx";
import Overview from "./pages/Overview.jsx";
import EmployeeDashboard from "./features/dashboard/EmployeeDashboard.jsx";
import Login from "./pages/Login.jsx";

function App() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />

            {/* Dashboard Layout */}
            <Route path="/app" element={<AppLayout />}>
                <Route index element={<Overview />} />
                <Route path="notifications" element={<EmployeeDashboard />} />
            </Route>

            <Route path="/login" element={<Login/>}></Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
