// src/features/employee/overtime/MyOvertime.jsx

import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function MyOvertime() {
    const [ots, setOts] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            const res = await api.get("/v1/emp/ot/my");
            setOts(res.data.data || []);
        } catch (e) {
            console.error("Failed to load OT", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const accept = async (id) => {
        await api.patch(`/v1/emp/ot/${id}/accept`);
        load();
    };

    const decline = async (id) => {
        const note = prompt("Reason for decline?");
        if (!note) return;

        await api.patch(`/v1/emp/ot/${id}/decline`, { note });
        load();
    };

    const offerSwap = async (id) => {
        const toEmployeeId = prompt("Enter employee ID to swap with:");
        if (!toEmployeeId) return;

        await api.post(`/v1/emp/ot/${id}/swap-offer`, {
            toEmployeeId,
            note: "Can you take this OT?"
        });

        alert("Swap request sent");
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">My Overtime</h2>

            {ots.map((ot) => (
                <div key={ot.id} className="border p-4 mb-3 rounded-xl">
                    <div><b>Date:</b> {ot.otDate}</div>
                    <div><b>Time:</b> {ot.startTime} - {ot.endTime}</div>
                    <div><b>Status:</b> {ot.status}</div>

                    {ot.status === "ASSIGNED" && (
                        <div className="flex gap-2 mt-3">
                            <button onClick={() => accept(ot.id)}>Accept</button>
                            <button onClick={() => decline(ot.id)}>Decline</button>
                            <button onClick={() => offerSwap(ot.id)}>Swap</button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}