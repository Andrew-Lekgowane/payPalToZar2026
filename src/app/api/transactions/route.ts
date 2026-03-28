import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/getUser";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/lib/models/Transaction";

const EXCHANGE_RATE = parseFloat(process.env.EXCHANGE_RATE || "18.50");
const SERVICE_FEE_PERCENT = parseFloat(process.env.SERVICE_FEE_PERCENT || "35");

export async function POST(req: NextRequest) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { amountUSD, paypalTransactionId, proofScreenshot } = await req.json();

    if (!amountUSD || amountUSD < 5) {
      return NextResponse.json(
        { error: "Amount must be at least $5" },
        { status: 400 }
      );
    }

    if (amountUSD > 100) {
      return NextResponse.json(
        { error: "Maximum withdrawal is $100 USD per transaction" },
        { status: 400 }
      );
    }

    const user = dbUser;
    if (!user.bankName || !user.accountNumber || !user.accountHolder) {
      return NextResponse.json(
        { error: "Please update your bank details in your profile before creating a transaction" },
        { status: 400 }
      );
    }

    const serviceFee = (amountUSD * SERVICE_FEE_PERCENT) / 100;
    const amountAfterFee = amountUSD - serviceFee;
    const amountZAR = parseFloat((amountAfterFee * EXCHANGE_RATE).toFixed(2));

    const transaction = await Transaction.create({
      userId: dbUser._id,
      amountUSD,
      exchangeRate: EXCHANGE_RATE,
      serviceFee,
      amountZAR,
      paypalTransactionId: paypalTransactionId || "",
      proofScreenshot: proofScreenshot || "",
      status: paypalTransactionId || proofScreenshot ? "verifying" : "pending",
      bankName: user.bankName,
      accountNumber: user.accountNumber,
      accountHolder: user.accountHolder,
      branchCode: user.branchCode || "",
    });

    return NextResponse.json(
      { message: "Transaction created", transaction },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Create transaction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const transactions = await Transaction.find({ userId: dbUser._id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ transactions });
  } catch (error: unknown) {
    console.error("Get transactions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
