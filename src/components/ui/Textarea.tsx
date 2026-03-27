"use client";

import React from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export default function Textarea({
  label,
  error,
  className = "",
  ...props
}: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5
          text-gray-900 placeholder-gray-400
          focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none
          dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500
          dark:focus:border-violet-400
          transition-all duration-200 min-h-30 resize-y
          ${error ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
