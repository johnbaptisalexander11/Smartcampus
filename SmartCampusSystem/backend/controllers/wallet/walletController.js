const mongoose = require("mongoose");
const crypto = require("crypto");
const Wallet = require("../../models/Wallet");
const WalletTransaction = require("../../models/WalletTransaction");
const WalletTransfer = require("../../models/WalletTransfer");
const UserNotification = require("../../models/UserNotification");
const Order = require("../../models/Order");
const User = require("../../models/User");
const BudgetAlert = require("../../models/BudgetAlert");
const EmergencyWalletRequest = require("../../models/EmergencyWalletRequest");
const RewardPointsTransaction = require("../../models/RewardPointsTransaction");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

const TRANSFER_MIN_AMOUNT = 10;
const TRANSFER_MAX_AMOUNT = 25000;
const TRANSFER_DAILY_LIMIT = 50000;
const OTP_REQUIRED_THRESHOLD = 5000;
const OTP_EXPIRE_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;

const generateTransferReference = () => `TXN-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

const hashOtp = (otp) => crypto.createHash("sha256").update(String(otp)).digest("hex");

const getTodayRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { start, end };
};

const getDailyTransferredAmount = async (userId, session = null) => {
  const { start, end } = getTodayRange();
  const agg = WalletTransfer.aggregate([
    {
      $match: {
        sender: new mongoose.Types.ObjectId(String(userId)),
        status: "success",
        createdAt: { $gte: start, $lt: end },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  if (session) agg.session(session);
  const results = await agg;
  return results?.[0]?.total || 0;
};

const createWalletTransferNotifications = async ({ senderId, receiverId, amount, note, referenceCode }, session) => {
  const payload = [
    {
      user: senderId,
      title: "Transfer Sent",
      message: `Rs. ${amount} sent successfully. Ref: ${referenceCode}${note ? ` · ${note}` : ""}`,
      type: "wallet_transfer",
      meta: { referenceCode, direction: "out" },
    },
    {
      user: receiverId,
      title: "Money Received",
      message: `You received Rs. ${amount}. Ref: ${referenceCode}${note ? ` · ${note}` : ""}`,
      type: "wallet_transfer",
      meta: { referenceCode, direction: "in" },
    },
  ];

  await UserNotification.create(payload, { session, ordered: true });
};

const getOrCreateWallet = async (userId, session = null) => {
  const filter = { user: userId };
  const update = {
    $setOnInsert: {
      user: userId,
      balance: 5000,
      rewardPoints: 0,
    },
  };
  const options = {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  };
  if (session) options.session = session;

  try {
    // Atomic upsert avoids E11000 when the wallet page loads many APIs in parallel
    return await Wallet.findOneAndUpdate(filter, update, options);
  } catch (error) {
    // Rare concurrent upsert race on unique user index — return the existing wallet
    if (error && (error.code === 11000 || error.codeName === "DuplicateKey")) {
      let query = Wallet.findOne(filter);
      if (session) query = query.session(session);
      const existing = await query;
      if (existing) return existing;
    }
    throw error;
  }
};

const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
};

const getFoodSpentThisMonth = async (walletId, session = null) => {
  const { start, end } = getCurrentMonthRange();

  const agg = WalletTransaction.aggregate([
    {
      $match: {
        wallet: walletId,
        referenceType: "order",
        type: { $in: ["order_payment"] },
        createdAt: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: null,
        totalSpent: { $sum: "$amount" },
      },
    },
  ]);

  if (session) {
    agg.session(session);
  }

  const results = await agg;

  return results?.[0]?.totalSpent || 0;
};

const resolveReceiverByIdentifier = async (identifier, session = null) => {
  const value = String(identifier || "").trim().toLowerCase();
  if (!value) return null;

  const query = mongoose.Types.ObjectId.isValid(value)
    ? { $or: [{ _id: value }, { email: value }] }
    : { email: value };

  const q = User.findOne(query).select("name email role isActive");
  if (session) q.session(session);
  return q;
};

const executeTransfer = async ({
  sender,
  receiver,
  senderWallet,
  receiverWallet,
  amount,
  note,
  transferDoc,
  session,
}) => {
  senderWallet.balance -= amount;
  receiverWallet.balance += amount;

  await senderWallet.save({ session });
  await receiverWallet.save({ session });

  await WalletTransaction.create(
    [
      {
        wallet: senderWallet._id,
        user: sender._id,
        type: "transfer_out",
        amount,
        description: `Transfer to ${receiver.email}${note ? ` · ${note}` : ""}`,
        referenceType: "transfer",
        referenceId: transferDoc._id,
      },
      {
        wallet: receiverWallet._id,
        user: receiver._id,
        type: "transfer_in",
        amount,
        description: `Transfer from ${sender.email}${note ? ` · ${note}` : ""}`,
        referenceType: "transfer",
        referenceId: transferDoc._id,
      },
    ],
    { session, ordered: true }
  );

  transferDoc.status = "success";
  transferDoc.failureReason = "";
  transferDoc.completedAt = new Date();
  transferDoc.otpHash = null;
  transferDoc.otpExpiresAt = null;
  transferDoc.otpAttempts = 0;
  await transferDoc.save({ session });

  await createWalletTransferNotifications(
    {
      senderId: sender._id,
      receiverId: receiver._id,
      amount,
      note,
      referenceCode: transferDoc.referenceCode,
    },
    session
  );
};

const isWriteConflictError = (error) => {
  if (!error) return false;
  const code = error.code || error?.cause?.code;
  const name = error.name || error?.cause?.name;
  return (
    code === 112 ||
    code === 16500 ||
    name === "WriteConflict" ||
    name === "MongoServerError" && /Write conflict|yielding is disabled|retry your operation/i.test(error.message || "")
  );
};

const retryTransaction = async (operation, retries = 3) => {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isWriteConflictError(error) || attempt === retries) {
        throw error;
      }
    }
  }

  throw lastError;
};

const getWalletBalance = async (req, res, next) => {
  try {
    const wallet = await getOrCreateWallet(req.user._id);
    return sendSuccess(
      res,
      "Wallet fetched successfully",
      {
        wallet: {
          balance: wallet.balance,
          rewardPoints: wallet.rewardPoints,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

const topUpWallet = async (req, res, next) => {
  try {
    const amount = Number(req.body.amount);
    const wallet = await getOrCreateWallet(req.user._id);
    wallet.balance += amount;
    await wallet.save();

    await WalletTransaction.create({
      wallet: wallet._id,
      user: req.user._id,
      type: "topup",
      amount,
      description: "Wallet top up",
      referenceType: "manual",
    });

    return sendSuccess(
      res,
      "Wallet topped up successfully",
      {
        wallet: {
          balance: wallet.balance,
          rewardPoints: wallet.rewardPoints,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

const lookupTransferRecipient = async (req, res, next) => {
  try {
    const identifier = String(req.query.identifier || "").trim();
    if (!identifier) return sendError(res, "identifier is required", 400);

    const receiver = await resolveReceiverByIdentifier(identifier);
    if (!receiver || receiver.role !== "student" || !receiver.isActive) {
      return sendError(res, "Receiver account not found", 404);
    }

    if (String(receiver._id) === String(req.user._id)) {
      return sendError(res, "You cannot transfer to your own account", 400);
    }

    return sendSuccess(
      res,
      "Receiver found",
      {
        receiver: {
          id: receiver._id,
          name: receiver.name,
          email: receiver.email,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

const initiateWalletTransfer = async (req, res, next) => {
  const runTransfer = async () => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { receiverIdentifier, amount, note = "", password } = req.body;
      const transferAmount = Number(amount);
      const normalizedNote = String(note || "").trim();

      const sender = await User.findById(req.user._id).select("+password email name").session(session);
      if (!sender) {
        await session.abortTransaction();
        return sendError(res, "Sender account not found", 404);
      }

      const passwordMatch = await sender.comparePassword(String(password || ""));
      if (!passwordMatch) {
        await session.abortTransaction();
        return sendError(res, "Password confirmation failed", 401);
      }

      const receiver = await resolveReceiverByIdentifier(receiverIdentifier, session);
      if (!receiver || receiver.role !== "student" || !receiver.isActive) {
        await session.abortTransaction();
        return sendError(res, "Valid receiver account not found", 404);
      }

      if (String(receiver._id) === String(req.user._id)) {
        await session.abortTransaction();
        return sendError(res, "You cannot transfer to your own account", 400);
      }

      if (!Number.isFinite(transferAmount) || transferAmount < TRANSFER_MIN_AMOUNT) {
        await session.abortTransaction();
        return sendError(res, `Minimum transfer amount is Rs. ${TRANSFER_MIN_AMOUNT}`, 400);
      }

      if (transferAmount > TRANSFER_MAX_AMOUNT) {
        await session.abortTransaction();
        return sendError(res, `Maximum transfer amount is Rs. ${TRANSFER_MAX_AMOUNT}`, 400);
      }

      const senderWallet = await getOrCreateWallet(sender._id, session);
      const receiverWallet = await getOrCreateWallet(receiver._id, session);

      if (senderWallet.balance < transferAmount) {
        await session.abortTransaction();
        return sendError(res, "Insufficient wallet balance", 400);
      }

      const todayTransferred = await getDailyTransferredAmount(sender._id, session);
      if (todayTransferred + transferAmount > TRANSFER_DAILY_LIMIT) {
        await session.abortTransaction();
        return sendError(
          res,
          `Daily transfer limit exceeded. Remaining: Rs. ${Math.max(TRANSFER_DAILY_LIMIT - todayTransferred, 0)}`,
          400
        );
      }

      const transfer = await WalletTransfer.create(
        [
          {
            referenceCode: generateTransferReference(),
            sender: sender._id,
            receiver: receiver._id,
            senderWallet: senderWallet._id,
            receiverWallet: receiverWallet._id,
            amount: transferAmount,
            note: normalizedNote,
            status: "success",
          },
        ],
        { session, ordered: true }
      ).then((docs) => docs[0]);

      if (transferAmount >= OTP_REQUIRED_THRESHOLD) {
        const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
        transfer.status = "otp_required";
        transfer.otpHash = hashOtp(generatedOtp);
        transfer.otpExpiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);
        transfer.otpAttempts = 0;
        await transfer.save({ session });

        await session.commitTransaction();

        return sendSuccess(
          res,
          "OTP verification required for this transfer",
          {
            requiresOtp: true,
            transfer: {
              id: transfer._id,
              referenceCode: transfer.referenceCode,
              amount: transfer.amount,
              receiver: { id: receiver._id, name: receiver.name, email: receiver.email },
              expiresAt: transfer.otpExpiresAt,
            },
            devOtp: process.env.NODE_ENV === "production" ? undefined : generatedOtp,
          },
          200
        );
      }

      await executeTransfer({
        sender,
        receiver,
        senderWallet,
        receiverWallet,
        amount: transferAmount,
        note: normalizedNote,
        transferDoc: transfer,
        session,
      });

      await session.commitTransaction();

      return sendSuccess(
        res,
        "Wallet transfer successful",
        {
          transfer: {
            id: transfer._id,
            referenceCode: transfer.referenceCode,
            status: transfer.status,
            amount: transfer.amount,
            note: transfer.note,
            sender: { id: sender._id, name: sender.name, email: sender.email },
            receiver: { id: receiver._id, name: receiver.name, email: receiver.email },
            createdAt: transfer.createdAt,
            completedAt: transfer.completedAt,
          },
          wallet: { balance: senderWallet.balance },
        },
        200
      );
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  };

  try {
    await retryTransaction(runTransfer, 3);
  } catch (error) {
    next(error);
  }
};

const confirmWalletTransferOtp = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { transferId, otp } = req.body;
    const otpInput = String(otp || "").trim();
    if (!transferId || !otpInput) {
      await session.abortTransaction();
      return sendError(res, "transferId and otp are required", 400);
    }

    const transfer = await WalletTransfer.findById(transferId).session(session);
    if (!transfer || String(transfer.sender) !== String(req.user._id)) {
      await session.abortTransaction();
      return sendError(res, "Transfer not found", 404);
    }

    if (transfer.status !== "otp_required") {
      await session.abortTransaction();
      return sendError(res, "This transfer does not require OTP confirmation", 400);
    }

    if (!transfer.otpExpiresAt || transfer.otpExpiresAt.getTime() < Date.now()) {
      transfer.status = "failed";
      transfer.failureReason = "OTP expired";
      await transfer.save({ session });
      await session.commitTransaction();
      return sendError(res, "OTP expired. Please initiate transfer again.", 400);
    }

    transfer.otpAttempts += 1;
    if (transfer.otpAttempts > OTP_MAX_ATTEMPTS) {
      transfer.status = "failed";
      transfer.failureReason = "OTP attempts exceeded";
      await transfer.save({ session });
      await session.commitTransaction();
      return sendError(res, "OTP attempts exceeded. Please initiate transfer again.", 400);
    }

    if (hashOtp(otpInput) !== transfer.otpHash) {
      await transfer.save({ session });
      await session.commitTransaction();
      return sendError(res, "Invalid OTP", 400);
    }

    const sender = await User.findById(transfer.sender).select("name email").session(session);
    const receiver = await User.findById(transfer.receiver).select("name email").session(session);
    const senderWallet = await Wallet.findById(transfer.senderWallet).session(session);
    const receiverWallet = await Wallet.findById(transfer.receiverWallet).session(session);

    if (!sender || !receiver || !senderWallet || !receiverWallet) {
      transfer.status = "failed";
      transfer.failureReason = "Transfer accounts not available";
      await transfer.save({ session });
      await session.commitTransaction();
      return sendError(res, "Transfer cannot be completed", 400);
    }

    if (senderWallet.balance < transfer.amount) {
      transfer.status = "failed";
      transfer.failureReason = "Insufficient balance at OTP confirmation";
      await transfer.save({ session });
      await session.commitTransaction();
      return sendError(res, "Insufficient wallet balance", 400);
    }

    const todayTransferred = await getDailyTransferredAmount(sender._id, session);
    if (todayTransferred + transfer.amount > TRANSFER_DAILY_LIMIT) {
      transfer.status = "failed";
      transfer.failureReason = "Daily transfer limit exceeded";
      await transfer.save({ session });
      await session.commitTransaction();
      return sendError(res, "Daily transfer limit exceeded", 400);
    }

    await executeTransfer({
      sender,
      receiver,
      senderWallet,
      receiverWallet,
      amount: transfer.amount,
      note: transfer.note,
      transferDoc: transfer,
      session,
    });

    await session.commitTransaction();

    return sendSuccess(
      res,
      "Wallet transfer completed successfully",
      {
        transfer: {
          id: transfer._id,
          referenceCode: transfer.referenceCode,
          status: transfer.status,
          amount: transfer.amount,
          note: transfer.note,
          sender: { id: sender._id, name: sender.name, email: sender.email },
          receiver: { id: receiver._id, name: receiver.name, email: receiver.email },
          createdAt: transfer.createdAt,
          completedAt: transfer.completedAt,
        },
        wallet: { balance: senderWallet.balance },
      },
      200
    );
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

const getTransferHistory = async (req, res, next) => {
  try {
    const { status, q = "" } = req.query;
    const match = {
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    };

    if (status) match.status = String(status);

    const transfers = await WalletTransfer.find(match)
      .populate("sender", "name email")
      .populate("receiver", "name email")
      .sort({ createdAt: -1 })
      .limit(200);

    const query = String(q || "").trim().toLowerCase();
    const filtered = !query
      ? transfers
      : transfers.filter((t) => {
          return (
            String(t.referenceCode || "").toLowerCase().includes(query) ||
            String(t.note || "").toLowerCase().includes(query) ||
            String(t.sender?.email || "").toLowerCase().includes(query) ||
            String(t.receiver?.email || "").toLowerCase().includes(query)
          );
        });

    return sendSuccess(res, "Transfer history fetched", { transfers: filtered }, 200);
  } catch (error) {
    next(error);
  }
};

const getWalletNotifications = async (req, res, next) => {
  try {
    const notifications = await UserNotification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);

    return sendSuccess(res, "Wallet notifications fetched", { notifications }, 200);
  } catch (error) {
    next(error);
  }
};

const markWalletNotificationRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const notification = await UserNotification.findOne({ _id: notificationId, user: req.user._id });
    if (!notification) return sendError(res, "Notification not found", 404);

    notification.read = true;
    await notification.save();
    return sendSuccess(res, "Notification marked as read", { notification }, 200);
  } catch (error) {
    next(error);
  }
};

const payForOrder = async (req, res, next) => {
  const runPayForOrder = async () => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { orderId, useRewardPoints = 0 } = req.body;
      const order = await Order.findById(orderId).session(session);

      if (!order) {
        await session.abortTransaction();
        return sendError(res, "Order not found", 404);
      }

      if (String(order.user) !== String(req.user._id)) {
        await session.abortTransaction();
        return sendError(res, "You cannot pay for this order", 403);
      }

      if (order.paymentMethod !== "wallet") {
        await session.abortTransaction();
        return sendError(res, "This order was not created with wallet payment", 400);
      }

      if (order.paymentStatus === "paid") {
        await session.abortTransaction();
        return sendError(res, "This order has already been paid", 400);
      }

      if (order.status === "cancelled") {
        await session.abortTransaction();
        return sendError(res, "Cancelled order cannot be paid", 400);
      }

      const wallet = await getOrCreateWallet(req.user._id, session);

      const existingPayment = await WalletTransaction.findOne({
        wallet: wallet._id,
        user: req.user._id,
        type: "order_payment",
        referenceType: "order",
        referenceId: order._id,
      }).session(session);

      if (existingPayment) {
        await session.abortTransaction();
        return sendError(res, "This order has already been paid using wallet", 400);
      }

      const pointsToUse = Math.floor(Number(useRewardPoints) || 0);
      if (pointsToUse < 0) {
        await session.abortTransaction();
        return sendError(res, "useRewardPoints must be >= 0", 400);
      }
      if (pointsToUse > wallet.rewardPoints) {
        await session.abortTransaction();
        return sendError(res, `You can redeem up to ${wallet.rewardPoints} reward points for this order`, 400);
      }

      // Simple conversion for the university project: 1 reward point = Re. 1 (Rs. 1)
      const redemptionAmount = pointsToUse;
      const moneyToPay = Math.max(order.totalAmount - redemptionAmount, 0);

      if (wallet.balance < moneyToPay) {
        await session.abortTransaction();
        return sendError(res, "Insufficient wallet balance", 400);
      }

      // Budget enforcement is based on the actual wallet money part paid for the order.
      const user = await User.findById(req.user._id).select("monthlyFoodBudget").session(session);
      if (user?.monthlyFoodBudget !== null && user?.monthlyFoodBudget !== undefined) {
        if (user.monthlyFoodBudget > 0) {
          const spentThisMonth = await getFoodSpentThisMonth(wallet._id, session);
          const projectedSpent = spentThisMonth + moneyToPay;
          if (projectedSpent > user.monthlyFoodBudget) {
            await session.abortTransaction();
            return sendError(
              res,
              `Monthly food budget exceeded. Remaining: Rs. ${Math.max(user.monthlyFoodBudget - spentThisMonth, 0)}`,
              400
            );
          }
        }
      }

      if (pointsToUse > 0) {
        wallet.rewardPoints -= pointsToUse;
        await RewardPointsTransaction.create(
          [
            {
              user: req.user._id,
              wallet: wallet._id,
              pointsDelta: -pointsToUse,
              kind: "redeemed",
              referenceType: "order",
              referenceId: order._id,
              note: "Redeemed reward points during wallet payment",
            },
          ],
          { session, ordered: true }
        );
      }

      if (moneyToPay > 0) {
        wallet.balance -= moneyToPay;
      }

      const earnedPoints = moneyToPay > 0 ? Math.floor(moneyToPay / 100) : 0;
      wallet.rewardPoints += earnedPoints;

      if (earnedPoints > 0) {
        await RewardPointsTransaction.create(
          [
            {
              user: req.user._id,
              wallet: wallet._id,
              pointsDelta: earnedPoints,
              kind: "earned",
              referenceType: "order",
              referenceId: order._id,
              note: "Reward points earned from wallet payment",
            },
          ],
          { session, ordered: true }
        );
      }

      // Persist budget alerts at 80% and 100% (best-effort; errors won't fail payment).
      // This is evaluated after the projected spend is known and within the same transaction.
      if (user?.monthlyFoodBudget !== null && user?.monthlyFoodBudget !== undefined && user.monthlyFoodBudget > 0) {
        const { year, month } = {
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
        };
        const spentThisMonth = await getFoodSpentThisMonth(wallet._id, session);
        const projectedSpent = spentThisMonth + moneyToPay;
        const thresholds = [
          { threshold: 0.8, reached: projectedSpent >= user.monthlyFoodBudget * 0.8 },
          { threshold: 1, reached: projectedSpent >= user.monthlyFoodBudget },
        ];

        for (const t of thresholds) {
          if (!t.reached) continue;
          // Ignore duplicate key errors (already triggered)
          try {
            await BudgetAlert.create(
              [{ user: req.user._id, year, month, threshold: t.threshold }],
              { session, ordered: true }
            );
          } catch (e) {
            // no-op
          }
        }
      }

      await wallet.save({ session });

      await WalletTransaction.create(
        [
          {
            wallet: wallet._id,
            user: req.user._id,
            type: "order_payment",
            amount: moneyToPay,
            description: `Payment for order ${order._id}`,
            referenceType: "order",
            referenceId: order._id,
          },
        ],
        { session, ordered: true }
      );

      order.paymentStatus = "paid";
      await order.save({ session });

      await session.commitTransaction();

      return sendSuccess(
        res,
        "Order paid successfully using wallet",
        {
          wallet: {
            balance: wallet.balance,
            rewardPoints: wallet.rewardPoints,
          },
          orderId: order._id,
          paidAmount: moneyToPay,
          usedRewardPoints: pointsToUse,
          earnedRewardPoints: earnedPoints,
        },
        200
      );
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  };

  try {
    await retryTransaction(runPayForOrder, 3);
  } catch (error) {
    next(error);
  }
};

const getTransactionHistory = async (req, res, next) => {
  try {
    const wallet = await getOrCreateWallet(req.user._id);

    const {
      type,
      referenceType,
      from,
      to,
      minAmount,
      maxAmount,
      q,
    } = req.query;

    const match = { wallet: wallet._id };
    if (type) match.type = String(type);
    if (referenceType) match.referenceType = String(referenceType);

    if (from) {
      const fromDate = new Date(from);
      if (!Number.isNaN(fromDate.getTime())) {
        match.createdAt = { ...(match.createdAt || {}), $gte: fromDate };
      }
    }
    if (to) {
      const toDate = new Date(to);
      if (!Number.isNaN(toDate.getTime())) {
        match.createdAt = { ...(match.createdAt || {}), $lte: toDate };
      }
    }

    if (minAmount !== undefined) {
      const n = Number(minAmount);
      if (Number.isFinite(n)) {
        match.amount = { ...(match.amount || {}), $gte: n };
      }
    }
    if (maxAmount !== undefined) {
      const n = Number(maxAmount);
      if (Number.isFinite(n)) {
        match.amount = { ...(match.amount || {}), $lte: n };
      }
    }

    if (q) {
      match.description = { $regex: String(q), $options: "i" };
    }

    const transactions = await WalletTransaction.find(match).sort({ createdAt: -1 });
    return sendSuccess(res, "Wallet transactions fetched", { transactions }, 200);
  } catch (error) {
    next(error);
  }
};

const getMonthlySpendingSummary = async (req, res, next) => {
  try {
    const wallet = await getOrCreateWallet(req.user._id);

    const monthly = await WalletTransaction.aggregate([
      {
        $match: {
          wallet: wallet._id,
          referenceType: "order",
          type: { $in: ["order_payment"] },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalSpent: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": -1,
          "_id.month": -1,
        },
      },
    ]);

    return sendSuccess(res, "Monthly spending summary fetched", { monthly }, 200);
  } catch (error) {
    next(error);
  }
};

const getMonthlyFoodBudget = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("monthlyFoodBudget");
    const wallet = await getOrCreateWallet(req.user._id);

    const spentThisMonth = await getFoodSpentThisMonth(wallet._id, null);
    const budget = user?.monthlyFoodBudget ?? null;

    const percentUsed = budget !== null && budget !== undefined && budget > 0 ? (spentThisMonth / budget) * 100 : null;
    const eightyReached = budget !== null && budget !== undefined && budget > 0 ? spentThisMonth >= budget * 0.8 : false;
    const hundredReached = budget !== null && budget !== undefined && budget > 0 ? spentThisMonth >= budget : false;

    return sendSuccess(res, "Monthly food budget fetched", {
      monthlyFoodBudget: budget,
      spentThisMonth,
      remainingThisMonth: budget !== null && budget !== undefined ? Math.max(budget - spentThisMonth, 0) : null,
      percentUsed,
      alerts: {
        eightyPercentReached: eightyReached,
        hundredPercentReached: hundredReached,
      },
    });
  } catch (error) {
    next(error);
  }
};

const setMonthlyFoodBudget = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const parsedAmount = Number(amount);

    const budgetValue = parsedAmount === 0 ? null : parsedAmount; // 0 means "clear budget"

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { monthlyFoodBudget: budgetValue },
      { new: true }
    ).select("monthlyFoodBudget");

    return sendSuccess(res, "Monthly food budget updated", { monthlyFoodBudget: updatedUser.monthlyFoodBudget }, 200);
  } catch (error) {
    next(error);
  }
};

const getDailySpendingSummary = async (req, res, next) => {
  try {
    const wallet = await getOrCreateWallet(req.user._id);
    const { start, end } = getCurrentMonthRange();

    const daily = await WalletTransaction.aggregate([
      {
        $match: {
          wallet: wallet._id,
          referenceType: "order",
          type: "order_payment",
          createdAt: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          },
          totalSpent: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.date": 1 },
      },
    ]);

    return sendSuccess(res, "Daily spending summary fetched", { daily }, 200);
  } catch (error) {
    next(error);
  }
};

const getRewardPointsTransactions = async (req, res, next) => {
  try {
    const wallet = await getOrCreateWallet(req.user._id);
    const transactions = await RewardPointsTransaction.find({ wallet: wallet._id })
      .sort({ createdAt: -1 })
      .limit(200);
    return sendSuccess(res, "Reward points transactions fetched", { transactions }, 200);
  } catch (error) {
    next(error);
  }
};

const createEmergencyWalletRequest = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, note = "" } = req.body;
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 1) {
      await session.abortTransaction();
      return sendError(res, "Invalid emergency request amount", 400);
    }

    // Simple limit to keep it safe for a university demo.
    const EMERGENCY_MAX = 5000;
    if (parsedAmount > EMERGENCY_MAX) {
      await session.abortTransaction();
      return sendError(res, `Emergency request limit is Rs. ${EMERGENCY_MAX}`, 400);
    }

    const wallet = await getOrCreateWallet(req.user._id);

    const [request] = await EmergencyWalletRequest.create(
      [
        {
          user: req.user._id,
          amount: parsedAmount,
          status: "fulfilled",
          fulfilledAmount: parsedAmount,
          note,
        },
      ],
      { session, ordered: true }
    );

    wallet.balance += parsedAmount;
    await wallet.save({ session });

    await WalletTransaction.create(
      [
        {
          wallet: wallet._id,
          user: req.user._id,
          type: "topup",
          amount: parsedAmount,
          description: `Emergency wallet request (${request._id})`,
          referenceType: "system",
          referenceId: null,
        },
      ],
      { session, ordered: true }
    );

    await session.commitTransaction();

    return sendSuccess(res, "Emergency wallet request fulfilled", { request, wallet }, 200);
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

const getMyEmergencyWalletRequests = async (req, res, next) => {
  try {
    const requests = await EmergencyWalletRequest.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    return sendSuccess(res, "Emergency wallet requests fetched", { requests }, 200);
  } catch (error) {
    next(error);
  }
};

const refundCancelledOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      return sendError(res, "Order not found", 404);
    }

    if (String(order.user) !== String(req.user._id)) {
      await session.abortTransaction();
      return sendError(res, "You cannot refund this order", 403);
    }

    if (order.status !== "cancelled") {
      await session.abortTransaction();
      return sendError(res, "Only cancelled orders can be refunded", 400);
    }

    const wallet = await getOrCreateWallet(req.user._id);

    const paymentTx = await WalletTransaction.findOne({
      wallet: wallet._id,
      referenceType: "order",
      referenceId: order._id,
      type: "order_payment",
    }).session(session);

    if (!paymentTx) {
      await session.abortTransaction();
      return sendError(res, "No wallet payment found for this cancelled order", 400);
    }

    const existingRefund = await WalletTransaction.findOne({
      wallet: wallet._id,
      referenceType: "order",
      referenceId: order._id,
      type: "refund",
    }).session(session);

    if (existingRefund) {
      await session.abortTransaction();
      return sendError(res, "Refund already processed for this order", 400);
    }

    const refundAmount = paymentTx.amount || 0;
    wallet.balance += refundAmount;

    await WalletTransaction.create(
      [
        {
          wallet: wallet._id,
          user: req.user._id,
          type: "refund",
          amount: refundAmount,
          description: `Refund for cancelled order ${order._id}`,
          referenceType: "order",
          referenceId: order._id,
        },
      ],
      { session, ordered: true }
    );

    // Reverse reward points earned/redeemed for this order.
    const rewardTxs = await RewardPointsTransaction.find({
      wallet: wallet._id,
      referenceType: "order",
      referenceId: order._id,
    }).session(session);

    const earnedPointsSum = rewardTxs.reduce((sum, tx) => (tx.pointsDelta > 0 ? sum + tx.pointsDelta : sum), 0);
    const redeemedPointsSum = rewardTxs.reduce((sum, tx) => (tx.pointsDelta < 0 ? sum + Math.abs(tx.pointsDelta) : sum), 0);

    if (earnedPointsSum > 0) {
      wallet.rewardPoints = Math.max(0, wallet.rewardPoints - earnedPointsSum);
      await RewardPointsTransaction.create(
        [
          {
            user: req.user._id,
            wallet: wallet._id,
            pointsDelta: -earnedPointsSum,
            kind: "reversal",
            referenceType: "order",
            referenceId: order._id,
            note: "Reversed reward points earned due to order refund",
          },
        ],
        { session, ordered: true }
      );
    }

    if (redeemedPointsSum > 0) {
      wallet.rewardPoints += redeemedPointsSum;
      await RewardPointsTransaction.create(
        [
          {
            user: req.user._id,
            wallet: wallet._id,
            pointsDelta: redeemedPointsSum,
            kind: "reversal",
            referenceType: "order",
            referenceId: order._id,
            note: "Restored reward points redeemed due to order refund",
          },
        ],
        { session, ordered: true }
      );
    }

    await wallet.save({ session });
    await session.commitTransaction();

    return sendSuccess(res, "Refund processed successfully", { wallet, refundedAmount: refundAmount }, 200);
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

module.exports = {
  getWalletBalance,
  topUpWallet,
  lookupTransferRecipient,
  initiateWalletTransfer,
  confirmWalletTransferOtp,
  getTransferHistory,
  getWalletNotifications,
  markWalletNotificationRead,
  payForOrder,
  getTransactionHistory,
  getMonthlySpendingSummary,
  getMonthlyFoodBudget,
  setMonthlyFoodBudget,
  getDailySpendingSummary,
  getRewardPointsTransactions,
  createEmergencyWalletRequest,
  getMyEmergencyWalletRequests,
  refundCancelledOrder,
};
