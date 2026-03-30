"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
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
  Upload,
  Copy,
  CheckCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/mobile/BottomNav";
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
  proofScreenshot?: string;
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
const SERVICE_FEE_PERCENT = 35;
const MIN_AMOUNT_USD = 5;
const MAX_AMOUNT_USD = 100;
const PAYPAL_EMAIL =
  process.env.NEXT_PUBLIC_PAYPAL_EMAIL || "payments@annathanpay.co.za";

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

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showConvert, setShowConvert] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showProof, setShowProof] = useState<string | null>(null);

  // Convert wizard - 3 steps
  const [convertStep, setConvertStep] = useState(1);
  const [amountUSD, setAmountUSD] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<string>("");
  const [screenshotName, setScreenshotName] = useState("");
  const [txId, setTxId] = useState("");
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Proof for existing pending transactions
  const [proofTxId, setProofTxId] = useState("");
  const [proofScreenshot, setProofScreenshot] = useState("");
  const [proofScreenshotName, setProofScreenshotName] = useState("");
  const [proofSubmitting, setProofSubmitting] = useState(false);
  const proofFileRef = useRef<HTMLInputElement>(null);

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

  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (showToast = false) => {
    setRefreshing(true);
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
      if (showToast) toast.success("Transactions refreshed");
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/login");
      return;
    }
    // Admins landing here (e.g. direct link) get bounced to /admin immediately
    const role = user.publicMetadata?.role as string | undefined;
    if (role === "admin") {
      router.replace("/admin");
      return;
    }
    fetchData();
    // Auto-refresh every 30 seconds so admin status changes appear automatically
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [isLoaded, user, router, fetchData]);

  const resetConvertModal = () => {
    setConvertStep(1);
    setAmountUSD("");
    setScreenshotFile("");
    setScreenshotName("");
    setTxId("");
    setCopied(false);
  };

  // Opens the wizard keeping whatever amount the user already typed in the calculator
  const openConvertWithAmount = () => {
    setConvertStep(1);
    setScreenshotFile("");
    setScreenshotName("");
    setTxId("");
    setCopied(false);
    setShowConvert(true);
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: string) => void,
    nameSetter: (v: string) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPG, PNG, etc.)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setter(ev.target?.result as string);
      nameSetter(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(PAYPAL_EMAIL);
    setCopied(true);
    toast.success("Email copied!");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleStep1Next = () => {
    const usd = parseFloat(amountUSD);
    if (!usd || usd < MIN_AMOUNT_USD) {
      toast.error(`Enter a valid amount (min $${MIN_AMOUNT_USD})`);
      return;
    }
    if (usd > MAX_AMOUNT_USD) {
      toast.error(`Maximum is $${MAX_AMOUNT_USD} USD per transaction`);
      return;
    }
    if (!profile?.bankName || !profile?.accountNumber) {
      toast.error("Please update your bank details first");
      setShowConvert(false);
      setShowProfile(true);
      return;
    }
    setConvertStep(2);
  };

  const handleConvert = async () => {
    if (!screenshotFile) {
      toast.error("Please upload a screenshot of your PayPal payment");
      return;
    }
    const usd = parseFloat(amountUSD);
    setSubmitting(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountUSD: usd,
          proofScreenshot: screenshotFile,
          paypalTransactionId: txId.trim() || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(
        "Done! We received your request and will process it shortly.",
      );
      setShowConvert(false);
      resetConvertModal();
      fetchData();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitProof = async () => {
    if (!proofScreenshot) {
      toast.error("Please upload a screenshot of your PayPal payment");
      return;
    }
    setProofSubmitting(true);
    try {
      const res = await fetch(`/api/transactions/${showProof}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proofScreenshot,
          paypalTransactionId: proofTxId.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Proof submitted! We will verify your payment shortly.");
      setShowProof(null);
      setProofTxId("");
      setProofScreenshot("");
      setProofScreenshotName("");
      fetchData();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit proof",
      );
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
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile",
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const totalConverted = transactions
    .filter((t) => t.status === "completed")
    .reduce((acc, t) => acc + t.amountZAR, 0);
  const pendingCount = transactions.filter((t) =>
    ["pending", "verifying", "processing"].includes(t.status),
  ).length;
  const completedCount = transactions.filter(
    (t) => t.status === "completed",
  ).length;

  const previewUSD = parseFloat(amountUSD) || 0;
  const previewFee = (previewUSD * SERVICE_FEE_PERCENT) / 100;
  const previewZAR = ((previewUSD - previewFee) * EXCHANGE_RATE).toFixed(2);
  const amountError = amountUSD
    ? previewUSD < MIN_AMOUNT_USD
      ? `Minimum amount is $${MIN_AMOUNT_USD} USD`
      : previewUSD > MAX_AMOUNT_USD
        ? `Maximum is $${MAX_AMOUNT_USD} USD per transaction`
        : null
    : null;

  // Only block render until Clerk has initialised (very fast — happens client-side).
  // Once isLoaded is true we know who the user is and can show the page shell.
  // The data-loading state is handled inline with skeletons so the page feels
  // instant and we never show the "Rendering" banner again.
  if (!isLoaded) {
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
      {/* ─── DESKTOP LAYOUT ─── */}
      <div className="hidden md:block">
      <Navbar />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-8">
            <div>
              <Heading as="h3">
                Welcome back, {user?.firstName || user?.fullName?.split(" ")[0] || "there"} 👋
              </Heading>
              <p className="text-gray-500 mt-1">
                Convert your PayPal money to Rands — fast and easy
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProfile(true)}
              >
                <User className="w-4 h-4 mr-1.5" />
                My Profile
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  resetConvertModal();
                  setShowConvert(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Convert Money
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-8">
            <Card>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4 md:w-6 md:h-6 text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 truncate">Total (ZAR)</p>
                  <p className="text-base md:text-2xl font-bold text-gray-900 dark:text-white truncate">
                    R{totalConverted.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 md:w-6 md:h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">In Progress</p>
                  <p className="text-base md:text-2xl font-bold text-gray-900 dark:text-white">
                    {pendingCount}
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 md:w-6 md:h-6 text-violet-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Completed</p>
                  <p className="text-base md:text-2xl font-bold text-gray-900 dark:text-white">
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
                ⚠️ Before you can convert money, please{" "}
                <button
                  onClick={() => setShowProfile(true)}
                  className="font-bold underline"
                >
                  add your bank account details
                </button>{" "}
                so we know where to send your Rands.
              </p>
            </div>
          )}

          {/* Rate Calculator */}
          <Card className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-violet-500" />
              See how much you will receive
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-500">
                    Enter your USD amount
                  </label>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    Min $5 — Max $100
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">
                    $
                  </span>
                  <input
                    type="number"
                    min={MIN_AMOUNT_USD}
                    max={MAX_AMOUNT_USD}
                    step="0.01"
                    placeholder="e.g. 50"
                    value={amountUSD}
                    onChange={(e) => setAmountUSD(e.target.value)}
                    className={`w-full pl-7 pr-4 py-2.5 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 transition-colors ${
                      amountError
                        ? "border-red-400 dark:border-red-500 focus:ring-red-500/20"
                        : "border-gray-200 dark:border-gray-700 focus:ring-violet-500"
                    }`}
                  />
                </div>
                {amountError && (
                  <p className="text-xs text-red-500 font-medium mt-1">
                    {amountError}
                  </p>
                )}
              </div>
              <div className="flex-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Exchange Rate</span>
                  <span>1 USD = R{EXCHANGE_RATE}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Service Fee ({SERVICE_FEE_PERCENT}%)</span>
                  <span className="text-red-500">
                    -${previewFee > 0 ? previewFee.toFixed(2) : "0.00"}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-1.5">
                  <span>You will receive</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-base">
                    R{previewUSD > 0 ? previewZAR : "0.00"}
                  </span>
                </div>
              </div>
              <Button size="sm" onClick={openConvertWithAmount} className="w-full sm:w-auto whitespace-nowrap">
                <Plus className="w-4 h-4 mr-1" />
                Convert Now
              </Button>
            </div>
          </Card>

          {/* Transactions */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                My Past Transactions
              </h3>
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="p-2 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30 disabled:opacity-50 transition-colors"
                title="Refresh transactions"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ArrowRightLeft className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="font-medium text-base">No transactions yet</p>
                <p className="text-sm mt-1">
                  Tap "Convert Money" above to get started!
                </p>
              </div>
            ) : (
              <>
              {/* Mobile card list */}
              <div className="md:hidden space-y-2">
                {transactions.map((tx) => {
                  const cfg = statusConfig[tx.status] || statusConfig.pending;
                  return (
                    <div
                      key={tx._id}
                      className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">
                          {new Date(tx.createdAt).toLocaleDateString("en-ZA")}
                        </span>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Sent</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            ${tx.amountUSD.toFixed(2)}
                          </p>
                        </div>
                        <span className="text-base text-gray-300 dark:text-gray-600">→</span>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-0.5">Received</p>
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            R{tx.amountZAR.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-red-400 mb-2">
                        Fee: -${tx.serviceFee.toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-violet-600 border border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors"
                        >
                          View Details
                        </button>
                        {!tx.proofScreenshot &&
                          (tx.status === "pending" ||
                            (tx.status === "verifying" &&
                              !tx.paypalTransactionId)) && (
                          <button
                            onClick={() => {
                              setShowProof(tx._id);
                              setProofTxId("");
                              setProofScreenshot("");
                              setProofScreenshotName("");
                            }}
                            className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors"
                          >
                            Upload Proof
                          </button>
                        )}
                        {tx.proofScreenshot && (
                          <span className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 border border-emerald-200 dark:border-emerald-800 text-center">
                            ✓ Proof Submitted
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        Sent (USD)
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        Received (ZAR)
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        Fee
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                        Details
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
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                            {new Date(tx.createdAt).toLocaleDateString("en-ZA")}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                            ${tx.amountUSD.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            R{tx.amountZAR.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-sm text-red-500">
                            -${tx.serviceFee.toFixed(2)}
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
                            {!tx.proofScreenshot &&
                              (tx.status === "pending" ||
                                (tx.status === "verifying" &&
                                  !tx.paypalTransactionId)) && (
                              <button
                                onClick={() => {
                                  setShowProof(tx._id);
                                  setProofTxId("");
                                  setProofScreenshot("");
                                  setProofScreenshotName("");
                                }}
                                className="text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 whitespace-nowrap"
                              >
                                Upload Proof
                              </button>
                            )}
                            {tx.proofScreenshot && (
                              <span className="text-xs font-semibold text-emerald-600 whitespace-nowrap">
                                ✓ Proof sent
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </Card>
        </div>
      </main>
      <Footer />
      </div>{/* end desktop */}

      {/* ─── MOBILE LAYOUT ─── */}
      <div className="md:hidden min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Fixed top bar */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/30">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-base">Annathan Pay</span>
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </header>

        {/* Scrollable content */}
        <div className="pt-16 pb-24 px-4 space-y-3">

          {/* Hero balance card */}
          <div className="rounded-3xl bg-linear-to-br from-violet-600 via-violet-700 to-indigo-800 p-5 text-white shadow-xl shadow-violet-500/25">
            <p className="text-xs font-medium opacity-70 mb-0.5">
              Hi {user?.firstName || user?.fullName?.split(" ")[0] || "there"} 👋
            </p>
            <p className="text-xs opacity-50 mb-1">Total Received</p>
            <p className="text-3xl font-black tracking-tight">
              R{totalConverted.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
            </p>
            <div className="flex gap-2 mt-3">
              <div className="bg-white/15 backdrop-blur rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                <Clock className="w-3 h-3 opacity-80" />
                <span className="text-xs font-semibold">{pendingCount} pending</span>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3 opacity-80" />
                <span className="text-xs font-semibold">{completedCount} done</span>
              </div>
            </div>
          </div>

          {/* Bank alert */}
          {profile && (!profile.bankName || !profile.accountNumber) && (
            <button
              onClick={() => setShowProfile(true)}
              className="w-full p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 flex items-center gap-3 text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-800/40 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Add bank details</p>
                <p className="text-xs text-amber-500 dark:text-amber-400">Required to receive your Rands</p>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
            </button>
          )}

          {/* Quick Calculator */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Calculator</p>
            <div className="relative mb-1.5">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-base">$</span>
              <input
                type="number"
                min={MIN_AMOUNT_USD}
                max={MAX_AMOUNT_USD}
                step="0.01"
                placeholder="Enter USD amount"
                value={amountUSD}
                onChange={(e) => setAmountUSD(e.target.value)}
                className={`w-full pl-8 pr-4 py-3 rounded-xl border-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold focus:outline-none transition-colors text-base ${
                  amountError
                    ? "border-red-400 focus:border-red-500"
                    : "border-gray-100 dark:border-gray-700 focus:border-violet-500"
                }`}
              />
            </div>
            {amountError ? (
              <p className="text-xs text-red-500 font-semibold mb-2">⚠️ {amountError}</p>
            ) : (
              <p className="text-xs text-gray-400 mb-2">Min $5 · Max $100 per transaction</p>
            )}
            {previewUSD >= MIN_AMOUNT_USD && previewUSD <= MAX_AMOUNT_USD && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl p-3 flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500">You will receive</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">R{previewZAR}</span>
              </div>
            )}
            <button
              onClick={openConvertWithAmount}
              disabled={!amountUSD || !!amountError}
              className="w-full py-3 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm shadow-md shadow-violet-500/20 disabled:opacity-40"
            >
              Convert Now →
            </button>
          </div>

          {/* Transactions */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-sm font-bold text-gray-900 dark:text-white">Recent Transactions</p>
            </div>
            {transactions.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2 text-gray-400 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                <ArrowRightLeft className="w-8 h-8 opacity-30" />
                <p className="text-sm font-medium">No transactions yet</p>
                <p className="text-xs opacity-70">Tap Convert to get started!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => {
                  const cfg = statusConfig[tx.status] || statusConfig.pending;
                  const leftColor: Record<string, string> = {
                    pending: "bg-amber-400",
                    verifying: "bg-blue-400",
                    processing: "bg-violet-400",
                    completed: "bg-emerald-400",
                    failed: "bg-red-400",
                    refunded: "bg-gray-400",
                  };
                  return (
                    <button
                      key={tx._id}
                      onClick={() => setSelectedTx(tx)}
                      className="w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3.5 flex items-center gap-3 text-left shadow-sm active:scale-[0.98] transition-transform"
                    >
                      <div className={`w-1 self-stretch rounded-full ${leftColor[tx.status] || "bg-gray-300"} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400">
                            {new Date(tx.createdAt).toLocaleDateString("en-ZA")}
                          </span>
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            ${tx.amountUSD.toFixed(2)}
                          </span>
                          <span className="text-gray-300 text-xs">→</span>
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                            R{tx.amountZAR.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <BottomNav
          onConvert={openConvertWithAmount}
          onProfile={() => setShowProfile(true)}
        />
      </div>{/* end mobile */}

      {/* ─── Transaction Detail Modal ─── */}
      <Modal
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        title="Transaction Details"
        size="lg"
      >
        {selectedTx && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-gray-500 text-xs mb-1">Date</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(selectedTx.createdAt).toLocaleString("en-ZA")}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-gray-500 text-xs mb-1">Status</p>
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
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-gray-500 text-xs mb-1">You Sent (USD)</p>
                <p className="font-bold text-gray-900 dark:text-white text-lg">
                  ${selectedTx.amountUSD.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-gray-500 text-xs mb-1">You Received (ZAR)</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                  R{selectedTx.amountZAR.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-gray-500 text-xs mb-1">Exchange Rate</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  1 USD = R{selectedTx.exchangeRate}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-gray-500 text-xs mb-1">Service Fee</p>
                <p className="font-medium text-red-500">
                  -${selectedTx.serviceFee.toFixed(2)} ({SERVICE_FEE_PERCENT}%)
                </p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p className="text-gray-500 text-xs mb-1">
                PayPal Transaction ID
              </p>
              <p className="font-mono text-gray-900 dark:text-white break-all">
                {selectedTx.paypalTransactionId || "Not provided"}
              </p>
            </div>
            {selectedTx.proofScreenshot ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    Payment proof already submitted
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    You cannot re-upload once a screenshot has been sent
                  </p>
                </div>
              </div>
            ) : (selectedTx.status === "pending" ||
              (selectedTx.status === "verifying" &&
                !selectedTx.paypalTransactionId)) && (
              <Button
                fullWidth
                onClick={() => {
                  setSelectedTx(null);
                  setShowProof(selectedTx._id);
                  setProofTxId("");
                  setProofScreenshot("");
                  setProofScreenshotName("");
                }}
              >
                Upload Payment Proof
              </Button>
            )}
          </div>
        )}
      </Modal>

      {/* ─── Convert Wizard Modal ─── */}
      <Modal
        isOpen={showConvert}
        onClose={() => {
          setShowConvert(false);
          resetConvertModal();
        }}
        title={
          convertStep === 1
            ? "Step 1 of 3 — How much do you want to convert?"
            : convertStep === 2
              ? "Step 2 of 3 — Send the money on PayPal"
              : "Step 3 of 3 — Upload your proof of payment"
        }
        size="lg"
      >
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  s < convertStep
                    ? "bg-emerald-500 text-white"
                    : s === convertStep
                      ? "bg-violet-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                }`}
              >
                {s < convertStep ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`h-0.5 flex-1 rounded ${s < convertStep ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* STEP 1 — Enter amount */}
        {convertStep === 1 && (
          <div className="space-y-5">
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              Type in the amount of US Dollars you want to convert to Rands. The
              minimum is <strong>$5</strong> and the maximum is{" "}
              <strong>$100</strong> per transaction.
            </p>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                How many dollars do you want to convert?
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
                  $
                </span>
                <input
                  type="number"
                  min={MIN_AMOUNT_USD}
                  max={MAX_AMOUNT_USD}
                  step="0.01"
                  placeholder="e.g. 50"
                  value={amountUSD}
                  onChange={(e) => setAmountUSD(e.target.value)}
                  className={`w-full pl-9 pr-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg font-semibold focus:outline-none transition-colors ${
                    amountError
                      ? "border-red-400 dark:border-red-500 focus:border-red-500"
                      : "border-gray-200 dark:border-gray-700 focus:border-violet-500"
                  }`}
                  autoFocus
                />
              </div>
              {amountError ? (
                <p className="text-sm text-red-500 font-semibold mt-1.5">
                  ⚠️ {amountError}
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-1.5">
                  Minimum: $5 &nbsp;|&nbsp; Maximum: $100
                </p>
              )}
            </div>

            {previewUSD >= MIN_AMOUNT_USD && previewUSD <= MAX_AMOUNT_USD && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 space-y-2">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                  Your breakdown
                </p>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>You send on PayPal</span>
                  <span className="font-semibold">
                    ${previewUSD.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Our service fee ({SERVICE_FEE_PERCENT}%)</span>
                  <span className="text-red-500">
                    -${previewFee.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-white border-t border-emerald-200 dark:border-emerald-700 pt-2">
                  <span>💰 You will receive</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-base">
                    R{previewZAR}
                  </span>
                </div>
              </div>
            )}

            <Button
              fullWidth
              onClick={handleStep1Next}
              disabled={!amountUSD || !!amountError}
            >
              Looks good, next step
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* STEP 2 — Send payment */}
        {convertStep === 2 && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
              <p className="text-sm font-semibold text-violet-700 dark:text-violet-300 mb-1">
                You need to send:
              </p>
              <p className="text-3xl font-bold text-violet-700 dark:text-violet-300">
                ${parseFloat(amountUSD).toFixed(2)}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Follow these steps on PayPal:
              </p>

              {[
                {
                  num: "1",
                  text: "Open your PayPal app on your phone (or go to paypal.com on a computer)",
                },
                { num: "2", text: 'Tap "Send Money" or "Send & Request"' },
                {
                  num: "3",
                  text: `Send exactly $${parseFloat(amountUSD).toFixed(2)} to the email address below`,
                },
                {
                  num: "4",
                  text: "Take a screenshot of the payment confirmation screen — you will need it in the next step",
                },
              ].map((step) => (
                <div key={step.num} className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                    {step.num}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 mb-1">
                Send PayPal payment to this email:
              </p>
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono font-bold text-gray-900 dark:text-white text-sm break-all">
                  {PAYPAL_EMAIL}
                </p>
                <button
                  onClick={handleCopyEmail}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-semibold shrink-0 hover:bg-violet-200 transition-colors"
                >
                  {copied ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                📸 <strong>Important:</strong> After sending, take a screenshot
                of the PayPal confirmation. You will upload it in the next step
                as proof of payment.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setConvertStep(1)}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button fullWidth onClick={() => setConvertStep(3)}>
                I have sent the money and taken a screenshot
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 — Upload proof */}
        {convertStep === 3 && (
          <div className="space-y-5">
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Upload the screenshot you took of your PayPal payment. This helps
              us verify your payment quickly.
            </p>

            {/* Screenshot upload — REQUIRED */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                📸 Upload your PayPal screenshot{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleFileSelect(e, setScreenshotFile, setScreenshotName)
                }
              />
              {screenshotFile ? (
                <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 truncate">
                      {screenshotName}
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      Screenshot uploaded ✓
                    </p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-emerald-600 underline"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-violet-400 dark:hover:border-violet-500 transition-colors flex flex-col items-center gap-2 text-gray-400 hover:text-violet-500"
                >
                  <ImageIcon className="w-8 h-8" />
                  <p className="text-sm font-semibold">
                    Tap here to choose your screenshot
                  </p>
                  <p className="text-xs">JPG, PNG — max 5MB</p>
                </button>
              )}
            </div>

            {/* Transaction ID — OPTIONAL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                PayPal Transaction ID{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Adding your transaction ID helps us verify your payment{" "}
                <strong>faster</strong>. You can find it in your PayPal
                confirmation email or app under Activity.
              </p>
              <input
                type="text"
                placeholder="e.g. 5TY12345AB678901C"
                value={txId}
                onChange={(e) => setTxId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                ✅ Once you submit, we will verify your payment and send your
                Rands to your bank account. You will see the status update in
                your transaction history.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setConvertStep(2)}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button
                fullWidth
                onClick={handleConvert}
                isLoading={submitting}
                disabled={!screenshotFile}
              >
                <Upload className="w-4 h-4 mr-2" />
                Submit — I am done!
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Upload Proof Modal (for existing pending transactions) ─── */}
      <Modal
        isOpen={!!showProof}
        onClose={() => {
          setShowProof(null);
          setProofTxId("");
          setProofScreenshot("");
          setProofScreenshotName("");
        }}
        title="Upload Payment Proof"
        size="lg"
      >
        <div className="space-y-5">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Upload a screenshot showing you sent the PayPal payment. Without
              this we cannot process your transaction.
            </p>
          </div>

          {/* Screenshot upload — REQUIRED */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              📸 Your PayPal payment screenshot{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              ref={proofFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                handleFileSelect(e, setProofScreenshot, setProofScreenshotName)
              }
            />
            {proofScreenshot ? (
              <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 truncate">
                    {proofScreenshotName}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    Screenshot uploaded ✓
                  </p>
                </div>
                <button
                  onClick={() => proofFileRef.current?.click()}
                  className="text-xs text-emerald-600 underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                onClick={() => proofFileRef.current?.click()}
                className="w-full p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-violet-400 transition-colors flex flex-col items-center gap-2 text-gray-400 hover:text-violet-500"
              >
                <ImageIcon className="w-8 h-8" />
                <p className="text-sm font-semibold">
                  Tap here to choose your screenshot
                </p>
                <p className="text-xs">JPG, PNG — max 5MB</p>
              </button>
            )}
          </div>

          {/* Transaction ID — OPTIONAL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
              PayPal Transaction ID{" "}
              <span className="text-gray-400 font-normal">
                (optional — speeds things up)
              </span>
            </label>
            <input
              type="text"
              placeholder="e.g. 5TY12345AB678901C"
              value={proofTxId}
              onChange={(e) => setProofTxId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <Button
            fullWidth
            onClick={handleSubmitProof}
            isLoading={proofSubmitting}
            disabled={!proofScreenshot}
          >
            <Upload className="w-4 h-4 mr-2" />
            Submit Proof
          </Button>
        </div>
      </Modal>

      {/* ─── Profile / Bank Details Modal ─── */}
      <Modal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        title="My Profile & Bank Details"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={profileForm.name}
              onChange={(e) =>
                setProfileForm({ ...profileForm, name: e.target.value })
              }
            />
            <Input
              label="Phone Number"
              value={profileForm.phone}
              onChange={(e) =>
                setProfileForm({ ...profileForm, phone: e.target.value })
              }
            />
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Bank Account Details
            </h4>
            <p className="text-xs text-gray-500 mb-3">
              This is where we will send your Rands after verifying your
              payment.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Your Bank"
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
                  setProfileForm({
                    ...profileForm,
                    accountNumber: e.target.value,
                  })
                }
              />
              <Input
                label="Account Holder Name (exactly as on your bank card)"
                value={profileForm.accountHolder}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    accountHolder: e.target.value,
                  })
                }
              />
              <Input
                label="Branch Code (optional)"
                value={profileForm.branchCode}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, branchCode: e.target.value })
                }
              />
            </div>
          </div>

          <Button
            fullWidth
            onClick={handleSaveProfile}
            isLoading={profileSaving}
          >
            Save My Details
          </Button>
        </div>
      </Modal>
    </>
  );
}
