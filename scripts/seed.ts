/**
 * Annathan Pay — Database Seeder
 * Wipes all existing users from MongoDB + Clerk, then creates
 * 2 admin accounts and 2 user accounts fresh.
 *
 * Run with:
 *   npx ts-node --skip-project scripts/seed.ts
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Load .env.local before anything else (run from project root)
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { createClerkClient } from "@clerk/backend";
import mongoose from "mongoose";

// ─── Clerk client ────────────────────────────────────────────────────────────
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

// ─── Minimal User model (mirrors src/lib/models/User.ts) ─────────────────────
const UserSchema = new mongoose.Schema(
  {
    clerkId:       { type: String, required: true, unique: true },
    name:          { type: String, required: true },
    email:         { type: String, required: true, unique: true, lowercase: true },
    phone:         { type: String, default: "" },
    bankName:      { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    accountHolder: { type: String, default: "" },
    branchCode:    { type: String, default: "" },
    role:          { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

const User =
  mongoose.models.User ?? mongoose.model("User", UserSchema);

// ─── Seed data ────────────────────────────────────────────────────────────────
const SEED_USERS = [
  // ── Admins ──────────────────────────────────────────
  {
    firstName:     "Andrew",
    lastName:      "Lekgowane",
    email:         "lekgowanek@promilezi.co.za",
    password:      "Annathan@Admin1",
    phone:         "0821111111",
    role:          "admin" as const,
    bankName:      "FNB",
    accountNumber: "62000000001",
    accountHolder: "Andrew Lekgowane",
    branchCode:    "250655",
  },
  {
    firstName:     "Sarah",
    lastName:      "Mokoena",
    email:         "sarah@annathanpay.co.za",
    password:      "Annathan@Admin2",
    phone:         "0822222222",
    role:          "admin" as const,
    bankName:      "Standard Bank",
    accountNumber: "00000000002",
    accountHolder: "Sarah Mokoena",
    branchCode:    "051001",
  },
  // ── Regular Users ─────────────────────────────────
  {
    firstName:     "Thabo",
    lastName:      "Dlamini",
    email:         "thabo@example.com",
    password:      "Annathan@User1",
    phone:         "0833333333",
    role:          "user" as const,
    bankName:      "Capitec",
    accountNumber: "1234567890",
    accountHolder: "Thabo Dlamini",
    branchCode:    "470010",
  },
  {
    firstName:     "Precious",
    lastName:      "Nkosi",
    email:         "precious@example.com",
    password:      "Annathan@User2",
    phone:         "0844444444",
    role:          "user" as const,
    bankName:      "Absa",
    accountNumber: "9876543210",
    accountHolder: "Precious Nkosi",
    branchCode:    "632005",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function deleteAllClerkUsersForEmail(email: string) {
  try {
    const { data: existing } = await clerk.users.getUserList({
      emailAddress: [email],
    });
    for (const u of existing) {
      await clerk.users.deleteUser(u.id);
      console.log(`   🗑  Deleted Clerk user: ${email} (${u.id})`);
    }
  } catch {
    // Ignore — not found is fine
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Connect to MongoDB
  const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017/annathan-pay";
  await mongoose.connect(uri);
  console.log("✅ Connected to MongoDB:", uri);

  // ── Step 1: Wipe ALL existing users from MongoDB ───────────────────────────
  console.log("\n🧹 Wiping all existing users from MongoDB...");
  const deleted = await User.deleteMany({});
  console.log(`   ✅ Deleted ${deleted.deletedCount} user(s)\n`);

  // ── Step 2: Delete matching Clerk accounts ─────────────────────────────────
  console.log("🧹 Removing existing Clerk accounts...");
  for (const seed of SEED_USERS) {
    await deleteAllClerkUsersForEmail(seed.email);
  }
  // Also clean up the old legacy emails that won't be re-created
  const legacyEmails = [
    "admin@annathanpay.co.za",
    "andrew@annathanpay.co.za",
    "user@example.com",
    "motau@gmail.com",
  ];
  for (const email of legacyEmails) {
    await deleteAllClerkUsersForEmail(email);
  }
  console.log();

  // ── Step 3: Create fresh users ─────────────────────────────────────────────
  console.log("🌱 Seeding fresh users...\n");

  for (const seed of SEED_USERS) {
    const fullName = `${seed.firstName} ${seed.lastName}`;
    console.log(`👤 Creating [${seed.role.toUpperCase()}] ${fullName} <${seed.email}>`);

    // Create the Clerk account
    let clerkUser;
    try {
      clerkUser = await clerk.users.createUser({
        firstName:      seed.firstName,
        lastName:       seed.lastName,
        username:       `${seed.firstName}${seed.lastName}`.toLowerCase(),
        emailAddress:   [seed.email],
        password:       seed.password,
        publicMetadata: { role: seed.role },
        skipPasswordChecks: true,
      });
      console.log(`   ✅ Clerk account created  (id: ${clerkUser.id})`);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errors" in err) {
        const clerkErr = err as { errors: Array<{ message: string; longMessage?: string; code: string }> };
        clerkErr.errors?.forEach((e) =>
          console.error(`   ❌ Clerk: [${e.code}] ${e.longMessage || e.message}`)
        );
      } else {
        console.error(`   ❌ Clerk error:`, err);
      }
      continue;
    }

    // Create the MongoDB profile
    try {
      await User.create({
        clerkId:       clerkUser.id,
        name:          fullName,
        email:         seed.email.toLowerCase(),
        phone:         seed.phone,
        role:          seed.role,
        bankName:      seed.bankName,
        accountNumber: seed.accountNumber,
        accountHolder: seed.accountHolder,
        branchCode:    seed.branchCode,
      });
      console.log(`   ✅ MongoDB profile created`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`   ❌ MongoDB error: ${msg}`);
    }

    console.log();
  }

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log("─────────────────────────────────────────────────────");
  console.log("🎉  Seeding complete!\n");
  console.log("ADMINS");
  console.log("  lekgowanek@promilezi.co.za  │  Annathan@Admin1");
  console.log("  sarah@annathanpay.co.za   │  Annathan@Admin2");
  console.log("\nUSERS");
  console.log("  thabo@example.com         │  Annathan@User1");
  console.log("  precious@example.com      │  Annathan@User2");
  console.log("─────────────────────────────────────────────────────");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
