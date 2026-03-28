// src/features/employee/overtime/SwapRequests.jsx

import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function SwapRequests() {
    const [swaps, setSwaps] = useState([]);

    const load = async () => {
        const res = await api.get("/v1/emp/ot/swaps/incoming");
        setSwaps(res.data.data || []);
    };

    useEffect(() => {
        load();
    }, []);

    const accept = async (id) => {
        await api.patch(`/v1/emp/ot/swaps/${id}/accept`);
        load();
    };

    const reject = async (id) => {
        await api.patch(`/v1/emp/ot/swaps/${id}/reject`);
        load();
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Swap Requests</h2>

            {swaps.map((s) => (
                <div key={s.id} className="border p-4 mb-3 rounded-xl">
                    <div><b>From:</b> {s.fromEmployeeName}</div>
                    <div><b>Note:</b> {s.note}</div>

                    <div className="flex gap-2 mt-3">
                        <button onClick={() => accept(s.id)}>Accept</button>
                        <button onClick={() => reject(s.id)}>Reject</button>
                    </div>
                </div>
            ))}
        </div>
    );
}