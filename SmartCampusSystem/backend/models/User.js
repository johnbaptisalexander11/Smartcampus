const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["student", "admin", "vendor"],
      default: "student",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    accountStatus: {
      type: String,
      enum: ["active", "suspended", "blocked"],
      default: "active",
    },
    statusReason: {
      type: String,
      default: "",
      trim: true,
    },
    suspendedUntil: {
      type: Date,
      default: null,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    phoneVerified: {
      type: Boolean,
      default: true,
    },
    profileImage: {
      type: String,
      default: "",
      trim: true,
    },
    phoneOtpHash: {
      type: String,
      default: null,
      select: false,
    },
    phoneOtpExpires: {
      type: Date,
      default: null,
      select: false,
    },
    phoneOtpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    department: {
      type: String,
      default: "",
      trim: true,
    },
    studyYear: {
      type: Number,
      min: 1,
      max: 4,
      default: null,
    },
    semester: {
      type: Number,
      min: 1,
      max: 2,
      default: null,
    },
    canteenKey: {
      type: String,
      enum: ["canteen1", "canteen2", "canteen3", "canteen4"],
      default: null,
    },
    monthlyFoodBudget: {
      type: Number,
      default: null,
      min: 0,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    passwordResetOtpHash: {
      type: String,
      default: null,
      select: false,
    },
    passwordResetOtpExpires: {
      type: Date,
      default: null,
      select: false,
    },
    passwordResetOtpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
