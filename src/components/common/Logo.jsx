import React from "react";
import inshift_logo from "../../assets/logo/inshift_logo.png";

export function LogoMark({ size = 60 }) {
  return (
      <span
          className="inline-flex items-center justify-center rounded-2xl bg-slate-900 shadow-soft overflow-hidden"
          style={{ width: 200, height: size }}
      >
      <img
          src={inshift_logo}
          alt="InShift Logo"
          className=""
      />
    </span>
  );
}
