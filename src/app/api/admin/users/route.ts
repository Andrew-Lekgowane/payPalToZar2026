import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";

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

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const { name, email, password, phone, role, bankName, accountNumber, accountHolder, branchCode } = await req.json();

    // Validate required fields
    if (!name?.trim())     return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!email?.trim())    return NextResponse.json({ error: "Email is required" }, { status: 400 });
    if (!password?.trim()) return NextResponse.json({ error: "Password is required" }, { status: 400 });
    if (!phone?.trim())    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    if (password.trim().length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

    // Check for duplicate email
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 12);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password: hashedPassword,
      role: ["user", "admin"].includes(role) ? role : "user",
      bankName:      bankName      || "",
      accountNumber: accountNumber || "",
      accountHolder: accountHolder || "",
      branchCode:    branchCode    || "",
    });

    const { password: _pw, ...safeUser } = user.toObject();
    void _pw;

    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (error: unknown) {
    console.error("Admin create user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
