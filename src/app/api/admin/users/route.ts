import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    const users = await User.find().select("-password").sort({ createdAt: -1 }).lean();

    return NextResponse.json({ users });
  } catch (error: unknown) {
    console.error("Admin get users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
