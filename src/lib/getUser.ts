import { auth, currentUser } from "@clerk/nextjs/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

/** Gets the MongoDB user for the current Clerk session. Creates the record if it doesn't exist yet (lazy init). */
export async function getDbUser() {
  const { userId } = await auth();
  if (!userId) return null;

  await dbConnect();

  let user = await User.findOne({ clerkId: userId });

  if (!user) {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
      clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0] ||
      "User";

    user = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        $setOnInsert: {
          clerkId: userId,
          name,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          phone: "",
        },
      },
      { upsert: true, new: true }
    );
  }

  return user;
}

/** Returns the Clerk user only if they have the "admin" role in publicMetadata. */
export async function requireAdmin() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;
  const role = clerkUser.publicMetadata?.role as string | undefined;
  return role === "admin" ? clerkUser : null;
}
