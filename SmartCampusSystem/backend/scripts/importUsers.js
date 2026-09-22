const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { env } = require("../config/env");
const User = require("../models/User");

const dataPath = path.join(__dirname, "..", "data", "sample-dataset.json");

const importUsers = async () => {
  const raw = fs.readFileSync(dataPath, "utf8");
  const data = JSON.parse(raw);
  const users = Array.isArray(data.users) ? data.users : [];

  if (!users.length) {
    console.log("No users found in sample-dataset.json");
    return;
  }

  await mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 20000,
    tls: true,
    tlsAllowInvalidCertificates: true,
  });

  console.log(`Connected to MongoDB database: ${mongoose.connection.name}`);

  for (const userData of users) {
    const email = String(userData.email || "").trim().toLowerCase();
    if (!email) continue;

    const passwordHash = userData.password
      ? await bcrypt.hash(String(userData.password), 10)
      : undefined;

    const payload = {
      name: userData.name || email,
      email,
      role: userData.role || "student",
      isActive: userData.isActive ?? true,
      accountStatus: userData.accountStatus || "active",
      phone: userData.phone || "",
      department: userData.department || "",
      studyYear: userData.studyYear ?? null,
      semester: userData.semester ?? null,
      canteenKey: userData.canteenKey ?? null,
      monthlyFoodBudget: userData.monthlyFoodBudget ?? null,
      ...(passwordHash ? { password: passwordHash } : {}),
    };

    await User.updateOne({ email }, { $set: payload }, { upsert: true });
    console.log(`Imported/updated user: ${email}`);
  }

  console.log(`Completed import of ${users.length} users into ${mongoose.connection.name}.users`);
  await mongoose.disconnect();
};

importUsers().catch((error) => {
  console.error("User import failed:", error);
  process.exit(1);
});
