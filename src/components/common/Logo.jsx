import React from "react";
import inshift_logo from "../../assets/logo/il.png";

export function LogoMark({ size = 40, withBg = false }) {
    return (
        <div
            className={`inline-flex items-center justify-center rounded-2xl ${
                withBg ? "bg-slate-900 p-2 shadow-soft" : ""
            }`}
            style={{ width: size, height: size }}
        >
            <img
                src={inshift_logo}
                alt="InShift Logo"
                className="max-h-full max-w-full object-contain"
            />
        </div>
    );
}
