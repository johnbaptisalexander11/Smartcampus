/* eslint-disable no-console */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Prefer backend/.env (same as `npm run dev` from backend/), then project root
dotenv.config({ path: path.resolve(__dirname, "../.env") });
if (!process.env.MONGO_URI) {
  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
}

const User = require("../models/User");
const FoodCategory = require("../models/FoodCategory");
const FoodItem = require("../models/FoodItem");
const Order = require("../models/Order");
const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const Complaint = require("../models/Complaint");
const FoodSharePost = require("../models/FoodSharePost");
const StudyGroup = require("../models/StudyGroup");

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected for seed");
};

const clearData = async () => {
  await Promise.all([
    User.deleteMany({}),
    FoodCategory.deleteMany({}),
    FoodItem.deleteMany({}),
    Order.deleteMany({}),
    Wallet.deleteMany({}),
    WalletTransaction.deleteMany({}),
    Complaint.deleteMany({}),
    FoodSharePost.deleteMany({}),
    StudyGroup.deleteMany({}),
  ]);
  console.log("Old data cleared");
};

const seed = async () => {
  await connectDB();
  await clearData();

  // User.create (not insertMany) so pre("save") runs and passwords are bcrypt-hashed
  const users = await Promise.all([
    User.create({
      name: "Super Admin",
      email: "superadmin@campus.edu",
      password: "SuperAdmin123",
      role: "admin",
      isActive: true,
      canteenKey: null,
    }),
    User.create({
      name: "1st Canteen Admin",
      email: "canteen1@campus.edu",
      password: "CanteenAdmin1",
      role: "admin",
      isActive: true,
      canteenKey: "canteen1",
    }),
    User.create({
      name: "2nd Canteen Admin",
      email: "canteen2@campus.edu",
      password: "CanteenAdmin2",
      role: "admin",
      isActive: true,
      canteenKey: "canteen2",
    }),
    User.create({
      name: "3rd Canteen Admin",
      email: "canteen3@campus.edu",
      password: "CanteenAdmin3",
      role: "admin",
      isActive: true,
      canteenKey: "canteen3",
    }),
    User.create({
      name: "4th Canteen Admin",
      email: "canteen4@campus.edu",
      password: "CanteenAdmin4",
      role: "admin",
      isActive: true,
      canteenKey: "canteen4",
    }),
    User.create({
      name: "Vendor User",
      email: "vendor@campus.edu",
      password: "password123",
      role: "vendor",
      isActive: true,
    }),
    User.create({
      name: "Student One",
      email: "student1@campus.edu",
      password: "password123",
      role: "student",
      isActive: true,
      department: "Computer Science",
      studyYear: 2,
      semester: 1,
    }),
    User.create({
      name: "Student Two",
      email: "student2@campus.edu",
      password: "password123",
      role: "student",
      isActive: true,
      department: "Mechanical Engineering",
      studyYear: 2,
      semester: 1,
    }),
  ]);

  const canteen1Admin = users[1];
  const canteen2Admin = users[2];
  const canteen3Admin = users[3];
  const canteen4Admin = users[4];
  const vendor = users[5];
  const student1 = users[6];
  const student2 = users[7];

  const categories = await FoodCategory.insertMany([
    { name: "Breakfast", isActive: true },
    { name: "Lunch", isActive: true },
    { name: "Snacks", isActive: true },
    { name: "Beverages", isActive: true },
  ]);

  const [breakfast, lunch, snacks, beverages] = categories;

  const foodItems = await FoodItem.insertMany([
    {
      name: "Veg Sandwich",
      description: "Fresh sandwich with vegetables",
      price: 40,
      canteen: "1st Canteen",
      category: snacks._id,
      createdBy: canteen1Admin._id,
      isAvailable: true,
      averageRating: 4.2,
      totalReviews: 5,
    },
    {
      name: "Idli Sambar",
      description: "South Indian breakfast combo",
      price: 35,
      canteen: "2nd Canteen",
      category: breakfast._id,
      createdBy: canteen2Admin._id,
      isAvailable: true,
      averageRating: 4.5,
      totalReviews: 8,
    },
    {
      name: "Thali Meal",
      description: "Daily lunch thali",
      price: 90,
      canteen: "3rd Canteen",
      category: lunch._id,
      createdBy: canteen3Admin._id,
      isAvailable: true,
      averageRating: 4.0,
      totalReviews: 3,
    },
    {
      name: "Cold Coffee",
      description: "Chilled coffee drink",
      price: 60,
      canteen: "4th Canteen",
      category: beverages._id,
      createdBy: canteen4Admin._id,
      isAvailable: true,
      averageRating: 4.7,
      totalReviews: 10,
    },
  ]);

  const [student1Wallet, student2Wallet] = await Wallet.insertMany([
    {
      user: student1._id,
      balance: 5000,
      rewardPoints: 20,
    },
    {
      user: student2._id,
      balance: 5000,
      rewardPoints: 8,
    },
  ]);

  await WalletTransaction.insertMany([
    {
      wallet: student1Wallet._id,
      user: student1._id,
      type: "topup",
      amount: 5000,
      description: "Initial top up",
      referenceType: "manual",
    },
    {
      wallet: student2Wallet._id,
      user: student2._id,
      type: "topup",
      amount: 5000,
      description: "Initial top up",
      referenceType: "manual",
    },
  ]);

  await Complaint.insertMany([
    {
      user: student1._id,
      title: "Late order delivery",
      description: "My order was delayed by 40 minutes.",
      category: "order",
      status: "open",
    },
    {
      user: student2._id,
      title: "Wallet deduction issue",
      description: "Amount was deducted twice.",
      category: "wallet",
      status: "in_progress",
      adminNote: "Investigation started.",
    },
  ]);

  const now = Date.now();
  const [sandwich, idli, thali, coffee] = foodItems;

  await Order.insertMany([
    {
      user: student1._id,
      items: [
        {
          foodItem: sandwich._id,
          name: sandwich.name,
          quantity: 2,
          unitPrice: sandwich.price,
          lineTotal: sandwich.price * 2,
        },
      ],
      canteen: sandwich.canteen,
      subtotal: sandwich.price * 2,
      deliveryFee: 0,
      totalAmount: sandwich.price * 2,
      orderCode: "ORD-1001",
      paymentMethod: "wallet",
      paymentStatus: "paid",
      status: "completed",
      statusHistory: [
        { status: "placed", changedAt: new Date(now - 3 * 60 * 60 * 1000), note: "Order placed" },
        { status: "completed", changedAt: new Date(now - 2 * 60 * 60 * 1000), note: "Completed" },
      ],
    },
    {
      user: student1._id,
      items: [
        {
          foodItem: coffee._id,
          name: coffee.name,
          quantity: 1,
          unitPrice: coffee.price,
          lineTotal: coffee.price,
        },
      ],
      canteen: coffee.canteen,
      subtotal: coffee.price,
      deliveryFee: 0,
      totalAmount: coffee.price,
      orderCode: "ORD-1002",
      paymentMethod: "cash",
      paymentStatus: "pending",
      status: "preparing",
      statusHistory: [
        { status: "placed", changedAt: new Date(now - 20 * 60 * 1000), note: "Order placed" },
        { status: "preparing", changedAt: new Date(now - 10 * 60 * 1000), note: "Being prepared" },
      ],
    },
    {
      user: student2._id,
      items: [
        {
          foodItem: idli._id,
          name: idli.name,
          quantity: 1,
          unitPrice: idli.price,
          lineTotal: idli.price,
        },
        {
          foodItem: thali._id,
          name: thali.name,
          quantity: 1,
          unitPrice: thali.price,
          lineTotal: thali.price,
        },
      ],
      canteen: idli.canteen,
      subtotal: idli.price + thali.price,
      deliveryFee: 0,
      totalAmount: idli.price + thali.price,
      orderCode: "ORD-1003",
      paymentMethod: "wallet",
      paymentStatus: "paid",
      status: "ready",
      statusHistory: [
        { status: "placed", changedAt: new Date(now - 45 * 60 * 1000), note: "Order placed" },
        { status: "ready", changedAt: new Date(now - 5 * 60 * 1000), note: "Ready for pickup" },
      ],
    },
    {
      user: student2._id,
      items: [
        {
          foodItem: sandwich._id,
          name: sandwich.name,
          quantity: 1,
          unitPrice: sandwich.price,
          lineTotal: sandwich.price,
        },
      ],
      canteen: sandwich.canteen,
      subtotal: sandwich.price,
      deliveryFee: 0,
      totalAmount: sandwich.price,
      orderCode: "ORD-1004",
      paymentMethod: "cash",
      paymentStatus: "pending",
      status: "placed",
      statusHistory: [{ status: "placed", changedAt: new Date(now - 5 * 60 * 1000), note: "Order placed" }],
    },
  ]);

  await FoodSharePost.insertMany([
    {
      user: student1._id,
      title: "Extra Veg Biryani",
      description: "Freshly packed, can share 1 box.",
      shareType: "free_food",
      imageUrl: "",
      pickupLocation: "Hostel Block A Lobby",
      totalPortions: 2,
      maxMembers: 2,
      expiryTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      status: "available",
      joins: [],
      safetyDisclaimer: true,
    },
    {
      user: student2._id,
      title: "Extra Juice Box",
      description: "Unopened juice.",
      shareType: "shared_cost",
      imageUrl: "",
      pickupLocation: "Library Entrance",
      totalPortions: 1,
      maxMembers: 1,
      expiryTime: new Date(Date.now() + 60 * 60 * 1000),
      status: "resolved",
      joins: [{ user: student1._id, joinedAt: new Date() }],
      resolvedAt: new Date(),
      safetyDisclaimer: true,
    },
    {
      user: student1._id,
      title: "Homemade Chapati Pack",
      description: "4 chapatis with curry leftover from lunch.",
      shareType: "free_food",
      imageUrl: "",
      pickupLocation: "Canteen 1 Gate",
      totalPortions: 3,
      maxMembers: 3,
      expiryTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
      status: "available",
      joins: [],
      safetyDisclaimer: true,
    },
  ]);

  await StudyGroup.insertMany([
    {
      name: "DBMS Final Prep",
      subject: "Database Management Systems",
      description: "Revision for semester finals",
      createdBy: student1._id,
      roomBookingNote: "Placeholder: request Room B-204",
      maxMembers: 4,
      location: "Library Entrance",
      sessionTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      targetStudyYear: 2,
      targetSemester: 1,
      members: [
        { user: student1._id, role: "owner" },
        { user: student2._id, role: "member" },
      ],
      tasks: [
        { title: "Normalize sample schema", status: "todo", assignedTo: student1._id },
        { title: "Solve SQL practice set", status: "in_progress", assignedTo: student2._id },
      ],
      notes: [
        { title: "Important ER concepts", content: "Entity, Relationship, Cardinality", uploadedBy: student1._id },
      ],
      attendance: [{ sessionDate: new Date(), presentMembers: [student1._id, student2._id] }],
    },
    {
      name: "OS Lab Practice",
      subject: "Operating Systems",
      description: "Scheduling algorithms and deadlocks practice session",
      createdBy: student2._id,
      roomBookingNote: "Lab C-12 preferred",
      maxMembers: 3,
      location: "CS Lab Building",
      sessionTime: new Date(Date.now() + 26 * 60 * 60 * 1000),
      targetStudyYear: 2,
      targetSemester: 1,
      members: [
        { user: student2._id, role: "owner" },
        { user: student1._id, role: "member" },
      ],
      tasks: [
        { title: "Review Round Robin notes", status: "done", assignedTo: student2._id },
        { title: "Banker's algorithm worksheet", status: "todo", assignedTo: student1._id },
      ],
      notes: [
        {
          title: "Process states",
          content: "New → Ready → Running → Waiting → Terminated",
          uploadedBy: student2._id,
        },
      ],
      attendance: [],
    },
  ]);

  console.log("Seed data inserted successfully.");
  console.log("Sample credentials:");
  console.log("Super Admin     : superadmin@campus.edu / SuperAdmin123");
  console.log("1st Canteen     : canteen1@campus.edu / CanteenAdmin1");
  console.log("2nd Canteen     : canteen2@campus.edu / CanteenAdmin2");
  console.log("3rd Canteen     : canteen3@campus.edu / CanteenAdmin3");
  console.log("4th Canteen     : canteen4@campus.edu / CanteenAdmin4");
  console.log("Vendor          : vendor@campus.edu / password123");
  console.log("Student         : student1@campus.edu / password123");
  console.log("Student         : student2@campus.edu / password123");

  console.log("Seeded food items:", foodItems.length);
  console.log("Seeded orders, food share posts, and study groups");
  await mongoose.connection.close();
  process.exit(0);
};

seed().catch(async (error) => {
  console.error("Seed failed:", error.message);
  await mongoose.connection.close();
  process.exit(1);
});
