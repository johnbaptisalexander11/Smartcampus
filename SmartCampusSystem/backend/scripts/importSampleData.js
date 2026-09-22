const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const FoodCategory = require('../models/FoodCategory');
const FoodItem = require('../models/FoodItem');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const Complaint = require('../models/Complaint');
const FoodSharePost = require('../models/FoodSharePost');
const StudyGroup = require('../models/StudyGroup');

const uri = 'mongodb://admin:admin123@ac-mdpk48m-shard-00-00.otyrlxg.mongodb.net:27017,ac-mdpk48m-shard-00-01.otyrlxg.mongodb.net:27017,ac-mdpk48m-shard-00-02.otyrlxg.mongodb.net:27017/canteen_management?ssl=true&authSource=admin&retryWrites=true&w=majority';
const dataPath = path.join(__dirname, '..', 'data', 'sample-dataset.json');

const loadData = async () => {
  const raw = fs.readFileSync(dataPath, 'utf8');
  const data = JSON.parse(raw);

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  await Promise.all([
    User.deleteMany({}),
    FoodCategory.deleteMany({}),
    FoodItem.deleteMany({}),
    Wallet.deleteMany({}),
    WalletTransaction.deleteMany({}),
    Complaint.deleteMany({}),
    FoodSharePost.deleteMany({}),
    StudyGroup.deleteMany({}),
  ]);

  const createdUsers = await User.create(data.users);

  const createdCategories = await FoodCategory.create(data.foodCategories);
  const categoryMap = Object.fromEntries(createdCategories.map((c, index) => [data.foodCategories[index].name, c._id]));

  const foodItems = data.foodItems.map((item) => ({
    ...item,
    category: categoryMap[item.name === 'Veg Sandwich' ? 'Snacks' : item.name === 'Idli Sambar' ? 'Breakfast' : item.name === 'Thali Meal' ? 'Lunch' : 'Beverages'],
    createdBy: createdUsers.find((u) => u.role === 'admin' && u.canteenKey === 'canteen1')?._id,
  }));

  const createdItems = await FoodItem.create(foodItems);

  const studentUsers = createdUsers.filter((u) => u.role === 'student');
  const wallets = await Wallet.create(
    data.wallets.map((wallet, index) => ({
      ...wallet,
      user: studentUsers[index]._id,
    }))
  );

  await WalletTransaction.create(
    data.walletTransactions.map((tx, index) => ({
      ...tx,
      wallet: wallets[index]._id,
      user: studentUsers[index]._id,
    }))
  );

  const complaints = await Complaint.create(
    data.complaints.map((complaint, index) => ({
      ...complaint,
      user: studentUsers[index]._id,
    }))
  );

  await FoodSharePost.create(
    data.foodSharePosts.map((post, index) => ({
      ...post,
      user: studentUsers[index]._id,
      joins: index === 1 ? [{ user: studentUsers[0]._id, joinedAt: new Date() }] : [],
      resolvedAt: index === 1 ? new Date() : null,
    }))
  );

  console.log('Sample data imported successfully');
  await mongoose.disconnect();
};

loadData().catch((err) => {
  console.error(err);
  process.exit(1);
});
