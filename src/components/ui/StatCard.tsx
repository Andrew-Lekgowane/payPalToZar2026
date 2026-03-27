import React from "react";
import Card from "./Card";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  iconBg?: string;
}

export default function StatCard({
  icon,
  label,
  value,
  iconBg = "bg-violet-100 dark:bg-violet-900/30",
}: StatCardProps) {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </Card>
  );
}
