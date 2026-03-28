import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/getUser";
import { clerkClient } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET() {
  try {
    const adminUser = await requireAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const users = await User.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ users });
  } catch (error: unknown) {
    console.error("Admin get users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await requireAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const { name, email, password, phone, role, bankName, accountNumber, accountHolder, branchCode } = await req.json();

    // Validate required fields
    if (!name?.trim())     return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!email?.trim())    return NextResponse.json({ error: "Email is required" }, { status: 400 });
    if (!password?.trim()) return NextResponse.json({ error: "Password is required" }, { status: 400 });
    if (password.trim().length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
    }

    // Create user in Clerk
    const nameParts = name.trim().split(" ");
    let clerkUser;
    try {
      clerkUser = await (await clerkClient()).users.createUser({
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(" ") || undefined,
        emailAddress: [email.toLowerCase().trim()],
        password: password.trim(),
        publicMetadata: { role: ["user", "admin"].includes(role) ? role : "user" },
        skipPasswordChecks: true,
      });
    } catch (clerkErr: unknown) {
      const msg = clerkErr instanceof Error ? clerkErr.message : "Failed to create Clerk account";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const user = await User.create({
      clerkId: clerkUser.id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || "",
      role: ["user", "admin"].includes(role) ? role : "user",
      bankName:      bankName      || "",
      accountNumber: accountNumber || "",
      accountHolder: accountHolder || "",
      branchCode:    branchCode    || "",
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error: unknown) {
    console.error("Admin create user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
