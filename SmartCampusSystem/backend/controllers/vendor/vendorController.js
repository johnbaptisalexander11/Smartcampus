const FoodItem = require("../../models/FoodItem");
const Order = require("../../models/Order");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

const getVendorDashboardStats = async (req, res, next) => {
  try {
    const createdBy = req.user._id;
    const menuItems = await FoodItem.find({ createdBy }, "canteen");
    const canteens = [...new Set(menuItems.map((item) => item.canteen))];

    const [totalMenuItems, incomingOrders, revenueAgg] = await Promise.all([
      FoodItem.countDocuments({ createdBy }),
      Order.countDocuments({ canteen: { $in: canteens }, status: { $in: ["placed", "accepted", "preparing", "ready"] } }),
      Order.aggregate([
        { $match: { canteen: { $in: canteens }, status: { $in: ["completed", "ready", "preparing", "accepted", "placed"] } } },
        { $group: { _id: null, revenue: { $sum: "$totalAmount" } } },
      ]),
    ]);

    return sendSuccess(
      res,
      "Vendor dashboard stats fetched",
      {
        stats: {
          totalMenuItems,
          incomingOrders,
          totalRevenue: revenueAgg[0]?.revenue || 0,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

const getMenuItems = async (req, res, next) => {
  try {
    const items = await FoodItem.find({ createdBy: req.user._id })
      .populate("category", "name")
      .sort({ createdAt: -1 });
    return sendSuccess(res, "Vendor menu fetched", { items }, 200);
  } catch (error) {
    next(error);
  }
};

const createMenuItem = async (req, res, next) => {
  try {
    const { name, description = "", price, imageUrl = "", canteen, category } = req.body;
    if (!name || !price || !canteen || !category) {
      return sendError(res, "name, price, canteen and category are required", 400);
    }

    const item = await FoodItem.create({
      name,
      description,
      price: Number(price),
      imageUrl,
      canteen,
      category,
      createdBy: req.user._id,
      isAvailable: true,
    });

    return sendSuccess(res, "Menu item created", { item }, 201);
  } catch (error) {
    next(error);
  }
};

const updateMenuItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const item = await FoodItem.findById(itemId);
    if (!item) return sendError(res, "Menu item not found", 404);
    if (String(item.createdBy) !== String(req.user._id)) return sendError(res, "Not allowed", 403);

    const { name, description, price, imageUrl, canteen, category, isAvailable } = req.body;
    if (name !== undefined) item.name = name;
    if (description !== undefined) item.description = description;
    if (price !== undefined) item.price = Number(price);
    if (imageUrl !== undefined) item.imageUrl = imageUrl;
    if (canteen !== undefined) item.canteen = canteen;
    if (category !== undefined) item.category = category;
    if (isAvailable !== undefined) item.isAvailable = Boolean(isAvailable);
    await item.save();

    return sendSuccess(res, "Menu item updated", { item }, 200);
  } catch (error) {
    next(error);
  }
};

const deleteMenuItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const item = await FoodItem.findById(itemId);
    if (!item) return sendError(res, "Menu item not found", 404);
    if (String(item.createdBy) !== String(req.user._id)) return sendError(res, "Not allowed", 403);

    await FoodItem.findByIdAndDelete(itemId);
    return sendSuccess(res, "Menu item deleted", null, 200);
  } catch (error) {
    next(error);
  }
};

const getIncomingOrders = async (req, res, next) => {
  try {
    const menuItems = await FoodItem.find({ createdBy: req.user._id }, "canteen");
    const canteens = [...new Set(menuItems.map((item) => item.canteen))];
    const orders = await Order.find({ canteen: { $in: canteens } })
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    return sendSuccess(res, "Incoming orders fetched", { orders }, 200);
  } catch (error) {
    next(error);
  }
};

const updateIncomingOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status, note = "" } = req.body;
    const allowed = ["accepted", "preparing", "ready", "completed", "cancelled"];
    if (!allowed.includes(status)) return sendError(res, "Invalid status", 400);

    const order = await Order.findById(orderId);
    if (!order) return sendError(res, "Order not found", 404);

    const menuItems = await FoodItem.find({ createdBy: req.user._id }, "canteen");
    const canteens = new Set(menuItems.map((item) => item.canteen));
    if (!canteens.has(order.canteen)) return sendError(res, "You cannot manage this order", 403);

    order.status = status;
    order.statusHistory.push({ status, note });
    await order.save();

    return sendSuccess(res, "Order status updated", { order }, 200);
  } catch (error) {
    next(error);
  }
};

const getRevenueSummary = async (req, res, next) => {
  try {
    const menuItems = await FoodItem.find({ createdBy: req.user._id }, "canteen");
    const canteens = [...new Set(menuItems.map((item) => item.canteen))];

    const monthly = await Order.aggregate([
      { $match: { canteen: { $in: canteens }, status: { $in: ["completed", "ready"] } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
    ]);

    return sendSuccess(res, "Revenue summary fetched", { monthly }, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVendorDashboardStats,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getIncomingOrders,
  updateIncomingOrderStatus,
  getRevenueSummary,
};
