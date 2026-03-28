// src/features/admin/overtime/AdminOvertime.jsx

import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function AdminOvertime() {
    const [ots, setOts] = useState([]);

    const [form, setForm] = useState({
        employeeId: "",
        otDate: "",
        startTime: "",
        endTime: "",
        breakMinutes: 0,
        reason: ""
    });

    const load = async () => {
        const res = await api.get("/v1/admin/ot");
        setOts(res.data.data || []);
    };

    useEffect(() => {
        load();
    }, []);

    const create = async () => {
        await api.post("/v1/admin/ot", form);
        alert("OT Assigned");
        load();
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Admin Overtime</h2>

            {/* CREATE */}
            <div className="border p-4 mb-6 rounded-xl">
                <h3 className="font-semibold mb-2">Assign OT</h3>

                <input placeholder="Employee ID"
                       onChange={(e) => setForm({...form, employeeId: e.target.value})} />

                <input type="date"
                       onChange={(e) => setForm({...form, otDate: e.target.value})} />

                <input type="datetime-local"
                       onChange={(e) => setForm({...form, startTime: e.target.value})} />

                <input type="datetime-local"
                       onChange={(e) => setForm({...form, endTime: e.target.value})} />

                <input placeholder="Break minutes"
                       onChange={(e) => setForm({...form, breakMinutes: e.target.value})} />

                <input placeholder="Reason"
                       onChange={(e) => setForm({...form, reason: e.target.value})} />

                <button onClick={create}>Assign</button>
            </div>

            {/* LIST */}
            {ots.map((ot) => (
                <div key={ot.id} className="border p-4 mb-3 rounded-xl">
                    <div><b>{ot.employeeName}</b></div>
                    <div>{ot.otDate}</div>
                    <div>Status: {ot.status}</div>
                </div>
            ))}
        </div>
    );
}