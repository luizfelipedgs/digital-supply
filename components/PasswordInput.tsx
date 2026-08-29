"use client";

import { useState } from "react";

export function PasswordInput({
  value,
  onChange,
  placeholder = "Senha",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        className="dgs-input pr-16"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs hover:text-neutral-300"
        tabIndex={-1}
      >
        {visible ? "ocultar" : "mostrar"}
      </button>
    </div>
  );
}
