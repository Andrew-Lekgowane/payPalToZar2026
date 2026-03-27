import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const { name, email, phone, bankName, accountNumber, accountHolder, branchCode, role, password } = body;

    // Validate role if provided
    if (role && !["user", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Prevent admin from demoting themselves
    if (id === session.user.id && role && role !== "admin") {
      return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
    }

    // Check for duplicate email (if email is being changed)
    if (email) {
      const existing = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: id } });
      if (existing) {
        return NextResponse.json({ error: "Email already in use by another account" }, { status: 400 });
      }
    }

    // Build update object — only include provided fields
    const updateFields: Record<string, string> = {};
    if (name)          updateFields.name          = name.trim();
    if (email)         updateFields.email         = email.toLowerCase().trim();
    if (phone)         updateFields.phone         = phone.trim();
    if (bankName  !== undefined) updateFields.bankName      = bankName;
    if (accountNumber !== undefined) updateFields.accountNumber = accountNumber;
    if (accountHolder !== undefined) updateFields.accountHolder = accountHolder;
    if (branchCode  !== undefined) updateFields.branchCode   = branchCode;
    if (role)          updateFields.role          = role;

    // Hash new password if provided
    if (password && password.trim().length >= 6) {
      updateFields.password = await bcrypt.hash(password.trim(), 12);
    }

    const updated = await User.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: updated });
  } catch (error: unknown) {
    console.error("Admin update user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;

    if (id === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User deleted" });
  } catch (error: unknown) {
    console.error("Admin delete user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
