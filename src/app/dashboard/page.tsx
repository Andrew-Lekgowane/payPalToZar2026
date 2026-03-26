"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  ArrowRightLeft,
  Clock,
  CheckCircle2,
  RefreshCw,
  Plus,
  User,
  Building2,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Heading from "@/components/ui/Heading";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

interface TransactionData {
  _id: string;
  amountUSD: number;
  amountZAR: number;
  exchangeRate: number;
  serviceFee: number;
  status: string;
  paypalTransactionId: string;
  createdAt: string;
}

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branchCode: string;
}

const EXCHANGE_RATE = 18.5;
const SERVICE_FEE_PERCENT = 2.5;

const bankOptions = [
  { value: "FNB", label: "FNB (First National Bank)" },
  { value: "Standard Bank", label: "Standard Bank" },
  { value: "Absa", label: "Absa" },
  { value: "Nedbank", label: "Nedbank" },
  { value: "Capitec", label: "Capitec" },
  { value: "TymeBank", label: "TymeBank" },
  { value: "African Bank", label: "African Bank" },
  { value: "Discovery Bank", label: "Discovery Bank" },
];

const statusConfig: Record<string, { variant: "default" | "success" | "warning" | "danger" | "info"; label: string }> = {
  pending: { variant: "warning", label: "Pending" },
  verifying: { variant: "info", label: "Verifying" },
  processing: { variant: "info", label: "Processing" },
  completed: { variant: "success", label: "Completed" },
  failed: { variant: "danger", label: "Failed" },
  refunded: { variant: "default", label: "Refunded" },
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showConvert, setShowConvert] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showProof, setShowProof] = useState<string | null>(null);

  // Convert form
  const [amountUSD, setAmountUSD] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Proof form
  const [proofTxId, setProofTxId] = useState("");
  const [proofSubmitting, setProofSubmitting] = useState(false);

  // Transaction detail modal
  const [selectedTx, setSelectedTx] = useState<TransactionData | null>(null);

  // Profile form
  const [profileForm, setProfileForm] = useState<UserProfile>({
    name: "",
    email: "",
    phone: "",
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    branchCode: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [txRes, profileRes] = await Promise.all([
        fetch("/api/transactions"),
        fetch("/api/user/profile"),
      ]);
      const txData = await txRes.json();
      const profileData = await profileRes.json();
      if (txData.transactions) setTransactions(txData.transactions);
      if (profileData.user) {
        setProfile(profileData.user);
        setProfileForm(profileData.user);
      }
    } catch {
      toast.error("Failed to load data");
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
      fetchData();
    }
  }, [status, router, fetchData]);

  const handleConvert = async () => {
    const usd = parseFloat(amountUSD);
    if (!usd || usd < 1) {
      toast.error("Enter a valid amount (min $1)");
      return;
    }
    if (!profile?.bankName || !profile?.accountNumber) {
      toast.error("Please update your bank details first");
      setShowConvert(false);
      setShowProfile(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountUSD: usd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Transaction created! Now send payment and upload proof.");
      setShowConvert(false);
      setAmountUSD("");
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create transaction");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitProof = async () => {
    if (!showProof || !proofTxId.trim()) {
      toast.error("Enter your PayPal transaction ID");
      return;
    }
    setProofSubmitting(true);
    try {
      const res = await fetch(`/api/transactions/${showProof}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paypalTransactionId: proofTxId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Proof submitted! We will verify your payment shortly.");
      setShowProof(null);
      setProofTxId("");
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to submit proof");
    } finally {
      setProofSubmitting(false);
    }
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Profile updated!");
      setProfile(data.user);
      setShowProfile(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  // Calculate stats
  const totalConverted = transactions
    .filter((t) => t.status === "completed")
    .reduce((acc, t) => acc + t.amountZAR, 0);
  const pendingCount = transactions.filter((t) =>
    ["pending", "verifying", "processing"].includes(t.status)
  ).length;
  const completedCount = transactions.filter((t) => t.status === "completed").length;

  // Calculate preview
  const previewUSD = parseFloat(amountUSD) || 0;
  const previewFee = (previewUSD * SERVICE_FEE_PERCENT) / 100;
  const previewZAR = ((previewUSD - previewFee) * EXCHANGE_RATE).toFixed(2);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex items-center gap-3 text-gray-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Loading...
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <Heading as="h3">
                Welcome back, {session?.user?.name?.split(" ")[0]}
              </Heading>
              <p className="text-gray-500 mt-1">
                Manage your conversions and track your transactions
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={() => setShowProfile(true)}>
                <User className="w-4 h-4 mr-1.5" />
                Profile
              </Button>
              <Button size="sm" onClick={() => setShowConvert(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                New Conversion
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Converted</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    R{totalConverted.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {pendingCount}
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-violet-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {completedCount}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Bank Details Alert */}
          {profile && (!profile.bankName || !profile.accountNumber) && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center gap-3">
              <Building2 className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Please{" "}
                <button
                  onClick={() => setShowProfile(true)}
                  className="font-semibold underline hover:text-amber-800"
                >
                  update your bank details
                </button>{" "}
                before making your first conversion.
              </p>
            </div>
          )}

          {/* Rate Calculator */}
          <Card className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-violet-500" />
              Conversion Calculator
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Enter USD amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">$</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="0.00"
                    value={amountUSD}
                    onChange={(e) => setAmountUSD(e.target.value)}
                    className="w-full pl-7 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
              <div className="flex-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Rate</span>
                  <span>1 USD = R{EXCHANGE_RATE}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Service Fee ({SERVICE_FEE_PERCENT}%)</span>
                  <span>-${previewFee > 0 ? previewFee.toFixed(2) : "0.00"}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-1.5">
                  <span>You receive</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    R{previewUSD > 0 ? previewZAR : "0.00"}
                  </span>
                </div>
              </div>
              <Button size="sm" onClick={() => setShowConvert(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Convert
              </Button>
            </div>
          </Card>

          {/* PayPal Email Info */}
          <Card className="mb-6 bg-linear-to-r from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 border-violet-200 dark:border-violet-800">
            <div className="flex items-center gap-3">
              <ArrowRightLeft className="w-5 h-5 text-violet-500 shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  Send PayPal payments to:
                </p>
                <p className="text-violet-600 dark:text-violet-400 font-mono text-sm">
                  {process.env.NEXT_PUBLIC_PAYPAL_EMAIL || "payments@payzar.co.za"}
                </p>
              </div>
            </div>
          </Card>

          {/* Transactions */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Transaction History
              </h3>
              <button
                onClick={fetchData}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ArrowRightLeft className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No transactions yet</p>
                <p className="text-sm mt-1">Start your first conversion!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        USD
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        ZAR
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        Fee
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        Rate
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => {
                      const cfg = statusConfig[tx.status] || statusConfig.pending;
                      return (
                        <tr
                          key={tx._id}
                          className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                        >
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                            {new Date(tx.createdAt).toLocaleDateString("en-ZA")}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                            ${tx.amountUSD.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                            R{tx.amountZAR.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            -${tx.serviceFee.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            R{tx.exchangeRate}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={cfg.variant}>{cfg.label}</Badge>
                          </td>
                          <td className="py-3 px-4 flex items-center gap-2">
                            <button
                              onClick={() => setSelectedTx(tx)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {(tx.status === "pending" || (tx.status === "verifying" && !tx.paypalTransactionId)) && (
                              <button
                                onClick={() => {
                                  setShowProof(tx._id);
                                  setProofTxId(tx.paypalTransactionId || "");
                                }}
                                className="text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400"
                              >
                                Submit Proof
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </main>
      <Footer />

      {/* Transaction Detail Modal */}
      <Modal
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        title="Transaction Details"
        size="lg"
      >
        {selectedTx && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-gray-500 text-xs mb-1">Date</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(selectedTx.createdAt).toLocaleString("en-ZA")}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-gray-500 text-xs mb-1">Status</p>
                <Badge variant={(statusConfig[selectedTx.status] || statusConfig.pending).variant}>
                  {(statusConfig[selectedTx.status] || statusConfig.pending).label}
                </Badge>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-gray-500 text-xs mb-1">Amount Sent (USD)</p>
                <p className="font-bold text-gray-900 dark:text-white text-lg">
                  ${selectedTx.amountUSD.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-gray-500 text-xs mb-1">Amount Received (ZAR)</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                  R{selectedTx.amountZAR.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-gray-500 text-xs mb-1">Exchange Rate Used</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  1 USD = R{selectedTx.exchangeRate}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-gray-500 text-xs mb-1">Service Fee</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  -${selectedTx.serviceFee.toFixed(2)} ({SERVICE_FEE_PERCENT}%)
                </p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p className="text-gray-500 text-xs mb-1">PayPal Transaction ID</p>
              <p className="font-mono text-gray-900 dark:text-white break-all">
                {selectedTx.paypalTransactionId || "Not submitted yet"}
              </p>
            </div>
            {(selectedTx.status === "pending" || (selectedTx.status === "verifying" && !selectedTx.paypalTransactionId)) && (
              <Button
                fullWidth
                onClick={() => {
                  setSelectedTx(null);
                  setShowProof(selectedTx._id);
                  setProofTxId(selectedTx.paypalTransactionId || "");
                }}
              >
                Submit Payment Proof
              </Button>
            )}
          </div>
        )}
      </Modal>

      {/* Convert Modal */}
      <Modal isOpen={showConvert} onClose={() => setShowConvert(false)} title="New Conversion">
        <div className="space-y-4">
          <Input
            label="Amount (USD)"
            type="number"
            min="1"
            step="0.01"
            placeholder="e.g. 100"
            icon={<DollarSign className="w-4 h-4" />}
            value={amountUSD}
            onChange={(e) => setAmountUSD(e.target.value)}
          />

          {previewUSD > 0 && (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Exchange Rate</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  1 USD = R{EXCHANGE_RATE}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Service Fee ({SERVICE_FEE_PERCENT}%)</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  -${previewFee.toFixed(2)}
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">You Receive</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                  R{previewZAR}
                </span>
              </div>
            </div>
          )}

          <Button fullWidth onClick={handleConvert} isLoading={submitting}>
            Create Conversion
          </Button>
        </div>
      </Modal>

      {/* Submit Proof Modal */}
      <Modal
        isOpen={!!showProof}
        onClose={() => {
          setShowProof(null);
          setProofTxId("");
        }}
        title="Submit Payment Proof"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            After sending the PayPal payment, enter the PayPal transaction ID below
            so we can verify your payment.
          </p>
          <Input
            label="PayPal Transaction ID"
            placeholder="e.g. 5TY12345AB678901C"
            value={proofTxId}
            onChange={(e) => setProofTxId(e.target.value)}
          />
          <Button fullWidth onClick={handleSubmitProof} isLoading={proofSubmitting}>
            Submit Proof
          </Button>
        </div>
      </Modal>

      {/* Profile / Bank Details Modal */}
      <Modal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        title="Profile & Bank Details"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
            />
            <Input
              label="Phone"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
            />
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Bank Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Bank Name"
                options={bankOptions}
                value={profileForm.bankName}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, bankName: e.target.value })
                }
              />
              <Input
                label="Account Number"
                value={profileForm.accountNumber}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, accountNumber: e.target.value })
                }
              />
              <Input
                label="Account Holder Name"
                value={profileForm.accountHolder}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, accountHolder: e.target.value })
                }
              />
              <Input
                label="Branch Code (Optional)"
                value={profileForm.branchCode}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, branchCode: e.target.value })
                }
              />
            </div>
          </div>

          <Button fullWidth onClick={handleSaveProfile} isLoading={profileSaving}>
            Save Changes
          </Button>
        </div>
      </Modal>
    </>
  );
}
