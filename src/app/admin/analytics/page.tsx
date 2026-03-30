"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, DollarSign, ArrowRightLeft,
  Users, CheckCircle, Clock, BarChart2, RefreshCw,
  Zap, ChevronRight, Award,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import AdminBottomNav from "@/components/mobile/AdminBottomNav";
import Card from "@/components/ui/Card";

/* ═══════════════════════════════════════════════════════════════════
   Types
═══════════════════════════════════════════════════════════════════ */

interface Summary {
  totalFees: number;
  totalVolume: number;
  totalUSD: number;
  txCount: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
  completionRate: number;
  userCount: number;
  activeUsers: number;
  avgTxUSD: number;
  avgFeePerTx: number;
  feeGrowth: number | null;
}

interface SeriesPoint { date: string; fees: number; volume: number; count: number; usd: number }
interface StatusBreakdown { pending: number; verifying: number; processing: number; completed: number; failed: number; refunded: number }
interface UserGrowthPoint { date: string; count: number; total: number }
interface TopTx { _id: string; amountUSD: number; amountZAR: number; serviceFee: number; createdAt: string; userId: { name: string; email: string } | null }

interface AnalyticsData {
  period: string;
  summary: Summary;
  timeSeries: SeriesPoint[];
  statusBreakdown: StatusBreakdown;
  userGrowth: UserGrowthPoint[];
  topTransactions: TopTx[];
}

type Period = "7d" | "30d" | "6m" | "1y" | "all";

/* ═══════════════════════════════════════════════════════════════════
   Formatters
═══════════════════════════════════════════════════════════════════ */

const fmtZAR = (n: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(n);

const fmtUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

function fmtDate(raw: string, period: Period): string {
  if (raw.length === 7) {
    const [y, m] = raw.split("-");
    return new Date(+y, +m - 1, 1).toLocaleDateString("en-ZA", { month: "short", year: "2-digit" });
  }
  const d = new Date(raw);
  if (period === "7d") return d.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric" });
  return d.toLocaleDateString("en-ZA", { month: "short", day: "numeric" });
}

/* ═══════════════════════════════════════════════════════════════════
   SVG Charts
═══════════════════════════════════════════════════════════════════ */

function AreaChart({
  data, valueKey, color, period,
}: { data: SeriesPoint[]; valueKey: "fees" | "volume" | "count"; color: string; period: Period }) {
  const W = 600; const H = 160;
  const pL = 4; const pR = 4; const pT = 8; const pB = 8;
  const plotW = W - pL - pR; const plotH = H - pT - pB;

  const values = data.map(d => d[valueKey] as number);
  const maxVal = Math.max(...values, 1);

  const pts = data.map((d, i) => ({
    x: pL + (data.length > 1 ? (i / (data.length - 1)) * plotW : plotW / 2),
    y: pT + (1 - (d[valueKey] as number) / maxVal) * plotH,
    d,
  }));

  if (pts.length < 2) return (
    <div className="flex items-center justify-center h-full text-gray-300 text-xs">No data yet</div>
  );

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${pts[pts.length - 1].x.toFixed(1)},${(pT + plotH).toFixed(1)} L${pL},${(pT + plotH).toFixed(1)} Z`;
  const gradId = `ag-${valueKey}-${color.replace("#", "")}`;

  const labelEvery = data.length <= 8 ? 1 : data.length <= 16 ? 2 : Math.ceil(data.length / 8);
  const labels = pts.filter((_, i) => i % labelEvery === 0 || i === pts.length - 1);

  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map(p => (
        <line key={p} x1={pL} y1={pT + p * plotH} x2={W - pR} y2={pT + p * plotH} stroke="#e5e7eb" strokeWidth="1" />
      ))}
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} stroke="white" strokeWidth="1.5" />
      ))}
      {labels.map((p, i) => (
        <text key={i} x={p.x} y={H + 16} textAnchor="middle" fontSize="9" fill="#9ca3af">
          {fmtDate(p.d.date, period)}
        </text>
      ))}
    </svg>
  );
}

function DonutChart({ breakdown }: { breakdown: StatusBreakdown }) {
  const segments = [
    { label: "Completed",  value: breakdown.completed,  color: "#10b981" },
    { label: "Pending",    value: breakdown.pending,    color: "#f59e0b" },
    { label: "Verifying",  value: breakdown.verifying,  color: "#6366f1" },
    { label: "Processing", value: breakdown.processing, color: "#3b82f6" },
    { label: "Failed",     value: breakdown.failed,     color: "#ef4444" },
    { label: "Refunded",   value: breakdown.refunded,   color: "#6b7280" },
  ].filter(s => s.value > 0);

  const total = segments.reduce((s, d) => s + d.value, 0) || 1;
  const r = 44; const cx = 60; const cy = 60;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  const arcs = segments.map(s => {
    const dash = (s.value / total) * circ;
    const arc = { ...s, dash, gap: circ - dash, offset };
    offset += dash;
    return arc;
  });

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="w-28 h-28 shrink-0 -rotate-90">
        {total === 0 ? (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth="16" />
        ) : arcs.map((arc, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={arc.color} strokeWidth="16"
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={-arc.offset}
          />
        ))}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
          fontSize="16" fontWeight="700" fill="currentColor"
          className="rotate-90 origin-[60px_60px]"
          style={{ transform: "rotate(90deg)", transformOrigin: "60px 60px" }}>
          {total}
        </text>
      </svg>
      <div className="flex flex-col gap-1.5 min-w-0">
        {segments.map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{s.label}</span>
            <span className="ml-auto text-xs font-semibold text-gray-900 dark:text-white pl-2">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniBarChart({ data, valueKey, color }: { data: UserGrowthPoint[]; valueKey: "total" | "count"; color: string }) {
  const values = data.map(d => d[valueKey]);
  const maxVal = Math.max(...values, 1);
  const barW = Math.max(4, Math.floor(560 / Math.max(data.length, 1)) - 4);

  return (
    <svg viewBox={`0 0 600 100`} className="w-full" preserveAspectRatio="none">
      {data.map((d, i) => {
        const h = ((d[valueKey] / maxVal) * 80);
        const x = 20 + i * (560 / Math.max(data.length - 1, 1));
        return (
          <rect key={i} x={x - barW / 2} y={100 - h - 10} width={barW} height={h}
            rx="3" fill={color} opacity="0.75" />
        );
      })}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   KPI Card
═══════════════════════════════════════════════════════════════════ */

function KpiCard({
  icon, label, value, sub, trend, trendLabel, accent,
}: {
  icon: React.ReactNode; label: string; value: string; sub?: string;
  trend?: number | null; trendLabel?: string; accent: string;
}) {
  return (
    <Card className="p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
          {icon}
        </div>
        {trend != null && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        {trendLabel && <p className="text-xs text-gray-400 mt-0.5">{trendLabel}</p>}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Period Selector
═══════════════════════════════════════════════════════════════════ */

const PERIODS: { label: string; value: Period }[] = [
  { label: "7D",   value: "7d"  },
  { label: "30D",  value: "30d" },
  { label: "6M",   value: "6m"  },
  { label: "1Y",   value: "1y"  },
  { label: "All",  value: "all" },
];

/* ═══════════════════════════════════════════════════════════════════
   Main Page
═══════════════════════════════════════════════════════════════════ */

function AnalyticsPageInner() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<"fees" | "volume">("fees");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push("/login"); return; }
    if (user.publicMetadata?.role !== "admin") { router.push("/dashboard"); return; }
  }, [isLoaded, user, router]);

  const fetchData = useCallback(async (p: Period = period, silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`/api/admin/analytics?period=${p}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setData(json);
    } catch {
      // keep stale data on refresh error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    if (isLoaded && user?.publicMetadata?.role === "admin") fetchData(period);
  }, [isLoaded, user, period, fetchData]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <RefreshCw className="w-5 h-5 text-violet-500 animate-spin" />
          <p className="text-sm text-gray-500">Loading analytics…</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { summary, timeSeries, statusBreakdown, userGrowth, topTransactions } = data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <main className="pt-20 pb-28 px-4 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Revenue, growth &amp; transaction insights</p>
          </div>
          <button
            onClick={() => fetchData(period, true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:border-violet-400 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Period tabs */}
        <div className="flex gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-1 mb-6 w-fit">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                period === p.value
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <KpiCard
            icon={<DollarSign className="w-5 h-5 text-white" />}
            label="Admin Earnings"
            value={fmtZAR(summary.totalFees)}
            sub={`avg ${fmtZAR(summary.avgFeePerTx)} / tx`}
            trend={summary.feeGrowth}
            trendLabel="vs prev period"
            accent="bg-violet-600"
          />
          <KpiCard
            icon={<ArrowRightLeft className="w-5 h-5 text-white" />}
            label="Total Volume (ZAR)"
            value={fmtZAR(summary.totalVolume)}
            sub={`${fmtUSD(summary.totalUSD)} converted`}
            accent="bg-indigo-600"
          />
          <KpiCard
            icon={<CheckCircle className="w-5 h-5 text-white" />}
            label="Completion Rate"
            value={`${summary.completionRate}%`}
            sub={`${summary.completedCount} of ${summary.txCount} tx`}
            accent="bg-emerald-600"
          />
          <KpiCard
            icon={<BarChart2 className="w-5 h-5 text-white" />}
            label="Transactions"
            value={summary.txCount.toString()}
            sub={`${summary.pendingCount} pending`}
            accent="bg-blue-600"
          />
          <KpiCard
            icon={<Users className="w-5 h-5 text-white" />}
            label="Total Users"
            value={summary.userCount.toString()}
            sub={`${summary.activeUsers} active`}
            accent="bg-pink-600"
          />
          <KpiCard
            icon={<Clock className="w-5 h-5 text-white" />}
            label="Avg Tx Size"
            value={fmtUSD(summary.avgTxUSD)}
            sub="per completed tx"
            accent="bg-amber-600"
          />
        </div>

        {/* Revenue Chart */}
        <Card className="p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {chartMode === "fees" ? "Admin Earnings" : "Payout Volume"}
            </h2>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
              <button
                onClick={() => setChartMode("fees")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  chartMode === "fees" ? "bg-white dark:bg-gray-700 text-violet-600 shadow-sm" : "text-gray-500"
                }`}
              >
                Earnings
              </button>
              <button
                onClick={() => setChartMode("volume")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  chartMode === "volume" ? "bg-white dark:bg-gray-700 text-indigo-600 shadow-sm" : "text-gray-500"
                }`}
              >
                Volume
              </button>
            </div>
          </div>
          <div className="h-44">
            {timeSeries.length < 2 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                <BarChart2 className="w-10 h-10" />
                <p className="text-sm">No completed transactions yet</p>
                <p className="text-xs text-gray-400">Chart will populate as transactions complete</p>
              </div>
            ) : (
              <AreaChart
                data={timeSeries}
                valueKey={chartMode}
                color={chartMode === "fees" ? "#7c3aed" : "#4f46e5"}
                period={period}
              />
            )}
          </div>
        </Card>

        {/* Status + Top Transactions */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">

          {/* Status Breakdown */}
          <Card className="p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Transaction Status</h2>
            {summary.txCount === 0 ? (
              <div className="flex items-center justify-center h-24 text-gray-300 text-sm">No transactions yet</div>
            ) : (
              <DonutChart breakdown={statusBreakdown} />
            )}
          </Card>

          {/* Top Transactions */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-amber-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Top Earners (All Time)</h2>
            </div>
            {topTransactions.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-gray-300 text-sm">No completed transactions yet</div>
            ) : (
              <div className="flex flex-col gap-2">
                {topTransactions.map((tx, i) => (
                  <div key={tx._id} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0 ? "bg-amber-100 text-amber-700" :
                      i === 1 ? "bg-gray-100 text-gray-600" :
                      i === 2 ? "bg-orange-100 text-orange-600" :
                      "bg-gray-50 text-gray-400"
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {tx.userId?.name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{fmtUSD(tx.amountUSD)} → {fmtZAR(tx.amountZAR)}</p>
                    </div>
                    <span className="text-xs font-bold text-violet-600 shrink-0">{fmtZAR(tx.serviceFee)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* User Growth */}
        <Card className="p-5 mb-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">User Growth (All Time)</h2>
          {userGrowth.length === 0 ? (
            <div className="flex items-center justify-center h-20 text-gray-300 text-sm">No users yet</div>
          ) : (
            <>
              <div className="flex items-end gap-4 mb-3">
                <div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{summary.userCount}</p>
                  <p className="text-xs text-gray-400">registered users</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-emerald-600">{summary.activeUsers}</p>
                  <p className="text-xs text-gray-400">have transacted</p>
                </div>
              </div>
              <div className="h-20">
                <MiniBarChart data={userGrowth} valueKey="total" color="#7c3aed" />
              </div>
              <div className="flex justify-between mt-1">
                {userGrowth.length > 0 && (
                  <>
                    <span className="text-xs text-gray-400">{fmtDate(userGrowth[0].date, "1y")}</span>
                    <span className="text-xs text-gray-400">{fmtDate(userGrowth[userGrowth.length - 1].date, "1y")}</span>
                  </>
                )}
              </div>
            </>
          )}
        </Card>

        {/* Quick link back to admin panel */}
        <Link
          href="/admin"
          className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-violet-300 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Admin Panel</p>
              <p className="text-xs text-gray-400">Manage transactions &amp; users</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-violet-500 transition-colors" />
        </Link>
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden">
        <AdminBottomNav
          active="analytics"
          onTabChange={(tab) => router.push(`/admin?tab=${tab}`)}
          onOverview={() => router.push("/admin")}
          onAnalytics={() => {}}
        />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={null}>
      <AnalyticsPageInner />
    </Suspense>
  );
}
