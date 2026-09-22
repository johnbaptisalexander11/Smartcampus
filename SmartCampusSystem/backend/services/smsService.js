const axios = require("axios");
const qs = require("querystring");

const SMS_API_BASE_URL = process.env.SMSLENZ_API_BASE_URL || process.env.SMS_API_BASE_URL || "https://smslenz.lk/api";
const SMS_API_URL = `${SMS_API_BASE_URL.replace(/\/+$/, "")}/send-sms`;
const SMS_API_KEY = process.env.SMSLENZ_API_KEY || process.env.SMS_API_KEY || "";
const SMS_USER_ID = process.env.SMSLENZ_USER_ID || process.env.SMS_USER_ID || "";
const SMS_SENDER_ID = process.env.SMSLENZ_SENDER_ID || process.env.SMS_SENDER_ID || "SMSlenzDEMO";
const MAX_RETRIES = 3;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const formatPhone = (phone) => {
  const raw = String(phone || "").trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  let local = digits;
  if (local.startsWith("94")) local = local.slice(2);
  if (local.startsWith("0")) local = local.slice(1);

  return `+94${local}`;
};

const hasConfiguredCredentials = () => {
  const badUser =
    !SMS_USER_ID ||
    SMS_USER_ID === "YOUR_USER_ID_HERE" ||
    SMS_USER_ID.toLowerCase().includes("your_user_id");

  const badKey =
    !SMS_API_KEY ||
    SMS_API_KEY === "YOUR_API_KEY_HERE" ||
    SMS_API_KEY.toLowerCase().includes("your_api_key");

  return !badUser && !badKey;
};

const getCanteenCode = (canteen) => {
  const raw = String(canteen || "").trim();
  const match = raw.match(/^(\d+)(st|nd|rd|th)\s+canteen$/i);
  if (match) {
    return `C${match[1]}`;
  }

  const digits = raw.match(/\d+/);
  return digits ? `C${digits[0]}` : raw || "Canteen";
};

const sendSMS = async (phone, message) => {
  if (!hasConfiguredCredentials()) {
    return {
      success: false,
      error: "SMS credentials are not configured. Set SMSLENZ_USER_ID and SMSLENZ_API_KEY in backend/.env",
    };
  }

  const recipient = formatPhone(phone);
  if (!/^\+94\d{9}$/.test(recipient)) {
    return {
      success: false,
      error: "Invalid phone number format. Use a valid Sri Lankan mobile number (e.g., 0771234567).",
    };
  }

  console.log(`[SMS] Sending to ${recipient} | user_id=${SMS_USER_ID.slice(0, 8)}...`);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const payload = {
        user_id: SMS_USER_ID,
        api_key: SMS_API_KEY,
        sender_id: SMS_SENDER_ID,
        contact: recipient,
        message,
      };

      const response = await axios.post(SMS_API_URL, qs.stringify(payload), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 20000,
      });

      console.log(`[SMS] Attempt ${attempt} status: ${response.status}`);
      console.log(`[SMS] Attempt ${attempt} response:`, JSON.stringify(response.data));

      if (response.data?.success || response.status === 200) {
        console.log(`[SMS] Successfully sent to ${recipient}`);
        return { success: true, data: response.data };
      }

      console.warn(`[SMS] Attempt ${attempt} non-success body:`, response.data);
    } catch (error) {
      const errData = error.response?.data;
      const errStatus = error.response?.status;
      const errMsg = error.message;

      console.error(
        `[SMS] Attempt ${attempt}/${MAX_RETRIES} failed:`,
        `Status=${errStatus || "N/A"}`,
        `Body=${JSON.stringify(errData || errMsg)}`
      );

      if (errStatus === 401 || errStatus === 403) {
        console.error("[SMS] Auth failed — verify user_id and api_key from https://smslenz.lk/account/api-key");
        return { success: false, error: `Auth failed (${errStatus}). Check SMSLENZ_USER_ID and SMSLENZ_API_KEY.` };
      }

      if (errStatus === 400) {
        return { success: false, error: `Bad request (400): ${JSON.stringify(errData)}` };
      }
    }

    if (attempt < MAX_RETRIES) {
      const waitMs = 1500 * attempt;
      console.log(`[SMS] Retrying in ${waitMs}ms...`);
      await delay(waitMs);
    }
  }

  console.error(`[SMS] Failed after ${MAX_RETRIES} attempts for ${recipient}`);
  return { success: false, error: "SMS delivery failed after all retry attempts" };
};

const buildOrderSMS = (order) => {
  const itemSummary = order.items
    .map((item) => `${item.name} x${item.quantity}`)
    .join(", ");
  const canteenCode = getCanteenCode(order.canteen);

  const message = `${canteenCode} Order ${order.orderCode}: ${itemSummary}. Total Rs.${order.totalAmount}.`;
  return message.length <= 160
    ? message
    : `${canteenCode} Order ${order.orderCode} placed. Total Rs.${order.totalAmount}.`;
};

const buildOrderStatusSMS = (order, status) => {
  const canteenCode = getCanteenCode(order.canteen);
  const statusMap = {
    placed: "confirmed",
    accepted: "confirmed",
    preparing: "is preparing",
    ready: "is ready",
    completed: "is completed",
    cancelled: "is cancelled",
  };

  const statusText = statusMap[status] || `status is ${status}`;
  return `${canteenCode} Order ${order.orderCode} ${statusText}.`;
};

const buildOtpSMS = (otp) =>
  `Smart Campus: Your verification OTP is ${otp}. Valid for 10 minutes. Do not share this code.`;

module.exports = { sendSMS, formatPhone, buildOrderSMS, buildOrderStatusSMS, buildOtpSMS };
