import { auth, currentUser } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

/**
 * Gets the MongoDB user for the current Clerk session.
 *
 * Handles three cases:
 *  1. User already has a clerkId in MongoDB → fast path, return immediately.
 *  2. User exists by email but no clerkId (legacy / pre-Clerk record) → link
 *     the Clerk ID to their existing record so their data is preserved.
 *  3. Completely new user → create a fresh MongoDB record.
 */
export async function getDbUser() {
  const { userId } = await auth();
  if (!userId) return null;

  await dbConnect();

  // ── 1. Fast path ────────────────────────────────────────────────────────────
  const existing = await User.findOne({ clerkId: userId });
  if (existing) return existing;

  // ── Need Clerk profile to get email / name ──────────────────────────────────
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = (clerkUser.emailAddresses[0]?.emailAddress ?? "").toLowerCase();
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
    email.split("@")[0] ||
    "User";

  // ── 2. Legacy user — same email, no clerkId yet → link them ─────────────────
  if (email) {
    const legacy = await User.findOneAndUpdate(
      { email, clerkId: { $exists: false } },
      { $set: { clerkId: userId } },
      { new: true }
    );
    if (legacy) return legacy;
  }

  // ── 3. Brand-new user ────────────────────────────────────────────────────────
  try {
    const created = await User.create({ clerkId: userId, name, email, phone: "" });
    return created;
  } catch (err: unknown) {
    // Race condition: another request created the record between our check and insert
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      return User.findOne({ clerkId: userId });
    }
    throw err;
  }
}

/** Returns the MongoDB user only if their Clerk publicMetadata marks them as admin. */
export async function requireAdmin() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;
  const role = clerkUser.publicMetadata?.role as string | undefined;
  if (role !== "admin") return null;

  // Also return their MongoDB record so routes have access to _id etc.
  await dbConnect();
  return User.findOne({ clerkId: clerkUser.id });
}
