import React, { useState, useEffect } from 'react';
import { Clock, Calendar, LogIn, LogOut, Coffee, MapPin } from 'lucide-react';

const EmployeeDashboard = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isClockedIn, setIsClockedIn] = useState(false);
    const [lastAction, setLastAction] = useState(null);

    // Update clock every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleClockAction = () => {
        const timestamp = new Date().toLocaleTimeString();
        setIsClockedIn(!isClockedIn);
        setLastAction(timestamp);
        // In a real app, this is where your API call to /api/attendance/clock-in would go
    };

    const stats = [
        { label: 'Total Hours (MTD)', value: '142.5', icon: <Clock size={20} /> },
        { label: 'Leave Balance', value: '12 Days', icon: <Calendar size={20} /> },
        { label: 'Average Shift', value: '8.2h', icon: <Coffee size={20} /> },
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
            {/* Header */}
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">InShift <span className="text-indigo-600">Unified</span></h1>
                    <p className="text-slate-500">Welcome back, Alex. Let's make today productive.</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="font-mono text-lg font-semibold">
            {currentTime.toLocaleTimeString()}
          </span>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Clock Controls */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-6">Attendance Control</h2>

                        <div className="text-center">
                            <div className={`inline-flex p-4 rounded-full mb-4 ${isClockedIn ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {isClockedIn ? <LogIn size={32} /> : <LogOut size={32} />}
                            </div>
                            <h3 className="text-xl font-bold mb-1">{isClockedIn ? 'Currently Clocked In' : 'Currently Clocked Out'}</h3>
                            <p className="text-sm text-slate-500 mb-6 flex items-center justify-center gap-1">
                                <MapPin size={14} /> Main Office • Floor 4
                            </p>

                            <button
                                onClick={handleClockAction}
                                className={`w-full py-4 rounded-xl font-bold transition-all active:scale-95 shadow-lg ${
                                    isClockedIn
                                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                                }`}
                            >
                                {isClockedIn ? 'Clock Out Now' : 'Clock In Now'}
                            </button>

                            {lastAction && (
                                <p className="mt-4 text-xs text-slate-400">
                                    Last action at: <span className="font-semibold">{lastAction}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 gap-4">
                        {stats.map((stat, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">{stat.icon}</div>
                                    <span className="text-sm text-slate-600 font-medium">{stat.label}</span>
                                </div>
                                <span className="text-lg font-bold">{stat.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Recent Activity */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="font-bold text-slate-800">Recent Attendance Logs</h2>
                            <button className="text-indigo-600 text-sm font-semibold hover:underline">View Full History</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Clock In</th>
                                    <th className="px-6 py-4">Clock Out</th>
                                    <th className="px-6 py-4">Total</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                {[
                                    { date: 'Oct 24, 2023', in: '09:02 AM', out: '05:30 PM', total: '8h 28m', status: 'Regular' },
                                    { date: 'Oct 23, 2023', in: '08:55 AM', out: '06:15 PM', total: '9h 20m', status: 'Overtime' },
                                    { date: 'Oct 22, 2023', in: '09:10 AM', out: '05:00 PM', total: '7h 50m', status: 'Regular' },
                                    { date: 'Oct 21, 2023', in: '-', out: '-', total: '-', status: 'Holiday' },
                                ].map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium">{row.date}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{row.in}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{row.out}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-mono">{row.total}</td>
                                        <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            row.status === 'Regular' ? 'bg-blue-50 text-blue-600' :
                                row.status === 'Overtime' ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {row.status}
                        </span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default EmployeeDashboard;