import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/paypal-to-zar";

async function seed() {
  console.log("Connecting to database...");
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    const users = db.collection('users');

    const defaultPassword = await bcrypt.hash('password123', 12);

    const seedUsers = [
      {
        name: "Admin User",
        email: "admin@payzar.co.za",
        phone: "0720000000",
        password: defaultPassword,
        role: "admin",
        bankName: "FNB",
        accountNumber: "1234567890",
        accountHolder: "Admin Company",
        branchCode: "250655",
      },
      {
        name: "Test User",
        email: "user@example.com",
        phone: "0820000000",
        password: defaultPassword,
        role: "user",
        bankName: "Standard Bank",
        accountNumber: "0987654321",
        accountHolder: "Test User",
        branchCode: "051001",
      },
    ];

    for (const seedUser of seedUsers) {
      const existing = await users.findOne({ email: seedUser.email });
      if (existing) {
        console.log(`⏭  Skipped (already exists): ${seedUser.email}`);
      } else {
        await users.insertOne({ ...seedUser, createdAt: new Date(), updatedAt: new Date() });
        console.log(`✅ Created (${seedUser.role}): ${seedUser.email}`);
      }
    }

    console.log("✅ Seed completed successfully!");
    console.log("----------------------------------------");
    console.log("Admin login: admin@payzar.co.za / password123");
    console.log("User login:  user@example.com / password123");
    console.log("----------------------------------------");

  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await client.close();
    console.log("Database connection closed.");
  }
}

seed();
