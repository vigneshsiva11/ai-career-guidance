import "server-only";
import mongoose from "mongoose";

let isConnected = false;
let listenersAttached = false;
let connectPromise = null;
let lastConnectFailureAt = 0;
let reconnectTimer = null;
let reconnectAttempt = 0;

const RETRY_COOLDOWN_MS = 3000;
const MAX_CONNECT_ATTEMPTS_PER_CALL = 2;
const RETRY_DELAY_MS = 600;
const AUTO_RECONNECT_BASE_MS = 2000;
const AUTO_RECONNECT_MAX_MS = 30000;

export class DatabaseUnavailableError extends Error {
  constructor(message = "Database unavailable") {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildDbUnavailableMessage(error) {
  const raw = String(error?.message || "MongoDB connect failed");
  const lower = raw.toLowerCase();

  const isAtlasNetworkIssue =
    lower.includes("server selection timed out") ||
    lower.includes("could not connect to any servers in your mongodb atlas cluster") ||
    lower.includes("whitelist");

  if (isAtlasNetworkIssue) {
    return (
      "Could not connect to MongoDB Atlas. Check Atlas Network Access (IP allowlist), " +
      "internet/VPN changes, and MONGO_URI credentials."
    );
  }

  return raw;
}

async function attemptConnect(finalUri) {
  return mongoose.connect(finalUri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 7000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4,
    dbName: process.env.MONGO_DB_NAME || "ai-career-guidance",
    maxPoolSize: 10,
    minPoolSize: 1,
    retryReads: true,
  });
}

function scheduleReconnect(finalUri) {
  if (reconnectTimer || isConnected || mongoose.connection.readyState === 1) {
    return;
  }

  const delay = Math.min(
    AUTO_RECONNECT_BASE_MS * Math.pow(2, reconnectAttempt),
    AUTO_RECONNECT_MAX_MS
  );
  reconnectAttempt += 1;

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    try {
      await connectDatabase({ bypassCooldown: true, finalUriOverride: finalUri });
      reconnectAttempt = 0;
      console.log("[MongoDB] auto-reconnect successful");
    } catch (error) {
      console.warn("[MongoDB] auto-reconnect failed:", error?.message || error);
      scheduleReconnect(finalUri);
    }
  }, delay);
}

export async function connectDatabase(options = {}) {
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    reconnectAttempt = 0;
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is not configured");
  }

  const now = Date.now();
  const bypassCooldown = Boolean(options?.bypassCooldown);
  if (
    !bypassCooldown &&
    lastConnectFailureAt &&
    now - lastConnectFailureAt < RETRY_COOLDOWN_MS
  ) {
    throw new DatabaseUnavailableError(
      "MongoDB connection is in cooldown after a recent failure"
    );
  }

  if (!listenersAttached) {
    mongoose.set("bufferCommands", false);

    mongoose.connection.on("connected", () => {
      isConnected = true;
      lastConnectFailureAt = 0;
       reconnectAttempt = 0;
      console.log("[MongoDB] connected");
    });

    mongoose.connection.on("error", (err) => {
      console.error("[MongoDB] connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      isConnected = false;
      console.warn("[MongoDB] disconnected");
      const uriForReconnect = buildMongoUri(process.env.MONGO_URI || "");
      if (uriForReconnect) {
        scheduleReconnect(uriForReconnect);
      }
    });

    listenersAttached = true;
  }

  const finalUri = options?.finalUriOverride || buildMongoUri(mongoUri);

  let lastError = null;
  for (let attempt = 1; attempt <= MAX_CONNECT_ATTEMPTS_PER_CALL; attempt += 1) {
    if (!connectPromise) {
      connectPromise = attemptConnect(finalUri)
        .finally(() => {
          connectPromise = null;
        });
    }

    try {
      await connectPromise;
      return mongoose.connection;
    } catch (error) {
      lastError = error;
      lastConnectFailureAt = Date.now();
      if (attempt < MAX_CONNECT_ATTEMPTS_PER_CALL) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  scheduleReconnect(finalUri);
  throw new DatabaseUnavailableError(buildDbUnavailableMessage(lastError));
}
