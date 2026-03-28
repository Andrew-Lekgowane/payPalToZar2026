import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/getUser";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/lib/models/Transaction";

export async function GET() {
  try {
    const adminUser = await requireAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    const transactions = await Transaction.find()
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ transactions });
  } catch (error: unknown) {
    console.error("Admin get transactions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
