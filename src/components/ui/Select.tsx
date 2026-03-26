"use client";

import React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export default function Select({
  label,
  error,
  options,
  className = "",
  ...props
}: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <select
        className={`
          w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5
          text-gray-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none
          dark:border-gray-700 dark:bg-gray-800 dark:text-white
          transition-all duration-200 appearance-none
          ${error ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""}
          ${className}
        `}
        {...props}
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
