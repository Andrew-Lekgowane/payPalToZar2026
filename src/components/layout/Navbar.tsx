"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  Menu, X, Zap, LogOut, LayoutDashboard, User,
  ArrowRightLeft, Users, RefreshCw, HelpCircle,
  ShieldCheck,
} from "lucide-react";
import Button from "@/components/ui/Button";

const navLink =
  "text-sm font-medium text-gray-600 hover:text-violet-600 dark:text-gray-300 dark:hover:text-violet-400 transition-colors";

const mobileLink =
  "flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-violet-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors";

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = (session?.user as { role?: string })?.role === "admin";
  const dashboardHref = isAdmin ? "/admin" : "/dashboard";

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href={session ? dashboardHref : "/"} className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Annathan Pay
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">

            {/* Context-aware centre links */}
            {isAdmin ? (
              <>
                <Link href="/admin?tab=transactions" className={navLink}>
                  <span className="flex items-center gap-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Transactions
                  </span>
                </Link>
                <Link href="/admin?tab=users" className={navLink}>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Users
                  </span>
                </Link>
                <Link href="/admin?tab=transactions&filter=pending" className={navLink}>
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Pending
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link href="/#how-it-works" className={navLink}>
                  How It Works
                </Link>
                <Link href="/support" className={navLink}>
                  Support
                </Link>
              </>
            )}

            {session ? (
              <div className="flex items-center gap-3">
                <Link href={dashboardHref}>
                  <Button variant="ghost" size="sm">
                    <LayoutDashboard className="w-4 h-4 mr-1.5" />
                    {isAdmin ? "Admin Panel" : "Dashboard"}
                  </Button>
                </Link>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800">
                  {isAdmin
                    ? <ShieldCheck className="w-4 h-4 text-violet-500" />
                    : <User className="w-4 h-4 text-violet-500" />
                  }
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {session.user?.name?.split(" ")[0]}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Log In</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex flex-col gap-1">

              {/* Context-aware mobile links */}
              {isAdmin ? (
                <>
                  <p className="px-3 py-1 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Admin
                  </p>
                  <Link href="/admin?tab=transactions" className={mobileLink} onClick={() => setMobileOpen(false)}>
                    <ArrowRightLeft className="w-4 h-4 text-violet-500" />
                    Transactions
                  </Link>
                  <Link href="/admin?tab=users" className={mobileLink} onClick={() => setMobileOpen(false)}>
                    <Users className="w-4 h-4 text-violet-500" />
                    Users
                  </Link>
                  <Link href="/admin?tab=transactions&filter=pending" className={mobileLink} onClick={() => setMobileOpen(false)}>
                    <RefreshCw className="w-4 h-4 text-amber-500" />
                    Pending Transactions
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/#how-it-works" className={mobileLink} onClick={() => setMobileOpen(false)}>
                    How It Works
                  </Link>
                  <Link href="/support" className={mobileLink} onClick={() => setMobileOpen(false)}>
                    <HelpCircle className="w-4 h-4" />
                    Support
                  </Link>
                </>
              )}

              {session ? (
                <>
                  <div className="border-t border-gray-100 dark:border-gray-800 mt-2 pt-2">
                    <Link
                      href={dashboardHref}
                      className={mobileLink}
                      onClick={() => setMobileOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4 text-violet-500" />
                      {isAdmin ? "Admin Panel" : "Dashboard"}
                    </Link>
                    <button
                      onClick={() => { signOut({ callbackUrl: "/login" }); setMobileOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <div className="border-t border-gray-100 dark:border-gray-800 mt-2 pt-2 flex flex-col gap-2">
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" size="sm" fullWidth>Log In</Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)}>
                    <Button size="sm" fullWidth>Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
