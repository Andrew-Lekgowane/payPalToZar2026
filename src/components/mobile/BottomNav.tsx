"use client";

import { Home, Clock, ArrowLeftRight, User, LogOut } from "lucide-react";
import { useClerk } from "@clerk/nextjs";

interface BottomNavProps {
  active?: "home" | "history" | "profile";
  onConvert: () => void;
  onProfile: () => void;
  onScrollTo?: (id: string) => void;
}

export default function BottomNav({
  active = "home",
  onConvert,
  onProfile,
  onScrollTo,
}: BottomNavProps) {
  const { signOut } = useClerk();
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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 safe-area-pb">
      <div className="flex items-end justify-around px-2 pt-1 pb-3">
        {tab("Home", <Home className="w-5 h-5" />, active === "home", () => onScrollTo?.("top"))}
        {tab("History", <Clock className="w-5 h-5" />, active === "history", () => onScrollTo?.("history"))}

        {/* Centre FAB */}
        <div className="flex-1 flex justify-center">
          <button
            onClick={onConvert}
            className="w-14 h-14 -mt-7 rounded-2xl bg-linear-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/40 flex flex-col items-center justify-center gap-0.5 border-4 border-white dark:border-gray-900"
          >
            <ArrowLeftRight className="w-5 h-5" />
            <span className="text-[9px] font-bold">Convert</span>
          </button>
        </div>

        {tab("Profile", <User className="w-5 h-5" />, active === "profile", onProfile)}
        {tab(
          "Logout",
          <LogOut className="w-5 h-5" />,
          false,
          () => signOut({ redirectUrl: "/login" })
        )}
      </div>
    </div>
  );
}
