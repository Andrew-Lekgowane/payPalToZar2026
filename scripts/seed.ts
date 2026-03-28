import dbConnect from "../src/lib/mongodb";

async function main() {
  await dbConnect();
  console.log("Connected to MongoDB.");
  console.log("Users are now managed via Clerk.");
  console.log("To set up an admin:");
  console.log("   1. Register at /register");
  console.log("   2. Go to Clerk Dashboard -> Users -> find your user");
  console.log("   3. Click the user -> Metadata -> Public:");
  console.log('      { "role": "admin" }');
  process.exit(0);
}

main().catch(console.error);
