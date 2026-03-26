import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
}

export default function Card({
  children,
  className = "",
  hover = false,
  gradient = false,
}: CardProps) {
  return (
    <div
      className={`
        rounded-2xl border border-gray-100 bg-white p-6
        dark:border-gray-800 dark:bg-gray-900
        ${hover ? "hover:shadow-xl hover:shadow-violet-500/5 hover:-translate-y-1 transition-all duration-300" : ""}
        ${gradient ? "bg-linear-to-br from-white to-violet-50 dark:from-gray-900 dark:to-violet-950/20" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
