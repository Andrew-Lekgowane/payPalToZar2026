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
} from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Heading from "@/components/ui/Heading";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";

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

  const fetchData = useCallback(async () => {
    try {
      const [txRes, usersRes] = await Promise.all([
        fetch("/api/admin/transactions"),
        fetch("/api/admin/users"),
      ]);
      const txData = await txRes.json();
      const usersData = await usersRes.json();
      if (txData.transactions) setTransactions(txData.transactions);
      if (usersData.users) setUsers(usersData.users);
    } catch {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
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
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
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

  // Stats
  const totalZARPaid = transactions
    .filter((t) => t.status === "completed")
    .reduce((a, t) => a + t.amountZAR, 0);
  const pendingCount = transactions.filter((t) =>
    ["pending", "verifying"].includes(t.status),
  ).length;
  const completedCount = transactions.filter(
    (t) => t.status === "completed",
  ).length;

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
          <div className="flex items-center justify-between mb-8">
            <div>
              <Heading as="h3">Admin Panel</Heading>
              <p className="text-gray-500 mt-1">
                Manage transactions, process payouts, and manage users
              </p>
            </div>
            <button
              onClick={fetchData}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <Card>
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-violet-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Total Users</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {users.length}
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-amber-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Needs Action</p>
                  <p className="text-xl font-bold text-amber-600">
                    {pendingCount}
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Completed</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {completedCount}
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-indigo-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Total Paid Out</p>
                  <p className="text-xl font-bold text-emerald-600">
                    R
                    {totalZARPaid.toLocaleString("en-ZA", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </Card>
          </div>

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
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">
                  Filter:
                </span>
                {ALL_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
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

              <div className="overflow-x-auto">
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
              <div className="overflow-x-auto">
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
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 grid grid-cols-2 gap-3 text-sm">
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
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-center">
                <p className="text-xs text-blue-500 mb-1">They Sent (PayPal)</p>
                <p className="font-bold text-blue-700 dark:text-blue-300 text-lg">
                  ${selectedTx.amountUSD.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-center">
                <p className="text-xs text-red-500 mb-1">Service Fee</p>
                <p className="font-bold text-red-600 text-lg">
                  -${selectedTx.serviceFee.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-center">
                <p className="text-xs text-emerald-600 mb-1">
                  You Must Pay Out
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
              <div className="grid grid-cols-2 gap-3 text-sm">
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
        onClose={() => {
          setSelectedUser(null);
          setPendingUserAction(null);
        }}
        title="Manage User"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-500 mb-0.5">Full Name</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedUser.name}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedUser.phone || "—"}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 col-span-2">
                <p className="text-xs text-gray-500 mb-0.5">Email</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedUser.email}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-500 mb-0.5">Bank</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedUser.bankName || "—"}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-500 mb-0.5">Account Number</p>
                <div className="flex items-center">
                  <p className="font-semibold text-gray-900 dark:text-white font-mono">
                    {selectedUser.accountNumber || "—"}
                  </p>
                  {selectedUser.accountNumber && (
                    <CopyButton
                      value={selectedUser.accountNumber}
                      label="Account number"
                    />
                  )}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-500 mb-0.5">Role</p>
                <Badge
                  variant={selectedUser.role === "admin" ? "info" : "default"}
                >
                  {selectedUser.role}
                </Badge>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-500 mb-0.5">Joined</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {new Date(selectedUser.createdAt).toLocaleDateString("en-ZA")}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-4">
              {pendingUserAction ? (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 space-y-3">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                    {pendingUserAction.type === "delete"
                      ? `Delete ${selectedUser.name}? This cannot be undone.`
                      : `Change ${selectedUser.name}&apos;s role to &quot;${(pendingUserAction as { type: "role"; value: string }).value}&quot;?`}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant={
                        pendingUserAction.type === "delete"
                          ? "danger"
                          : "primary"
                      }
                      onClick={() => {
                        if (pendingUserAction.type === "delete")
                          handleDeleteUser(selectedUser._id);
                        else
                          handleUpdateUserRole(
                            selectedUser._id,
                            (
                              pendingUserAction as {
                                type: "role";
                                value: string;
                              }
                            ).value,
                          );
                        setPendingUserAction(null);
                      }}
                      isLoading={userUpdating || userDeleting}
                      disabled={userUpdating || userDeleting}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      Yes, confirm
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPendingUserAction(null)}
                      disabled={userUpdating || userDeleting}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Change Role
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          setPendingUserAction({ type: "role", value: "admin" })
                        }
                        disabled={selectedUser.role === "admin"}
                      >
                        <ShieldCheck className="w-4 h-4 mr-1" />
                        Make Admin
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          setPendingUserAction({ type: "role", value: "user" })
                        }
                        disabled={selectedUser.role === "user"}
                      >
                        <ShieldOff className="w-4 h-4 mr-1" />
                        Make Regular User
                      </Button>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                    <p className="text-sm font-semibold text-red-600 mb-2">
                      Danger Zone
                    </p>
                    <Button
                      variant="danger"
                      onClick={() => setPendingUserAction({ type: "delete" })}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete User
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
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
