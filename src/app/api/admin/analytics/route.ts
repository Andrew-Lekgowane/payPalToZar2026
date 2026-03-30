import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/getUser";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/lib/models/Transaction";
import User from "@/lib/models/User";

/* ── helpers ──────────────────────────────────────────────────────────────── */

function periodCutoff(period: string): Date | null {
  const now = Date.now();
  const MS = { "7d": 7, "30d": 30, "6m": 182, "1y": 365 };
  const days = MS[period as keyof typeof MS];
  return days ? new Date(now - days * 86_400_000) : null;
}

function seriesKey(d: Date, period: string): string {
  if (period === "7d" || period === "30d") return d.toISOString().slice(0, 10);
  if (period === "6m") {
    const s = new Date(d);
    s.setDate(d.getDate() - d.getDay());
    return s.toISOString().slice(0, 10);
  }
  return d.toISOString().slice(0, 7); // YYYY-MM
}

function fillSeries(
  map: Map<string, { fees: number; volume: number; count: number; usd: number }>,
  period: string,
  cutoff: Date | null,
): Array<{ date: string; fees: number; volume: number; count: number; usd: number }> {
  const zero = () => ({ fees: 0, volume: 0, count: 0, usd: 0 });

  if (!cutoff) {
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));
  }

  const result: Array<{ date: string; fees: number; volume: number; count: number; usd: number }> = [];
  const seen = new Set<string>();
  const cursor = new Date(cutoff);
  const now = new Date();

  while (cursor <= now) {
    const key = seriesKey(cursor, period);
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ date: key, ...(map.get(key) ?? zero()) });
    }
    if (period === "7d" || period === "30d") cursor.setDate(cursor.getDate() + 1);
    else if (period === "6m") cursor.setDate(cursor.getDate() + 7);
    else cursor.setMonth(cursor.getMonth() + 1);
  }

  return result;
}

/* ── route ────────────────────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await dbConnect();

    const period = req.nextUrl.searchParams.get("period") ?? "30d";
    const cutoff = periodCutoff(period);
    const txQuery = cutoff ? { createdAt: { $gte: cutoff } } : {};

    const [allTx, allUsers] = await Promise.all([
      Transaction.find(txQuery).lean(),
      User.find({ role: "user" }).lean(),
    ]);

    /* ── summary ── */
    const completed  = allTx.filter(t => t.status === "completed");
    const pending    = allTx.filter(t => ["pending", "verifying"].includes(t.status));
    const processing = allTx.filter(t => t.status === "processing");

    const totalFees   = completed.reduce((s, t) => s + (t.serviceFee  ?? 0), 0);
    const totalVolume = completed.reduce((s, t) => s + (t.amountZAR  ?? 0), 0);
    const totalUSD    = completed.reduce((s, t) => s + (t.amountUSD  ?? 0), 0);

    const r2 = (n: number) => Math.round(n * 100) / 100;

    /* ── status breakdown ── */
    const statusBreakdown = {
      pending:    allTx.filter(t => t.status === "pending").length,
      verifying:  allTx.filter(t => t.status === "verifying").length,
      processing: allTx.filter(t => t.status === "processing").length,
      completed:  completed.length,
      failed:     allTx.filter(t => t.status === "failed").length,
      refunded:   allTx.filter(t => t.status === "refunded").length,
    };

    /* ── time series ── */
    const seriesMap = new Map<string, { fees: number; volume: number; count: number; usd: number }>();

    for (const tx of allTx) {
      const key = seriesKey(new Date(tx.createdAt), period);
      const e = seriesMap.get(key) ?? { fees: 0, volume: 0, count: 0, usd: 0 };
      if (tx.status === "completed") {
        e.fees   += tx.serviceFee  ?? 0;
        e.volume += tx.amountZAR  ?? 0;
        e.usd    += tx.amountUSD  ?? 0;
      }
      e.count += 1;
      seriesMap.set(key, e);
    }

    const timeSeries = fillSeries(seriesMap, period, cutoff);

    /* ── user growth (cumulative, all-time by month) ── */
    const userMonthMap = new Map<string, number>();
    for (const u of allUsers) {
      const key = new Date(u.createdAt).toISOString().slice(0, 7);
      userMonthMap.set(key, (userMonthMap.get(key) ?? 0) + 1);
    }
    let cumulative = 0;
    const userGrowth = Array.from(userMonthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => { cumulative += count; return { date, count, total: cumulative }; });

    /* ── top 5 earners ── */
    const topTransactions = await Transaction.find({ status: "completed" })
      .sort({ serviceFee: -1 })
      .limit(5)
      .populate("userId", "name email")
      .lean();

    /* ── previous period comparison (fees only) ── */
    let prevFees = 0;
    if (cutoff) {
      const prevCutoff = new Date(cutoff.getTime() - (Date.now() - cutoff.getTime()));
      const prevTx = await Transaction.find({
        status: "completed",
        createdAt: { $gte: prevCutoff, $lt: cutoff },
      }).lean();
      prevFees = prevTx.reduce((s, t) => s + (t.serviceFee ?? 0), 0);
    }

    const feeGrowth = prevFees > 0 ? r2(((totalFees - prevFees) / prevFees) * 100) : null;

    return NextResponse.json({
      period,
      summary: {
        totalFees:       r2(totalFees),
        totalVolume:     r2(totalVolume),
        totalUSD:        r2(totalUSD),
        txCount:         allTx.length,
        completedCount:  completed.length,
        pendingCount:    pending.length + processing.length,
        failedCount:     allTx.filter(t => t.status === "failed").length,
        completionRate:  allTx.length > 0 ? Math.round((completed.length / allTx.length) * 100) : 0,
        userCount:       allUsers.length,
        activeUsers:     new Set(completed.map(t => t.userId?.toString())).size,
        avgTxUSD:        completed.length > 0 ? r2(totalUSD    / completed.length) : 0,
        avgFeePerTx:     completed.length > 0 ? r2(totalFees   / completed.length) : 0,
        feeGrowth,
      },
      timeSeries,
      statusBreakdown,
      userGrowth,
      topTransactions,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
