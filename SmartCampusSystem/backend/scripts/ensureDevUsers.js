const User = require("../models/User");
const FoodCategory = require("../models/FoodCategory");
const FoodItem = require("../models/FoodItem");
const Order = require("../models/Order");
const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const FoodSharePost = require("../models/FoodSharePost");
const StudyGroup = require("../models/StudyGroup");

const DEMO_USERS = [
  {
    name: "Super Admin",
    email: "superadmin@campus.edu",
    password: "SuperAdmin123",
    role: "admin",
    isActive: true,
    phoneVerified: true,
    canteenKey: null,
  },
  {
    name: "1st Canteen Admin",
    email: "canteen1@campus.edu",
    password: "CanteenAdmin1",
    role: "admin",
    isActive: true,
    phoneVerified: true,
    canteenKey: "canteen1",
  },
  {
    name: "2nd Canteen Admin",
    email: "canteen2@campus.edu",
    password: "CanteenAdmin2",
    role: "admin",
    isActive: true,
    phoneVerified: true,
    canteenKey: "canteen2",
  },
  {
    name: "3rd Canteen Admin",
    email: "canteen3@campus.edu",
    password: "CanteenAdmin3",
    role: "admin",
    isActive: true,
    phoneVerified: true,
    canteenKey: "canteen3",
  },
  {
    name: "4th Canteen Admin",
    email: "canteen4@campus.edu",
    password: "CanteenAdmin4",
    role: "admin",
    isActive: true,
    phoneVerified: true,
    canteenKey: "canteen4",
  },
  {
    name: "Vendor User",
    email: "vendor@campus.edu",
    password: "password123",
    role: "vendor",
    isActive: true,
    phoneVerified: true,
  },
  {
    name: "Student One",
    email: "student1@campus.edu",
    password: "password123",
    role: "student",
    isActive: true,
    phoneVerified: true,
    department: "Computer Science",
    studyYear: 2,
    semester: 1,
  },
  {
    name: "Student Two",
    email: "student2@campus.edu",
    password: "password123",
    role: "student",
    isActive: true,
    phoneVerified: true,
    department: "Mechanical Engineering",
    studyYear: 2,
    semester: 1,
  },
];

const seedUsers = async () => {
  if ((await User.countDocuments()) > 0) {
    return {
      canteen1Admin: await User.findOne({ email: "canteen1@campus.edu" }),
      canteen2Admin: await User.findOne({ email: "canteen2@campus.edu" }),
      canteen3Admin: await User.findOne({ email: "canteen3@campus.edu" }),
      canteen4Admin: await User.findOne({ email: "canteen4@campus.edu" }),
      student1: await User.findOne({ email: "student1@campus.edu" }),
      student2: await User.findOne({ email: "student2@campus.edu" }),
    };
  }

  const users = await Promise.all(DEMO_USERS.map((user) => User.create(user)));
  console.log("Demo users seeded. Try student1@campus.edu / password123");

  return {
    canteen1Admin: users[1],
    canteen2Admin: users[2],
    canteen3Admin: users[3],
    canteen4Admin: users[4],
    student1: users[6],
    student2: users[7],
  };
};

const seedMenu = async (admins) => {
  if ((await FoodItem.countDocuments()) > 0) {
    return FoodItem.find().limit(4);
  }

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
      createdBy: admins.canteen1Admin._id,
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
      createdBy: admins.canteen2Admin._id,
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
      createdBy: admins.canteen3Admin._id,
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
      createdBy: admins.canteen4Admin._id,
      isAvailable: true,
      averageRating: 4.7,
      totalReviews: 10,
    },
  ]);

  console.log(`Seeded ${foodItems.length} food items`);
  return foodItems;
};

const seedWallets = async (student1, student2) => {
  if ((await Wallet.countDocuments()) > 0) return;

  const [student1Wallet, student2Wallet] = await Wallet.insertMany([
    { user: student1._id, balance: 5000, rewardPoints: 20 },
    { user: student2._id, balance: 5000, rewardPoints: 8 },
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
};

const seedOrders = async (student1, student2, foodItems) => {
  if ((await Order.countDocuments()) > 0) return;
  if (!foodItems?.length) return;

  const [sandwich, idli, thali, coffee] = foodItems;
  const now = Date.now();

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
        { status: "accepted", changedAt: new Date(now - 2.8 * 60 * 60 * 1000), note: "Accepted by canteen" },
        { status: "preparing", changedAt: new Date(now - 2.5 * 60 * 60 * 1000), note: "Preparing" },
        { status: "ready", changedAt: new Date(now - 2.2 * 60 * 60 * 1000), note: "Ready for pickup" },
        { status: "completed", changedAt: new Date(now - 2 * 60 * 60 * 1000), note: "Completed" },
      ],
      createdAt: new Date(now - 3 * 60 * 60 * 1000),
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
        { status: "accepted", changedAt: new Date(now - 15 * 60 * 1000), note: "Accepted" },
        { status: "preparing", changedAt: new Date(now - 10 * 60 * 1000), note: "Being prepared" },
      ],
      createdAt: new Date(now - 20 * 60 * 1000),
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
        { status: "accepted", changedAt: new Date(now - 40 * 60 * 1000), note: "Accepted" },
        { status: "preparing", changedAt: new Date(now - 30 * 60 * 1000), note: "Preparing" },
        { status: "ready", changedAt: new Date(now - 5 * 60 * 1000), note: "Ready for pickup" },
      ],
      createdAt: new Date(now - 45 * 60 * 1000),
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
      createdAt: new Date(now - 5 * 60 * 1000),
    },
  ]);

  console.log("Seeded sample food orders");
};

const seedFoodSharePosts = async (student1, student2) => {
  if ((await FoodSharePost.countDocuments()) > 0) return;

  const now = Date.now();

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
      expiryTime: new Date(now + 2 * 60 * 60 * 1000),
      foodType: "veg",
      foodSource: "packed",
      status: "available",
      joins: [],
      safetyDisclaimer: true,
    },
    {
      user: student2._id,
      title: "Extra Juice Box",
      description: "Unopened juice — first come first served.",
      shareType: "shared_cost",
      imageUrl: "",
      pickupLocation: "Library Entrance",
      totalPortions: 1,
      maxMembers: 1,
      expiryTime: new Date(now + 60 * 60 * 1000),
      foodType: "veg",
      foodSource: "unopened",
      status: "resolved",
      joins: [{ user: student1._id, joinedAt: new Date(now - 30 * 60 * 1000) }],
      resolvedAt: new Date(now - 15 * 60 * 1000),
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
      expiryTime: new Date(now + 3 * 60 * 60 * 1000),
      foodType: "veg",
      foodSource: "homemade",
      spicyLevel: "mild",
      status: "available",
      joins: [],
      safetyDisclaimer: true,
    },
  ]);

  console.log("Seeded sample food share posts");
};

const seedStudyGroups = async (student1, student2) => {
  if ((await StudyGroup.countDocuments()) > 0) return;

  const now = Date.now();

  await StudyGroup.insertMany([
    {
      name: "DBMS Final Prep",
      subject: "Database Management Systems",
      description: "Revision for semester finals",
      createdBy: student1._id,
      roomBookingNote: "Placeholder: request Room B-204",
      maxMembers: 4,
      location: "Library Entrance",
      sessionTime: new Date(now + 2 * 60 * 60 * 1000),
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
        {
          title: "Important ER concepts",
          content: "Entity, Relationship, Cardinality",
          uploadedBy: student1._id,
        },
      ],
      attendance: [{ sessionDate: new Date(now - 24 * 60 * 60 * 1000), presentMembers: [student1._id, student2._id] }],
    },
    {
      name: "OS Lab Practice",
      subject: "Operating Systems",
      description: "Scheduling algorithms and deadlocks practice session",
      createdBy: student2._id,
      roomBookingNote: "Lab C-12 preferred",
      maxMembers: 3,
      location: "CS Lab Building",
      sessionTime: new Date(now + 26 * 60 * 60 * 1000),
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

  console.log("Seeded sample study groups");
};

/**
 * Seeds demo data only for empty local/in-memory DBs.
 * Never invents demo users when a real Atlas DB already has accounts.
 */
const ensureDevUsers = async () => {
  const refs = await seedUsers();
  if (!refs.student1 || !refs.student2) {
    // Real registered DB without demo student emails — do not invent sample data.
    const userCount = await User.countDocuments();
    console.log(`Connected to existing database with ${userCount} user(s). Skipping demo seed.`);
    return;
  }

  const foodItems = await seedMenu(refs);
  await seedWallets(refs.student1, refs.student2);
  await seedOrders(refs.student1, refs.student2, foodItems);
  await seedFoodSharePosts(refs.student1, refs.student2);
  await seedStudyGroups(refs.student1, refs.student2);
};

module.exports = ensureDevUsers;
