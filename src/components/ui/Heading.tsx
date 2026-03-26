import React from "react";

interface HeadingProps {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "h4";
  className?: string;
  gradient?: boolean;
}

const sizeStyles: Record<string, string> = {
  h1: "text-4xl md:text-5xl lg:text-6xl font-extrabold",
  h2: "text-3xl md:text-4xl font-bold",
  h3: "text-2xl md:text-3xl font-bold",
  h4: "text-xl md:text-2xl font-semibold",
};

export default function Heading({
  children,
  as: Tag = "h2",
  className = "",
  gradient = false,
}: HeadingProps) {
  return (
    <Tag
      className={`
        tracking-tight text-gray-900 dark:text-white
        ${sizeStyles[Tag]}
        ${gradient ? "bg-linear-to-r from-violet-600 via-indigo-600 to-emerald-500 bg-clip-text text-transparent" : ""}
        ${className}
      `}
    >
      {children}
    </Tag>
  );
}
