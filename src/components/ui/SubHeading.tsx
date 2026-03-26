import React from "react";

interface SubHeadingProps {
  children: React.ReactNode;
  className?: string;
}

export default function SubHeading({ children, className = "" }: SubHeadingProps) {
  return (
    <p
      className={`
        text-lg md:text-xl text-gray-500 dark:text-gray-400 leading-relaxed
        ${className}
      `}
    >
      {children}
    </p>
  );
}
