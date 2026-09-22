const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const storePath = path.join(__dirname, "..", "data", "users.json");

const ensureStore = () => {
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  if (!fs.existsSync(storePath)) {
    fs.writeFileSync(storePath, "[]", "utf8");
  }
};

const readUsers = () => {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(storePath, "utf8"));
  } catch {
    return [];
  }
};

const writeUsers = (users) => {
  ensureStore();
  fs.writeFileSync(storePath, JSON.stringify(users, null, 2), "utf8");
};

const normalizeUser = (user) => ({
  ...user,
  _id: user._id || crypto.randomUUID(),
  email: String(user.email || "").trim().toLowerCase(),
  name: user.name || "",
  role: user.role || "student",
  isActive: user.isActive ?? true,
  accountStatus: user.accountStatus || "active",
  statusReason: user.statusReason || "",
  suspendedUntil: user.suspendedUntil || null,
  phone: user.phone || "",
  department: user.department || "",
  studyYear: user.studyYear ?? null,
  semester: user.semester ?? null,
  canteenKey: user.canteenKey || null,
  monthlyFoodBudget: user.monthlyFoodBudget ?? null,
  resetPasswordToken: user.resetPasswordToken || null,
  resetPasswordExpires: user.resetPasswordExpires || null,
  createdAt: user.createdAt || new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const hashPasswordIfNeeded = async (password) => {
  if (!password) {
    return password;
  }

  if (typeof password === "string" && password.startsWith("$2")) {
    return password;
  }

  return bcrypt.hash(password, 10);
};

class FallbackUserDocument {
  constructor(data) {
    Object.assign(this, data);
    this._doc = data;
  }

  select() {
    return this;
  }

  async save() {
    const payload = {
      ...this._doc,
      ...this,
      _id: this._id,
      updatedAt: new Date().toISOString(),
    };

    if (payload.password) {
      payload.password = await hashPasswordIfNeeded(payload.password);
    }

    const users = readUsers();
    const index = users.findIndex((user) => String(user._id) === String(payload._id));

    if (index >= 0) {
      users[index] = payload;
    } else {
      users.push(payload);
    }

    writeUsers(users);
    Object.assign(this, payload);
    this._doc = payload;
    return this;
  }

  async comparePassword(candidatePassword) {
    if (!this.password) {
      return false;
    }

    return bcrypt.compare(candidatePassword, this.password);
  }

  toObject() {
    return { ...this._doc };
  }

  toJSON() {
    return this.toObject();
  }
}

const findFallbackUserByEmail = async (email) => {
  const users = readUsers();
  const target = String(email || "").trim().toLowerCase();
  const match = users.find((user) => String(user.email || "").toLowerCase() === target);
  return match ? new FallbackUserDocument(match) : null;
};

const findFallbackUserById = async (id) => {
  const users = readUsers();
  const match = users.find((user) => String(user._id) === String(id));
  return match ? new FallbackUserDocument(match) : null;
};

const createFallbackUser = async (userData) => {
  const payload = normalizeUser(userData);
  payload.password = await hashPasswordIfNeeded(payload.password);
  const users = readUsers();
  const alreadyExists = users.some((user) => String(user.email || "").toLowerCase() === String(payload.email || "").toLowerCase());
  if (alreadyExists) {
    const error = new Error("User already exists with this email");
    error.code = 11000;
    throw error;
  }

  users.push(payload);
  writeUsers(users);
  return new FallbackUserDocument(payload);
};

module.exports = {
  FallbackUserDocument,
  createFallbackUser,
  findFallbackUserByEmail,
  findFallbackUserById,
  readUsers,
  writeUsers,
};
