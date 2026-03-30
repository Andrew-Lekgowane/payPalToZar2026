import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/getUser";
import { clerkClient } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

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

    const { name, email, phone, bankName, accountNumber, accountHolder, branchCode, role } = body;

    // Validate role if provided
    if (role && !["user", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (targetUser.clerkId === adminUser.clerkId && role && role !== "admin") {
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

    // Sync role to Clerk publicMetadata if role is being changed
    if (role && targetUser) {
      try {
        await (await clerkClient()).users.updateUser(targetUser.clerkId, {
          publicMetadata: { role },
        });
      } catch { /* non-fatal */ }
    }

    const updated = await User.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

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
    const adminUser = await requireAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;

    const targetForDelete = await User.findById(id);
    if (!targetForDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (targetForDelete.clerkId === adminUser.clerkId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    // Delete from Clerk
    try {
      await (await clerkClient()).users.deleteUser(targetForDelete.clerkId);
    } catch { /* user may not exist in Clerk */ }

    await User.findByIdAndDelete(id);

    return NextResponse.json({ message: "User deleted" });
  } catch (error: unknown) {
    console.error("Admin delete user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
