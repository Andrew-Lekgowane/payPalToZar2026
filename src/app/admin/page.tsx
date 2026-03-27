"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  ArrowRightLeft,
  CheckCircle,
  Clock,
  RefreshCw,
  Eye,
  Trash2,
  ShieldCheck,
  ShieldOff,
  Copy,
  ImageIcon,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Banknote,
  Filter,
  X,
  Plus,
  Pencil,
  UserPlus,
  Wallet,
  CalendarDays,
} from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Heading from "@/components/ui/Heading";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

const bankOptions = [
  { value: "FNB",             label: "FNB (First National Bank)" },
  { value: "Standard Bank",   label: "Standard Bank" },
  { value: "Absa",            label: "Absa" },
  { value: "Nedbank",         label: "Nedbank" },
  { value: "Capitec",         label: "Capitec" },
  { value: "TymeBank",        label: "TymeBank" },
  { value: "African Bank",    label: "African Bank" },
  { value: "Discovery Bank",  label: "Discovery Bank" },
];

interface AdminTransaction {
  _id: string;
  amountUSD: number;
  amountZAR: number;
  exchangeRate: number;
  serviceFee: number;
  status: string;
  paypalTransactionId: string;
  proofScreenshot: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branchCode: string;
  adminNote: string;
  createdAt: string;
  userId: { _id: string; name: string; email: string; phone: string } | null;
}

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  role: string;
  createdAt: string;
}

const statusConfig: Record<
  string,
  {
    variant: "default" | "success" | "warning" | "danger" | "info";
    label: string;
  }
> = {
  pending: { variant: "warning", label: "Pending" },
  verifying: { variant: "info", label: "Verifying" },
  processing: { variant: "info", label: "Processing" },
  completed: { variant: "success", label: "Completed" },
  failed: { variant: "danger", label: "Failed" },
  refunded: { variant: "default", label: "Refunded" },
};

const ALL_STATUSES = [
  "all",
  "pending",
  "verifying",
  "processing",
  "completed",
  "failed",
  "refunded",
];

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label || "Copied"}!`);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 rounded text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors"
      title="Copy"
    >
      {copied ? (
        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialise tab + filter from URL query params (?tab=users, ?filter=pending)
  const [tab, setTab] = useState<"transactions" | "users">(
    searchParams.get("tab") === "users" ? "users" : "transactions"
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("filter") ?? "all"
  );

  // When URL params change (e.g. user clicks a navbar link) sync state
  useEffect(() => {
    const t = searchParams.get("tab");
    const f = searchParams.get("filter");
    if (t === "users" || t === "transactions") setTab(t);
    if (f) setStatusFilter(f);
  }, [searchParams]);

  // Transaction modal
  const [selectedTx, setSelectedTx] = useState<AdminTransaction | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [showScreenshot, setShowScreenshot] = useState(false);

  // User modal
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userUpdating, setUserUpdating] = useState(false);
  const [userDeleting, setUserDeleting] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "status";
    value: string;
  } | null>(null);
  const [pendingUserAction, setPendingUserAction] = useState<
    { type: "delete" } | { type: "role"; value: string } | null
  >(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Edit user
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "", email: "", phone: "", role: "user",
    bankName: "", accountNumber: "", accountHolder: "", branchCode: "",
    password: "",
  });
  const [userSaving, setUserSaving] = useState(false);

  // Create user
  const [showCreateUser, setShowCreateUser] = useState(false);
  const blankCreate = {
    name: "", email: "", phone: "", password: "", role: "user",
    bankName: "", accountNumber: "", accountHolder: "", branchCode: "",
  };
  const [createForm, setCreateForm] = useState(blankCreate);
  const [userCreating, setUserCreating] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (showToast = false) => {
    setRefreshing(true);
    try {
      const [txRes, usersRes] = await Promise.all([
        fetch("/api/admin/transactions"),
        fetch("/api/admin/users"),
      ]);
      const txData = await txRes.json();
      const usersData = await usersRes.json();
      if (txData.transactions) setTransactions(txData.transactions);
      if (usersData.users) setUsers(usersData.users);
      if (showToast) toast.success("Data refreshed");
    } catch {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      if ((session?.user as { role?: string })?.role !== "admin") {
        router.push("/dashboard");
        return;
      }
      fetchData();
    }
  }, [status, session, router, fetchData]);

  const updateStatus = async (tx: AdminTransaction, newStatus: string) => {
    setUpdatingStatus(newStatus);
    try {
      const res = await fetch(`/api/admin/transactions/${tx._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, adminNote }),
      });

      let data: { error?: string } = {};
      try {
        data = await res.json();
      } catch {
        /* non-json response */
      }

      if (!res.ok) throw new Error(data?.error || `Server error ${res.status}`);

      toast.success(`Status updated to: ${newStatus}`);
      setSelectedTx(null);
      setAdminNote("");
      setShowScreenshot(false);
      // refresh in background — do not await so it can't block the finally
      fetchData();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Update failed — please try again",
      );
    } finally {
      setUpdatingStatus(null);
      setPendingAction(null);
    }
  };

  const handleUpdateUserRole = async (userId: string, role: string) => {
    setUserUpdating(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Role updated to ${role}`);
      setSelectedUser(null);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUserUpdating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setUserDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("User deleted");
      setSelectedUser(null);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setUserDeleting(false);
    }
  };

  const openEditMode = (user: AdminUser) => {
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      bankName: user.bankName || "",
      accountNumber: user.accountNumber || "",
      accountHolder: user.accountHolder || "",
      branchCode: user.branchCode || "",
      password: "",
    });
    setEditMode(true);
  };

  const handleEditUser = async (userId: string) => {
    setUserSaving(true);
    try {
      const payload = { ...editForm };
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("User updated successfully");
      setEditMode(false);
      setSelectedUser(null);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUserSaving(false);
    }
  };

  const handleCreateUser = async () => {
    setUserCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`User "${createForm.name}" created successfully`);
      setShowCreateUser(false);
      setCreateForm(blankCreate);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not create user");
    } finally {
      setUserCreating(false);
    }
  };

  // Earnings period filter
  const [earningsFilter, setEarningsFilter] = useState<"week" | "month" | "6months" | "year" | "all">("month");

  // Stats
  const completedTx = transactions.filter((t) => t.status === "completed");
  const totalZARPaid = completedTx.reduce((a, t) => a + t.amountZAR, 0);
  const totalFeesEarned = completedTx.reduce((a, t) => a + t.serviceFee, 0);
  const pendingCount = transactions.filter((t) =>
    ["pending", "verifying"].includes(t.status),
  ).length;
  const completedCount = completedTx.length;

  // Earnings filtered by period
  const earningsCutoff = (): Date => {
    const now = new Date();
    if (earningsFilter === "week")    { now.setDate(now.getDate() - 7); return now; }
    if (earningsFilter === "month")   { now.setMonth(now.getMonth() - 1); return now; }
    if (earningsFilter === "6months") { now.setMonth(now.getMonth() - 6); return now; }
    if (earningsFilter === "year")    { now.setFullYear(now.getFullYear() - 1); return now; }
    return new Date(0); // "all"
  };
  const periodTx = completedTx.filter((t) => new Date(t.createdAt) >= earningsCutoff());
  const periodFees = periodTx.reduce((a, t) => a + t.serviceFee, 0);
  const periodZAR  = periodTx.reduce((a, t) => a + t.amountZAR, 0);

  const filteredTx =
    statusFilter === "all"
      ? transactions
      : transactions.filter((t) => t.status === statusFilter);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex items-center gap-3 text-gray-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Loading admin panel...
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 md:mb-8">
            <div>
              <Heading as="h3">Admin Panel</Heading>
              <p className="text-gray-500 mt-1">
                Manage transactions, process payouts, and manage users
              </p>
            </div>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="p-2 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30 disabled:opacity-50 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-8">
            <Card>
              <div className="flex items-center gap-2 md:gap-3">
                <Users className="w-5 h-5 md:w-8 md:h-8 text-violet-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Total Users</p>
                  <p className="text-base md:text-xl font-bold text-gray-900 dark:text-white">
                    {users.length}
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-2 md:gap-3">
                <Clock className="w-5 h-5 md:w-8 md:h-8 text-amber-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Needs Action</p>
                  <p className="text-base md:text-xl font-bold text-amber-600">
                    {pendingCount}
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-2 md:gap-3">
                <CheckCircle className="w-5 h-5 md:w-8 md:h-8 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Completed</p>
                  <p className="text-base md:text-xl font-bold text-gray-900 dark:text-white">
                    {completedCount}
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-2 md:gap-3">
                <TrendingUp className="w-5 h-5 md:w-8 md:h-8 text-indigo-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Paid Out</p>
                  <p className="text-base md:text-xl font-bold text-emerald-600">
                    R{totalZARPaid.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* ── Earnings Card ── */}
          <Card className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-violet-500" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Your Earnings (Service Fees)</h3>
              </div>
              {/* Period filter pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 min-w-0">
                <CalendarDays className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                {(["week", "month", "6months", "year", "all"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setEarningsFilter(p)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      earningsFilter === p
                        ? "bg-violet-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                    }`}
                  >
                    {p === "week" ? "This Week" : p === "month" ? "This Month" : p === "6months" ? "6 Months" : p === "year" ? "This Year" : "All Time"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
              {/* Main earnings highlight */}
              <div className="col-span-1 sm:col-span-2 p-3 md:p-4 rounded-2xl bg-linear-to-br from-violet-500 to-indigo-600 text-white">
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80 mb-0.5">You Earned</p>
                <p className="text-2xl md:text-3xl font-bold">${periodFees.toFixed(2)}</p>
                <p className="text-xs opacity-70 mt-0.5">
                  from {periodTx.length} completed transaction{periodTx.length !== 1 ? "s" : ""}
                </p>
              </div>
              {/* ZAR paid out in period */}
              <div className="p-3 md:p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wide mb-0.5">ZAR Paid Out</p>
                <p className="text-base md:text-xl font-bold text-emerald-700 dark:text-emerald-300">
                  R{periodZAR.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-emerald-500 mt-0.5">in this period</p>
              </div>
              {/* All-time totals */}
              <div className="p-3 md:p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-0.5">All-Time Earned</p>
                <p className="text-base md:text-xl font-bold text-gray-900 dark:text-white">${totalFeesEarned.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{completedCount} total completed</p>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {(["transactions", "users"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                  tab === t
                    ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {t}
                {t === "transactions" && pendingCount > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-xs font-bold">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Transactions Tab */}
          {tab === "transactions" && (
            <Card>
              {/* Filter bar */}
              <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
                <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-xs text-gray-500 font-medium shrink-0">
                  Filter:
                </span>
                {ALL_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors shrink-0 ${
                      statusFilter === s
                        ? "bg-violet-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-violet-100 dark:hover:bg-violet-900/30"
                    }`}
                  >
                    {s}
                    {s !== "all" && (
                      <span className="ml-1 opacity-70">
                        ({transactions.filter((t) => t.status === s).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Mobile card list */}
              <div className="md:hidden space-y-2">
                {filteredTx.length === 0 ? (
                  <p className="py-8 text-center text-gray-400 text-sm">
                    No transactions found
                  </p>
                ) : (
                  filteredTx.map((tx) => {
                    const cfg = statusConfig[tx.status] || statusConfig.pending;
                    return (
                      <div
                        key={tx._id}
                        className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50"
                      >
                        <div className="flex items-start justify-between mb-1.5">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-xs">
                              {tx.userId?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {tx.userId?.email}
                            </p>
                          </div>
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div>
                            <p className="text-xs text-gray-500">Sent</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              ${tx.amountUSD.toFixed(2)}
                            </p>
                          </div>
                          <span className="text-sm text-gray-300 dark:text-gray-600">→</span>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Pay Out</p>
                            <p className="text-sm font-bold text-emerald-600">
                              R{tx.amountZAR.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Proof</p>
                            {tx.proofScreenshot ? (
                              <span className="text-xs text-emerald-600 font-semibold">✓ Yes</span>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {new Date(tx.createdAt).toLocaleDateString("en-ZA")}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedTx(tx);
                              setAdminNote(tx.adminNote || "");
                              setShowScreenshot(false);
                            }}
                            className="px-3 py-1 rounded-lg text-xs font-semibold text-violet-600 border border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors"
                          >
                            Manage
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">
                        User
                      </th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">
                        USD
                      </th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">
                        ZAR Payout
                      </th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">
                        Proof
                      </th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTx.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-10 text-center text-gray-400 text-sm"
                        >
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      filteredTx.map((tx) => {
                        const cfg =
                          statusConfig[tx.status] || statusConfig.pending;
                        return (
                          <tr
                            key={tx._id}
                            className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                          >
                            <td className="py-3 px-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                              {new Date(tx.createdAt).toLocaleDateString(
                                "en-ZA",
                              )}
                            </td>
                            <td className="py-3 px-3 text-sm">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {tx.userId?.name || "Unknown"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {tx.userId?.email}
                              </p>
                            </td>
                            <td className="py-3 px-3 text-sm font-medium text-gray-900 dark:text-white">
                              ${tx.amountUSD.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-sm font-bold text-emerald-600">
                              R{tx.amountZAR.toFixed(2)}
                            </td>
                            <td className="py-3 px-3">
                              {tx.proofScreenshot ? (
                                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                  <ImageIcon className="w-3.5 h-3.5" /> Yes
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">
                                  None
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <Badge variant={cfg.variant}>{cfg.label}</Badge>
                            </td>
                            <td className="py-3 px-3">
                              <button
                                onClick={() => {
                                  setSelectedTx(tx);
                                  setAdminNote(tx.adminNote || "");
                                  setShowScreenshot(false);
                                }}
                                className="p-1.5 rounded-lg text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/30"
                                title="Manage transaction"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Users Tab */}
          {tab === "users" && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {users.length} registered user{users.length !== 1 ? "s" : ""}
                </p>
                <Button size="sm" onClick={() => { setCreateForm(blankCreate); setShowCreateUser(true); }}>
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  Add User
                </Button>
              </div>
              {/* Mobile card list */}
              <div className="md:hidden space-y-2">
                {users.length === 0 ? (
                  <p className="py-8 text-center text-gray-400 text-sm">
                    No users found
                  </p>
                ) : (
                  users.map((u) => (
                    <div
                      key={u._id}
                      className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50"
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-xs">
                            {u.name}
                          </p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                        <Badge variant={u.role === "admin" ? "info" : "default"}>
                          {u.role}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-gray-500 mb-2">
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-400">Phone: </span>
                          {u.phone || "—"}
                        </div>
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-400">Bank: </span>
                          {u.bankName || "—"}
                        </div>
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-400">Joined: </span>
                          {new Date(u.createdAt).toLocaleDateString("en-ZA")}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="w-full py-1.5 rounded-lg text-xs font-semibold text-violet-600 border border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors"
                      >
                        Manage User
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">
                        Phone
                      </th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">
                        Bank
                      </th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">
                        Role
                      </th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">
                        Joined
                      </th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-10 text-center text-gray-400 text-sm"
                        >
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr
                          key={u._id}
                          className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                        >
                          <td className="py-3 px-3 text-sm font-medium text-gray-900 dark:text-white">
                            {u.name}
                          </td>
                          <td className="py-3 px-3 text-sm text-gray-600 dark:text-gray-300">
                            {u.email}
                          </td>
                          <td className="py-3 px-3 text-sm text-gray-600 dark:text-gray-300">
                            {u.phone || "—"}
                          </td>
                          <td className="py-3 px-3 text-sm text-gray-600 dark:text-gray-300">
                            {u.bankName || "—"}
                          </td>
                          <td className="py-3 px-3">
                            <Badge
                              variant={u.role === "admin" ? "info" : "default"}
                            >
                              {u.role}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-sm text-gray-500">
                            {new Date(u.createdAt).toLocaleDateString("en-ZA")}
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => setSelectedUser(u)}
                              className="p-1.5 rounded-lg text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/30"
                              title="Manage user"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </main>

      {/* ─── Transaction Management Modal ─── */}
      <Modal
        isOpen={!!selectedTx}
        onClose={() => {
          setSelectedTx(null);
          setAdminNote("");
          setShowScreenshot(false);
          setPendingAction(null);
        }}
        title="Process Transaction"
        size="lg"
      >
        {selectedTx && (
          <div className="space-y-5">
            {/* User info */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Customer</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedTx.userId?.name || "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedTx.userId?.phone || "—"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-0.5">Email</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedTx.userId?.email}
                </p>
              </div>
            </div>

            {/* Amount summary */}
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-center">
                <p className="text-xs text-blue-500 mb-1">They Sent (PayPal)</p>
                <p className="font-bold text-blue-700 dark:text-blue-300 text-lg">
                  ${selectedTx.amountUSD.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-linear-to-br from-violet-500 to-indigo-600 text-center">
                <p className="text-xs text-violet-100 mb-1 font-semibold">💰 You Receive</p>
                <p className="font-bold text-white text-lg">
                  ${selectedTx.serviceFee.toFixed(2)}
                </p>
                <p className="text-xs text-violet-200 mt-0.5">
                  ({Math.round((selectedTx.serviceFee / selectedTx.amountUSD) * 100)}% fee)
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-center">
                <p className="text-xs text-emerald-600 mb-1">
                  Pay Out to User
                </p>
                <p className="font-bold text-emerald-700 dark:text-emerald-300 text-lg">
                  R{selectedTx.amountZAR.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Bank details for payout */}
            <div className="p-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10">
              <div className="flex items-center gap-2 mb-3">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                  Payout Bank Details — EFT to these details
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Bank</p>
                  <div className="flex items-center">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedTx.bankName || "—"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Account Holder</p>
                  <div className="flex items-center">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedTx.accountHolder || "—"}
                    </p>
                    {selectedTx.accountHolder && (
                      <CopyButton
                        value={selectedTx.accountHolder}
                        label="Account holder"
                      />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Account Number</p>
                  <div className="flex items-center">
                    <p className="font-bold text-gray-900 dark:text-white font-mono text-base">
                      {selectedTx.accountNumber || "—"}
                    </p>
                    {selectedTx.accountNumber && (
                      <CopyButton
                        value={selectedTx.accountNumber}
                        label="Account number"
                      />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Branch Code</p>
                  <div className="flex items-center">
                    <p className="font-semibold text-gray-900 dark:text-white font-mono">
                      {selectedTx.branchCode || "—"}
                    </p>
                    {selectedTx.branchCode && (
                      <CopyButton
                        value={selectedTx.branchCode}
                        label="Branch code"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* PayPal TX ID */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm">
              <p className="text-xs text-gray-500 mb-1">
                PayPal Transaction ID
              </p>
              <div className="flex items-center">
                <p className="font-mono text-gray-900 dark:text-white break-all">
                  {selectedTx.paypalTransactionId || "Not provided"}
                </p>
                {selectedTx.paypalTransactionId && (
                  <CopyButton
                    value={selectedTx.paypalTransactionId}
                    label="Transaction ID"
                  />
                )}
              </div>
            </div>

            {/* Proof Screenshot */}
            {selectedTx.proofScreenshot ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Payment Screenshot
                  </p>
                  <button
                    onClick={() => setShowScreenshot(!showScreenshot)}
                    className="text-xs text-violet-600 font-medium hover:underline"
                  >
                    {showScreenshot ? "Hide" : "View Screenshot"}
                  </button>
                </div>
                {showScreenshot && (
                  <div
                    className="relative group cursor-zoom-in"
                    onClick={() => setLightboxOpen(true)}
                  >
                    <img
                      src={selectedTx.proofScreenshot}
                      alt="Payment proof"
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 max-h-72 object-contain bg-gray-100 dark:bg-gray-800"
                    />
                    <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-semibold bg-black/60 px-3 py-1.5 rounded-lg">
                        Click to view full size
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                <ImageIcon className="w-4 h-4 shrink-0" />
                No payment screenshot uploaded yet
              </div>
            )}

            {/* Admin note */}
            <Input
              label="Admin Note (internal — not shown to user)"
              placeholder="e.g. EFT reference 123, verified on FNB"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />

            {/* Current status */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Current status:</span>
              <Badge
                variant={
                  (statusConfig[selectedTx.status] || statusConfig.pending)
                    .variant
                }
              >
                {
                  (statusConfig[selectedTx.status] || statusConfig.pending)
                    .label
                }
              </Badge>
            </div>

            {/* Quick action buttons */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
              {pendingAction ? (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 space-y-3">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                    Change status to{" "}
                    <span className="capitalize">
                      &quot;{pendingAction.value}&quot;
                    </span>
                    ?
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    The customer will see this update on their dashboard.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setPendingAction(null);
                        updateStatus(selectedTx, pendingAction.value);
                      }}
                      isLoading={updatingStatus !== null}
                      disabled={updatingStatus !== null}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      Yes, confirm
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPendingAction(null)}
                      disabled={updatingStatus !== null}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Change Status
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setPendingAction({ type: "status", value: "verifying" })
                      }
                      disabled={selectedTx.status === "verifying"}
                    >
                      <Eye className="w-4 h-4 mr-1.5" />
                      Mark Verifying
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setPendingAction({
                          type: "status",
                          value: "processing",
                        })
                      }
                      disabled={selectedTx.status === "processing"}
                    >
                      <DollarSign className="w-4 h-4 mr-1.5" />
                      Approve & Processing
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setPendingAction({ type: "status", value: "completed" })
                      }
                      disabled={selectedTx.status === "completed"}
                      fullWidth
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      Mark as Paid / Completed
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() =>
                        setPendingAction({ type: "status", value: "failed" })
                      }
                      disabled={selectedTx.status === "failed"}
                    >
                      <XCircle className="w-4 h-4 mr-1.5" />
                      Reject / Failed
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setPendingAction({ type: "status", value: "refunded" })
                      }
                      disabled={selectedTx.status === "refunded"}
                    >
                      <RotateCcw className="w-4 h-4 mr-1.5" />
                      Mark Refunded
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ─── User Management Modal ─── */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => { setSelectedUser(null); setPendingUserAction(null); setEditMode(false); }}
        title={editMode ? `Editing: ${selectedUser?.name}` : "Manage User"}
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-4">

            {/* ── VIEW MODE ── */}
            {!editMode && (
              <>
                {/* Top action row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedUser.role === "admin" ? "info" : "default"}>
                      {selectedUser.role}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      Joined {new Date(selectedUser.createdAt).toLocaleDateString("en-ZA")}
                    </span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => openEditMode(selectedUser)}>
                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
                    Edit User
                  </Button>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: "Full Name",       value: selectedUser.name },
                    { label: "Phone",            value: selectedUser.phone || "—" },
                    { label: "Email",            value: selectedUser.email, span: true },
                    { label: "Bank",             value: selectedUser.bankName || "—" },
                    { label: "Account Holder",   value: selectedUser.accountHolder || "—" },
                    { label: "Account Number",   value: selectedUser.accountNumber || "—" },
                    { label: "Branch Code",      value: selectedUser.branchCode || "—" },
                  ].map(({ label, value, span }) => (
                    <div key={label} className={`p-3 rounded-xl bg-gray-50 dark:bg-gray-800 ${span ? "col-span-2" : ""}`}>
                      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                      <p className="font-semibold text-gray-900 dark:text-white break-all">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-4">
                  {pendingUserAction ? (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 space-y-3">
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                        {pendingUserAction.type === "delete"
                          ? `⚠️ Delete "${selectedUser.name}"? This cannot be undone.`
                          : `Change role to "${(pendingUserAction as { type: "role"; value: string }).value}"?`}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant={pendingUserAction.type === "delete" ? "danger" : "primary"}
                          isLoading={userUpdating || userDeleting}
                          disabled={userUpdating || userDeleting}
                          onClick={() => {
                            if (pendingUserAction.type === "delete") handleDeleteUser(selectedUser._id);
                            else handleUpdateUserRole(selectedUser._id, (pendingUserAction as { type: "role"; value: string }).value);
                            setPendingUserAction(null);
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          Yes, confirm
                        </Button>
                        <Button variant="outline" onClick={() => setPendingUserAction(null)} disabled={userUpdating || userDeleting}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Change Role</p>
                        <div className="flex gap-2">
                          <Button onClick={() => setPendingUserAction({ type: "role", value: "admin" })} disabled={selectedUser.role === "admin"}>
                            <ShieldCheck className="w-4 h-4 mr-1" />
                            Make Admin
                          </Button>
                          <Button variant="outline" onClick={() => setPendingUserAction({ type: "role", value: "user" })} disabled={selectedUser.role === "user"}>
                            <ShieldOff className="w-4 h-4 mr-1" />
                            Make Regular User
                          </Button>
                        </div>
                      </div>
                      <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                        <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-2">Danger Zone</p>
                        <Button variant="danger" onClick={() => setPendingUserAction({ type: "delete" })}>
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete User
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {/* ── EDIT MODE ── */}
            {editMode && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Full Name *" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  <Input label="Phone *" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                  <Input label="Email *" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="col-span-full sm:col-span-2" />
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Bank Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select label="Bank Name" options={bankOptions} value={editForm.bankName} onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })} />
                    <Input label="Account Holder" value={editForm.accountHolder} onChange={(e) => setEditForm({ ...editForm, accountHolder: e.target.value })} />
                    <Input label="Account Number" value={editForm.accountNumber} onChange={(e) => setEditForm({ ...editForm, accountNumber: e.target.value })} />
                    <Input label="Branch Code" value={editForm.branchCode} onChange={(e) => setEditForm({ ...editForm, branchCode: e.target.value })} />
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Role & Password</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Role</label>
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <Input label="New Password (leave blank to keep current)" type="password" placeholder="Min 6 characters" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
                  </div>
                </div>

                <div className="flex gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                  <Button fullWidth onClick={() => handleEditUser(selectedUser._id)} isLoading={userSaving} disabled={userSaving}>
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setEditMode(false)} disabled={userSaving}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ─── Create User Modal ─── */}
      <Modal
        isOpen={showCreateUser}
        onClose={() => { setShowCreateUser(false); setCreateForm(blankCreate); }}
        title="Create New User"
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
            <p className="text-xs text-violet-700 dark:text-violet-300">
              Fill in the details below. The user will be able to log in immediately with the password you set.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Full Name *" placeholder="e.g. Jane Doe" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
            <Input label="Phone Number *" placeholder="e.g. 0821234567" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
            <Input label="Email Address *" type="email" placeholder="jane@example.com" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
            <Input label="Password *" type="password" placeholder="Min 6 characters" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Bank Details (optional)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select label="Bank Name" options={bankOptions} value={createForm.bankName} onChange={(e) => setCreateForm({ ...createForm, bankName: e.target.value })} />
              <Input label="Account Holder" placeholder="Full name on account" value={createForm.accountHolder} onChange={(e) => setCreateForm({ ...createForm, accountHolder: e.target.value })} />
              <Input label="Account Number" value={createForm.accountNumber} onChange={(e) => setCreateForm({ ...createForm, accountNumber: e.target.value })} />
              <Input label="Branch Code" value={createForm.branchCode} onChange={(e) => setCreateForm({ ...createForm, branchCode: e.target.value })} />
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Role</label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <Button fullWidth onClick={handleCreateUser} isLoading={userCreating} disabled={userCreating || !createForm.name || !createForm.email || !createForm.password || !createForm.phone}>
            <Plus className="w-4 h-4 mr-1.5" />
            Create User
          </Button>
        </div>
      </Modal>

      {/* ─── Screenshot Lightbox ─── */}
      {lightboxOpen && selectedTx?.proofScreenshot && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <p className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            Click anywhere to close
          </p>
          <img
            src={selectedTx.proofScreenshot}
            alt="Payment proof — full size"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
