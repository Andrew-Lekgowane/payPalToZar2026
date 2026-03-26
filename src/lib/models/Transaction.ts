import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amountUSD: number;
  exchangeRate: number;
  serviceFee: number;
  amountZAR: number;
  paypalTransactionId: string;
  proofScreenshot: string;
  status: "pending" | "verifying" | "processing" | "completed" | "failed" | "refunded";
  adminNote: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branchCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amountUSD: { type: Number, required: true, min: 1 },
    exchangeRate: { type: Number, required: true },
    serviceFee: { type: Number, required: true },
    amountZAR: { type: Number, required: true },
    paypalTransactionId: { type: String, default: "" },
    proofScreenshot: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "verifying", "processing", "completed", "failed", "refunded"],
      default: "pending",
    },
    adminNote: { type: String, default: "" },
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    accountHolder: { type: String, required: true },
    branchCode: { type: String, default: "" },
  },
  { timestamps: true }
);

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);
export default Transaction;
