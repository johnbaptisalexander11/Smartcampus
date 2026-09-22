const mongoose = require("mongoose");
const dns = require("dns");
const { env } = require("./env");

// Node's resolver can fail SRV lookups on some Windows networks; use public DNS.
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

let memoryMongo = null;

const encodeMongoUriPassword = (uri) => {
  const match = uri.match(/^(mongodb(?:\+srv)?:\/\/)([^:@/]+):([^@]+)@(.+)$/i);
  if (!match) {
    return uri;
  }

  const [, protocol, username, password, rest] = match;
  const encodedPassword = encodeURIComponent(decodeURIComponent(password));
  if (encodedPassword === password) {
    return uri;
  }

  return `${protocol}${username}:${encodedPassword}@${rest}`;
};

const connectLocalOrMemory = async (reason) => {
  console.warn(`${reason} Using local/in-memory MongoDB for development.`);

  try {
    const localConnection = await mongoose.connect("mongodb://127.0.0.1:27017", {
      dbName: env.MONGO_DB_NAME,
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`MongoDB connected (local): ${localConnection.connection.host}`);
    console.log(`Database: ${localConnection.connection.name}`);
    return localConnection;
  } catch (localError) {
    console.warn(`Local MongoDB unavailable (${localError.message}). Starting in-memory MongoDB...`);
  }

  if (!memoryMongo) {
    const { MongoMemoryServer } = require("mongodb-memory-server");
    memoryMongo = await MongoMemoryServer.create({
      instance: { launchTimeout: 120000 },
    });
  }

  const memoryUri = memoryMongo.getUri();
  const connection = await mongoose.connect(memoryUri, {
    dbName: env.MONGO_DB_NAME,
    serverSelectionTimeoutMS: 20000,
    retryWrites: true,
  });
  console.log(`MongoDB connected (memory): ${connection.connection.host}`);
  console.log(`Database: ${connection.connection.name}`);
  return connection;
};

const connectDB = async () => {
  if (!env.MONGO_URI) {
    throw new Error("MONGO_URI is not set in backend/.env");
  }

  if (process.env.USE_MEMORY_MONGO === "true") {
    return connectLocalOrMemory("USE_MEMORY_MONGO=true.");
  }

  const uri = encodeMongoUriPassword(env.MONGO_URI);

  try {
    const connection = await mongoose.connect(uri, {
      dbName: env.MONGO_DB_NAME,
      serverSelectionTimeoutMS: 20000,
      retryWrites: true,
      tls: true,
      tlsAllowInvalidCertificates: true,
    });
    console.log(`MongoDB connected: ${connection.connection.host}`);
    console.log(`Database: ${connection.connection.name}`);
    return connection;
  } catch (error) {
    const message = [
      "MongoDB connection failed.",
      "The app is not using a persistent database, so registration data will not be saved.",
      "Fix your Atlas connection or start a local MongoDB instance, then restart the backend.",
      `Details: ${error.message}`,
    ].join(" ");

    if (process.env.NODE_ENV !== "production") {
      console.error(message);
      throw new Error(message);
    }

    console.error(message);
    process.exit(1);
  }
};

module.exports = connectDB;
