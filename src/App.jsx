import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
//import MainLayout from './components/layout/MainLayout';

// Pages (Features)
import EmployeeDashboard from './features/dashboard/EmployeeDashboard';
//import AttendanceHistory from './features/attendance/AttendanceHistory';
// import Login from './features/auth/Login'; 

function App() {
    // In a real app, this would come from a useAuth() hook or Global State


    return (
         <>
             <EmployeeDashboard/>
         </>
    );
}

export default App;