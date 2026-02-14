import mongoose from "mongoose";

let isConnected = false;
let listenersAttached = false;

function buildMongoUri(rawUri) {
  // If no DB name is provided in the URI path, default to ai-career-guidance.
  try {
    const url = new URL(rawUri);
    if (!url.pathname || url.pathname === "/") {
      url.pathname = "/ai-career-guidance";
    }
    if (!url.searchParams.has("retryWrites")) {
      url.searchParams.set("retryWrites", "true");
    }
    if (!url.searchParams.has("w")) {
      url.searchParams.set("w", "majority");
    }
    return url.toString();
  } catch {
    return rawUri;
  }
}

export async function connectDatabase() {
  if (isConnected) return mongoose.connection;

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is not configured");
  }

  if (!listenersAttached) {
    mongoose.connection.on("connected", () => {
      isConnected = true;
      console.log("[MongoDB] connected");
    });

    mongoose.connection.on("error", (err) => {
      console.error("[MongoDB] connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      isConnected = false;
      console.warn("[MongoDB] disconnected");
    });

    listenersAttached = true;
  }

  const finalUri = buildMongoUri(mongoUri);

  await mongoose.connect(finalUri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4,
    dbName: process.env.MONGO_DB_NAME || "ai-career-guidance",
  });

  return mongoose.connection;
}
