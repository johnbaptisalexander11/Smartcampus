const crypto = require("crypto");
const mongoose = require("mongoose");
const generateToken = require("../utils/generateToken");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const User = require("../models/User");
const { getCanteenLabelByKey } = require("../constants/canteens");
const { sendSMS, formatPhone, buildOtpSMS } = require("../services/smsService");

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const STRONG_PASSWORD_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character";

const isStrongPassword = (password = "") => STRONG_PASSWORD_REGEX.test(String(password));

const ensureDatabaseConnected = (res) => {
  if (mongoose.connection.readyState !== 1) {
    sendError(res, "Database is not connected. User data cannot be saved.", 503);
    return false;
  }
  return true;
};

const toUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  phoneVerified: Boolean(user.phoneVerified),
  profileImage: user.profileImage || "",
  department: user.department,
  studyYear: user.studyYear,
  semester: user.semester,
  canteenKey: user.canteenKey || null,
  canteenLabel: user.canteenKey ? getCanteenLabelByKey(user.canteenKey) : null,
  accountStatus: user.accountStatus || "active",
  suspendedUntil: user.suspendedUntil || null,
});

const hashOtp = (otp) => crypto.createHash("sha256").update(String(otp)).digest("hex");

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const maskPhone = (phone) => {
  const formatted = formatPhone(phone);
  if (!formatted || formatted.length < 6) return "****";
  return `${formatted.slice(0, 4)}****${formatted.slice(-3)}`;
};

const isValidSriLankanPhone = (phone) => /^\+94\d{9}$/.test(formatPhone(phone));

const issuePhoneOtp = async (user) => {
  const otp = generateOtp();
  user.phoneOtpHash = hashOtp(otp);
  user.phoneOtpExpires = new Date(Date.now() + OTP_EXPIRY_MS);
  user.phoneOtpAttempts = 0;
  await user.save();

  const smsResult = await sendSMS(user.phone, buildOtpSMS(otp));
  if (!smsResult.success) {
    console.warn(`[OTP] SMS failed for ${user.email}: ${smsResult.error}`);
    if (process.env.NODE_ENV !== "production") {
      console.log(`[OTP] Dev fallback code for ${user.email}: ${otp}`);
    }
  } else if (process.env.NODE_ENV !== "production") {
    console.log(`[OTP] Sent to ${maskPhone(user.phone)} for ${user.email}`);
  }

  return {
    smsSent: Boolean(smsResult.success),
    smsError: smsResult.success ? null : smsResult.error,
    // Only expose OTP in non-production when SMS delivery failed (local testing).
    devOtp: !smsResult.success && process.env.NODE_ENV !== "production" ? otp : undefined,
  };
};

const validateUserAccessStatus = async (user) => {
  if (!user) {
    return { allowed: false, message: "User not found" };
  }

  if (user.accountStatus === "blocked" || user.isActive === false) {
    return { allowed: false, message: "Your account is blocked. Please contact admin support." };
  }

  if (user.accountStatus === "suspended") {
    const now = new Date();
    if (user.suspendedUntil && user.suspendedUntil <= now) {
      user.accountStatus = "active";
      user.isActive = true;
      user.statusReason = "";
      user.suspendedUntil = null;
      await user.save();
      return { allowed: true };
    }
    return {
      allowed: false,
      message: user.suspendedUntil
        ? `Your account is suspended until ${user.suspendedUntil.toLocaleString()}`
        : "Your account is suspended. Please contact admin support.",
    };
  }

  return { allowed: true };
};

const register = async (req, res, next) => {
  try {
    if (!ensureDatabaseConnected(res)) return;

    const { name, email, password, role, phone, department, studyYear, semester, canteenKey } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPhone = String(phone || "").trim();

    if (!name || !email || !password) {
      return sendError(res, "Name, email, and password are required", 400);
    }

    if (!normalizedPhone) {
      return sendError(res, "Phone number is required for OTP verification", 400);
    }

    if (!isValidSriLankanPhone(normalizedPhone)) {
      return sendError(
        res,
        "Enter a valid Sri Lankan mobile number (e.g. 0771234567 or +94771234567)",
        400
      );
    }

    if (!isStrongPassword(password)) {
      return sendError(res, STRONG_PASSWORD_MESSAGE, 400);
    }

    const selectedRole = role || "student";
    if (!["student", "vendor"].includes(selectedRole)) {
      return sendError(
        res,
        "Choose either Student or Vendor to create a public account.",
        403
      );
    }

    if (selectedRole === "vendor" && !["canteen1", "canteen2", "canteen3", "canteen4"].includes(canteenKey)) {
      return sendError(res, "Vendors must select a canteen", 400);
    }

    if (studyYear && (Number(studyYear) < 1 || Number(studyYear) > 4)) {
      return sendError(res, "Study year must be between 1 and 4", 400);
    }

    if (semester && (Number(semester) < 1 || Number(semester) > 2)) {
      return sendError(res, "Semester must be 1 or 2", 400);
    }

    const existingUser = await User.findOne({ email: normalizedEmail }).select(
      "+phoneOtpHash +phoneOtpExpires +phoneOtpAttempts"
    );

    if (existingUser && existingUser.phoneVerified) {
      return sendError(res, "User already exists with this email", 409);
    }

    let user = existingUser;
    if (user) {
      user.name = name;
      user.password = password;
      user.phone = formatPhone(normalizedPhone);
      user.department = department || "";
      user.studyYear = studyYear ? Number(studyYear) : null;
      user.semester = semester ? Number(semester) : null;
      user.role = selectedRole;
      user.canteenKey = selectedRole === "vendor" ? canteenKey : null;
      user.phoneVerified = false;
      await user.save();
    } else {
      user = await User.create({
        name,
        email: normalizedEmail,
        password,
        role: selectedRole,
        phone: formatPhone(normalizedPhone),
        phoneVerified: false,
        department: department || "",
        studyYear: studyYear ? Number(studyYear) : null,
        semester: semester ? Number(semester) : null,
        canteenKey: selectedRole === "vendor" ? canteenKey : null,
      });
    }

    const otpResult = await issuePhoneOtp(user);

    return sendSuccess(
      res,
      otpResult.smsSent
        ? "OTP sent to your phone. Verify to activate your account."
        : "Account created. OTP SMS failed — use Resend OTP or check the code shown for testing.",
      {
        requiresOtp: true,
        email: user.email,
        phoneMasked: maskPhone(user.phone),
        smsSent: otpResult.smsSent,
        ...(otpResult.devOtp ? { devOtp: otpResult.devOtp } : {}),
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

const verifyPhoneOtp = async (req, res, next) => {
  try {
    if (!ensureDatabaseConnected(res)) return;

    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();

    if (!email || !otp) {
      return sendError(res, "Email and OTP are required", 400);
    }

    if (!/^\d{6}$/.test(otp)) {
      return sendError(res, "OTP must be a 6-digit code", 400);
    }

    const user = await User.findOne({ email }).select(
      "+password +phoneOtpHash +phoneOtpExpires +phoneOtpAttempts"
    );

    if (!user) {
      return sendError(res, "No pending registration found for this email", 404);
    }

    if (user.phoneVerified) {
      return sendError(res, "Phone already verified. Please log in.", 400);
    }

    if (!user.phoneOtpHash || !user.phoneOtpExpires) {
      return sendError(res, "No OTP found. Please request a new code.", 400);
    }

    if (user.phoneOtpExpires.getTime() < Date.now()) {
      return sendError(res, "OTP expired. Please request a new code.", 400);
    }

    if ((user.phoneOtpAttempts || 0) >= OTP_MAX_ATTEMPTS) {
      return sendError(res, "Too many invalid attempts. Please request a new OTP.", 429);
    }

    if (user.phoneOtpHash !== hashOtp(otp)) {
      user.phoneOtpAttempts = (user.phoneOtpAttempts || 0) + 1;
      await user.save();
      return sendError(res, "Invalid OTP. Please try again.", 400);
    }

    user.phoneVerified = true;
    user.phoneOtpHash = null;
    user.phoneOtpExpires = null;
    user.phoneOtpAttempts = 0;
    await user.save();

    const token = generateToken(user._id);

    return sendSuccess(
      res,
      "Phone verified successfully. You are now logged in.",
      {
        user: toUserPayload(user),
        token,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

const resendPhoneOtp = async (req, res, next) => {
  try {
    if (!ensureDatabaseConnected(res)) return;

    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) {
      return sendError(res, "Email is required", 400);
    }

    const user = await User.findOne({ email }).select(
      "+phoneOtpHash +phoneOtpExpires +phoneOtpAttempts"
    );

    if (!user) {
      return sendError(res, "No account found with that email", 404);
    }

    if (user.phoneVerified) {
      return sendError(res, "Phone already verified. Please log in.", 400);
    }

    if (!user.phone || !isValidSriLankanPhone(user.phone)) {
      return sendError(res, "A valid phone number is required to send OTP", 400);
    }

    const otpResult = await issuePhoneOtp(user);

    return sendSuccess(
      res,
      otpResult.smsSent ? "OTP resent to your phone." : "OTP generated. SMS delivery failed — check testing code if shown.",
      {
        requiresOtp: true,
        email: user.email,
        phoneMasked: maskPhone(user.phone),
        smsSent: otpResult.smsSent,
        ...(otpResult.devOtp ? { devOtp: otpResult.devOtp } : {}),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    if (!ensureDatabaseConnected(res)) return;

    const { email, password, role } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!email || !password) {
      return sendError(res, "Email and password are required", 400);
    }

    if (!role || !["student", "vendor", "admin"].includes(role)) {
      return sendError(res, "Select your account role", 400);
    }

    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) {
      return sendError(res, "Invalid email or password", 401);
    }

    if (user.role !== role) {
      return sendError(res, "The selected role does not match this account", 401);
    }

    const access = await validateUserAccessStatus(user);
    if (!access.allowed) {
      return sendError(res, access.message, 403);
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return sendError(res, "Invalid email or password", 401);
    }

    if (user.role === "student" && user.phoneVerified === false) {
      return sendError(
        res,
        "Phone not verified. Complete OTP verification from the register page before logging in.",
        403
      );
    }

    const token = generateToken(user._id);

    return sendSuccess(
      res,
      "Login successful",
      {
        user: toUserPayload(user),
        token,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    return sendSuccess(
      res,
      "Current user fetched successfully",
      {
        user: toUserPayload(req.user),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      department,
      password,
      currentPassword,
      profileImage,
      studyYear,
      semester,
    } = req.body;

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    user.name = name || user.name;

    if (profileImage !== undefined) {
      user.profileImage = typeof profileImage === "string" ? profileImage.trim() : "";
    }

    if (phone !== undefined) {
      const nextPhone = String(phone || "").trim();
      if (nextPhone && !isValidSriLankanPhone(nextPhone)) {
        return sendError(
          res,
          "Enter a valid Sri Lankan mobile number (e.g. 0771234567 or +94771234567)",
          400
        );
      }
      const formatted = nextPhone ? formatPhone(nextPhone) : "";
      if (formatted && formatted !== user.phone) {
        user.phone = formatted;
        user.phoneVerified = false;
      } else if (!formatted) {
        user.phone = "";
      }
    }

    user.department = department ?? user.department;

    if (studyYear !== undefined) {
      if (studyYear !== null && studyYear !== "" && (Number(studyYear) < 1 || Number(studyYear) > 4)) {
        return sendError(res, "Study year must be between 1 and 4", 400);
      }
      user.studyYear = studyYear === "" ? null : Number(studyYear);
    }

    if (semester !== undefined) {
      if (semester !== null && semester !== "" && (Number(semester) < 1 || Number(semester) > 2)) {
        return sendError(res, "Semester must be 1 or 2", 400);
      }
      user.semester = semester === "" ? null : Number(semester);
    }

    if (password) {
      if (currentPassword) {
        const matchesCurrent = await user.comparePassword(currentPassword);
        if (!matchesCurrent) {
          return sendError(res, "Current password is incorrect", 400);
        }
      }
      if (!isStrongPassword(password)) {
        return sendError(res, STRONG_PASSWORD_MESSAGE, 400);
      }
      user.password = password;
    }

    await user.save();

    return sendSuccess(
      res,
      "Profile updated successfully",
      {
        user: toUserPayload(user),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    if (!ensureDatabaseConnected(res)) return;

    const { email } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!email) {
      return sendError(res, "Email is required", 400);
    }

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+passwordResetOtpHash +passwordResetOtpExpires +passwordResetOtpAttempts"
    );
    if (!user) {
      return sendError(res, "No account found with that email", 404);
    }

    if (!user.phone || !isValidSriLankanPhone(user.phone)) {
      return sendError(res, "A valid phone number is required for password reset", 400);
    }

    const otp = generateOtp();
    user.passwordResetOtpHash = hashOtp(otp);
    user.passwordResetOtpExpires = new Date(Date.now() + OTP_EXPIRY_MS);
    user.passwordResetOtpAttempts = 0;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    const smsResult = await sendSMS(user.phone, buildOtpSMS(otp));
    if (!smsResult.success && process.env.NODE_ENV !== "production") {
      console.log(`[OTP] Password reset dev fallback code for ${user.email}: ${otp}`);
    }

    return sendSuccess(
      res,
      smsResult.success
        ? "OTP sent to your phone. Verify it to reset your password."
        : "OTP generated. SMS delivery failed — use the testing code if shown.",
      {
        requiresOtp: true,
        email: user.email,
        phoneMasked: maskPhone(user.phone),
        smsSent: Boolean(smsResult.success),
        ...(smsResult.success || process.env.NODE_ENV === "production" ? {} : { devOtp: otp }),
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

const verifyPasswordResetOtp = async (req, res, next) => {
  try {
    if (!ensureDatabaseConnected(res)) return;

    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();

    if (!email || !otp) {
      return sendError(res, "Email and OTP are required", 400);
    }
    if (!/^\d{6}$/.test(otp)) {
      return sendError(res, "OTP must be a 6-digit code", 400);
    }

    const user = await User.findOne({ email }).select(
      "+passwordResetOtpHash +passwordResetOtpExpires +passwordResetOtpAttempts"
    );
    if (!user) {
      return sendError(res, "No password reset request found for this email", 404);
    }
    if (!user.passwordResetOtpHash || !user.passwordResetOtpExpires) {
      return sendError(res, "No OTP found. Please request a new code.", 400);
    }
    if (user.passwordResetOtpExpires.getTime() < Date.now()) {
      return sendError(res, "OTP expired. Please request a new code.", 400);
    }
    if ((user.passwordResetOtpAttempts || 0) >= OTP_MAX_ATTEMPTS) {
      return sendError(res, "Too many invalid attempts. Please request a new OTP.", 429);
    }
    if (user.passwordResetOtpHash !== hashOtp(otp)) {
      user.passwordResetOtpAttempts = (user.passwordResetOtpAttempts || 0) + 1;
      await user.save();
      return sendError(res, "Invalid OTP. Please try again.", 400);
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.passwordResetOtpHash = null;
    user.passwordResetOtpExpires = null;
    user.passwordResetOtpAttempts = 0;
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    return sendSuccess(res, "OTP verified. You can now reset your password.", { token }, 200);
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return sendError(res, "Token and new password are required", 400);
    }

    if (newPassword.length < 6) {
      return sendError(res, "Password must be at least 6 characters", 400);
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+password");

    if (!user) {
      return sendError(res, "Invalid or expired reset token", 400);
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return sendSuccess(res, "Password reset successful. You can now log in.", {}, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  verifyPhoneOtp,
  resendPhoneOtp,
  getCurrentUser,
  updateProfile,
  forgotPassword,
  verifyPasswordResetOtp,
  resetPassword,
};
