import { connectDatabase } from "../config/database";
import { UserModel } from "../models/User";
import { ActivityLogModel } from "../models/ActivityLog";

const recentActivityCache = new Map();

export async function logUserActivity(userId, activityType, metadata = {}) {
  if (!userId || !activityType) return null;

  await connectDatabase();

  const user =
    typeof userId === "string" && userId.match(/^[a-f0-9]{24}$/i)
      ? await UserModel.findById(userId)
      : await UserModel.findOne({ legacyId: Number(userId) });

  if (!user) return null;

  const doc = await ActivityLogModel.create({
    userId: user._id,
    activityType,
    metadata,
    timestamp: new Date(),
  });

  const key = String(user._id);
  const history = recentActivityCache.get(key) || [];
  history.unshift({
    activityType,
    metadata,
    timestamp: doc.timestamp,
  });
  recentActivityCache.set(key, history.slice(0, 50));

  return doc;
}

export function getRecentActivityFromCache(userId) {
  if (!userId) return [];
  return recentActivityCache.get(String(userId)) || [];
}

