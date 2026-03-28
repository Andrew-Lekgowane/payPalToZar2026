import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/getUser";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/lib/models/Transaction";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const allowedFields: Record<string, unknown> = {};
    if (body.status !== undefined) allowedFields.status = body.status;
    if (body.adminNote !== undefined) allowedFields.adminNote = body.adminNote;

    const updated = await Transaction.findByIdAndUpdate(
      id,
      { $set: allowedFields },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json({ transaction: updated });
  } catch (error: unknown) {
    console.error("Admin update transaction error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
