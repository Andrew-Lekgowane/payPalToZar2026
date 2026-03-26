"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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

interface AdminTransaction {
  _id: string;
  amountUSD: number;
  amountZAR: number;
  exchangeRate: number;
  serviceFee: number;
  status: string;
  paypalTransactionId: string;
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
  role: string;
  createdAt: string;
}

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "verifying", label: "Verifying" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

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

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"transactions" | "users">("transactions");

  // Transaction detail modal
  const [selectedTx, setSelectedTx] = useState<AdminTransaction | null>(null);
  const [updateStatus, setUpdateStatus] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [updating, setUpdating] = useState(false);

  // User management modal
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userUpdating, setUserUpdating] = useState(false);
  const [userDeleting, setUserDeleting] = useState(false);

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

  const handleUpdateTransaction = async () => {
    if (!selectedTx) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/transactions/${selectedTx._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: updateStatus, adminNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Transaction updated!");
      setSelectedTx(null);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(false);
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

  const pendingTxCount = transactions.filter((t) =>
    ["pending", "verifying"].includes(t.status),
  ).length;
  const completedTxCount = transactions.filter(
    (t) => t.status === "completed",
  ).length;

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
                Manage transactions and users
              </p>
            </div>
            <button
              onClick={fetchData}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <Card>
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-violet-500" />
                <div>
                  <p className="text-sm text-gray-500">Total Users</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {users.length}
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <ArrowRightLeft className="w-8 h-8 text-indigo-500" />
                <div>
                  <p className="text-sm text-gray-500">Total Transactions</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {transactions.length}
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-amber-500" />
                <div>
                  <p className="text-sm text-gray-500">Pending/Verifying</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {pendingTxCount}
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {completedTxCount}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setTab("transactions")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === "transactions"
                  ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setTab("users")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === "users"
                  ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              Users
            </button>
          </div>

          {/* Transactions Tab */}
          {tab === "transactions" && (
            <Card>
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
                        ZAR
                      </th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">
                        PayPal TX
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
                    {transactions.map((tx) => {
                      const cfg =
                        statusConfig[tx.status] || statusConfig.pending;
                      return (
                        <tr
                          key={tx._id}
                          className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                        >
                          <td className="py-3 px-3 text-sm text-gray-600 dark:text-gray-300">
                            {new Date(tx.createdAt).toLocaleDateString("en-ZA")}
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
                          <td className="py-3 px-3 text-sm font-medium text-emerald-600">
                            R{tx.amountZAR.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-xs text-gray-500 font-mono max-w-30 truncate">
                            {tx.paypalTransactionId || "—"}
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant={cfg.variant}>{cfg.label}</Badge>
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => {
                                setSelectedTx(tx);
                                setUpdateStatus(tx.status);
                                setAdminNote(tx.adminNote || "");
                              }}
                              className="p-1.5 rounded-lg text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/30"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
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
                    {users.map((u) => (
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
                          {u.phone}
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
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </main>

      {/* User Management Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Manage User"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedUser.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedUser.phone || "—"}</p>
              </div>
              <div>
                <p className="text-gray-500">Bank</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedUser.bankName || "—"}</p>
              </div>
              <div>
                <p className="text-gray-500">Current Role</p>
                <Badge variant={selectedUser.role === "admin" ? "info" : "default"}>
                  {selectedUser.role}
                </Badge>
              </div>
              <div>
                <p className="text-gray-500">Joined</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(selectedUser.createdAt).toLocaleDateString("en-ZA")}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Change Role</p>
              <div className="flex gap-2">
                <Button
                  variant={selectedUser.role === "admin" ? "secondary" : "primary"}
                  onClick={() => handleUpdateUserRole(selectedUser._id, "admin")}
                  isLoading={userUpdating}
                  disabled={selectedUser.role === "admin"}
                >
                  <ShieldCheck className="w-4 h-4 mr-1" />
                  Make Admin
                </Button>
                <Button
                  variant={selectedUser.role === "user" ? "secondary" : "outline"}
                  onClick={() => handleUpdateUserRole(selectedUser._id, "user")}
                  isLoading={userUpdating}
                  disabled={selectedUser.role === "user"}
                >
                  <ShieldOff className="w-4 h-4 mr-1" />
                  Make User
                </Button>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                <p className="text-sm font-medium text-red-600 mb-2">Danger Zone</p>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (confirm(`Delete ${selectedUser.name}? This cannot be undone.`)) {
                      handleDeleteUser(selectedUser._id);
                    }
                  }}
                  isLoading={userDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete User
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Transaction Detail Modal */}
      <Modal
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        title="Transaction Details"
        size="lg"
      >
        {selectedTx && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">User</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedTx.userId?.name}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedTx.userId?.email}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Amount USD</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  ${selectedTx.amountUSD.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Amount ZAR</p>
                <p className="font-medium text-emerald-600">
                  R{selectedTx.amountZAR.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Bank</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedTx.bankName} — {selectedTx.accountNumber}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Account Holder</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedTx.accountHolder}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">PayPal Transaction ID</p>
                <p className="font-mono text-gray-900 dark:text-white">
                  {selectedTx.paypalTransactionId || "Not provided"}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
              <Select
                label="Update Status"
                options={statusOptions}
                value={updateStatus}
                onChange={(e) => setUpdateStatus(e.target.value)}
              />
              <Input
                label="Admin Note"
                placeholder="Add a note (optional)"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
              <Button
                fullWidth
                onClick={handleUpdateTransaction}
                isLoading={updating}
              >
                Update Transaction
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
