import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Legacy fallback — the primary login flow now goes straight to /dashboard.
 * If someone hits this URL directly, bounce them based on their auth state.
 */
export default async function AuthRedirectPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");
  // Dashboard's useEffect handles the admin → /admin redirect client-side
  redirect("/dashboard");
}
