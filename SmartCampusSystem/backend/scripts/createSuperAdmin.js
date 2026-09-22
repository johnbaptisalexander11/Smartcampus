/* eslint-disable no-console */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
if (!process.env.MONGO_URI) {
  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
}

const User = require("../models/User");

const EMAIL = "superadmin@campus.edu";
const PASSWORD = "SuperAdmin123";

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email: EMAIL }).select("+password");
  if (existing) {
    existing.name = "Super Admin";
    existing.role = "admin";
    existing.canteenKey = null;
    existing.isActive = true;
    existing.accountStatus = "active";
    existing.statusReason = "";
    existing.suspendedUntil = null;
    existing.password = PASSWORD;
    await existing.save();
    console.log("Super Admin updated:");
    console.log(`${EMAIL} / ${PASSWORD}`);
  } else {
    await User.create({
      name: "Super Admin",
      email: EMAIL,
      password: PASSWORD,
      role: "admin",
      isActive: true,
      canteenKey: null,
      accountStatus: "active",
    });
    console.log("Super Admin created:");
    console.log(`${EMAIL} / ${PASSWORD}`);
  }

  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error("Create super admin failed:", error.message);
  await mongoose.connection.close();
  process.exit(1);
});

