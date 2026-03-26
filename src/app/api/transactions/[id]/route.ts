import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/lib/models/Transaction";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Users can only update their own pending transactions
    const isOwner = transaction.userId.toString() === session.user.id;
    const isAdmin = (session.user as { role?: string }).role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Users can only update proof/transactionId on pending transactions
    if (isOwner && !isAdmin) {
      if (!["pending", "verifying"].includes(transaction.status)) {
        return NextResponse.json(
          { error: "Cannot update a transaction that is already being processed" },
          { status: 400 }
        );
      }
      const allowed = ["paypalTransactionId", "proofScreenshot"];
      const update: Record<string, unknown> = {};
      for (const key of allowed) {
        if (body[key] !== undefined) update[key] = body[key];
      }
      if (body.paypalTransactionId || body.proofScreenshot) {
        update.status = "verifying";
      }
      const updated = await Transaction.findByIdAndUpdate(id, update, { new: true });
      return NextResponse.json({ transaction: updated });
    }

    // Admin can update anything
    if (isAdmin) {
      const updated = await Transaction.findByIdAndUpdate(id, body, { new: true });
      return NextResponse.json({ transaction: updated });
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error: unknown) {
    console.error("Update transaction error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
