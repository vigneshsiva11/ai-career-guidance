import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      default: "student",
      required: true,
    },
    assessmentCompleted: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },

    // Backward-compatible fields used by existing UI
    phone_number: { type: String, unique: true, sparse: true },
    roll_number: { type: String, unique: true, sparse: true },
    preferred_language: { type: String, default: "en" },
    location: { type: String, default: "" },
    education_level: { type: String, default: "" },
    legacyId: { type: Number, unique: true, sparse: true },
  },
  { timestamps: true }
);

export const UserModel =
  mongoose.models.User || mongoose.model("User", UserSchema);
