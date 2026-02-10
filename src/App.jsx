import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import EmployeeDashboard from "./features/dashboard/EmployeeDashboard.jsx";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/employee" element={<EmployeeDashboard />} />

            <Route path="/login" element={<div className="p-6 text-white">Login page</div>} />
            <Route path="/register" element={<div className="p-6 text-white">Register page</div>} />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
