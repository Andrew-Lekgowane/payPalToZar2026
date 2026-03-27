"use client";

import { BarChart3, ArrowLeftRight, Users, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

interface AdminBottomNavProps {
  active?: "overview" | "transactions" | "users";
  onTabChange: (tab: "transactions" | "users") => void;
  onOverview: () => void;
}

export default function AdminBottomNav({ active = "overview", onTabChange, onOverview }: AdminBottomNavProps) {
  const tab = (label: string, icon: React.ReactNode, isActive: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1"
    >
      <span className={`${isActive ? "text-violet-600 dark:text-violet-400" : "text-gray-400"}`}>
        {icon}
      </span>
      <span className={`text-[10px] font-semibold ${isActive ? "text-violet-600 dark:text-violet-400" : "text-gray-400"}`}>
        {label}
      </span>
    </button>
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-around px-2 pt-1 pb-3">
        {tab("Overview", <BarChart3 className="w-5 h-5" />, active === "overview", onOverview)}
        {tab("Payments", <ArrowLeftRight className="w-5 h-5" />, active === "transactions", () => onTabChange("transactions"))}
        {tab("Users", <Users className="w-5 h-5" />, active === "users", () => onTabChange("users"))}
        {tab("Logout", <LogOut className="w-5 h-5" />, false, () => signOut({ callbackUrl: "/login" }))}
      </div>
    </div>
  );
}
