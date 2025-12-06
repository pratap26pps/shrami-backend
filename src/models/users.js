import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const {Schema} = mongoose;
const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    userId: { type: String, required: false, unique: true }, // make sure it's unique
    password: { type: String, default: null },

    category: { type: String },
    accountType: {
      type: String,
      enum: ["BusinessMan", "Entrepreneur", "Investor", "User"],
      default: "User",
      required:  false,
    },
    profilePhoto: {
      type: String,
      default: "/assets/landingphoto/Rectangle158.png",
    },
    provider:{
      type: String,
      enum: ["credentials", "google"],
      default: "credentials",
      required: true,
    },
    referralCode:{ type: String },
    totalcoins:{ type: Number },
   portfolio:{ type: String },
   supporting: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
   supporters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    
  },
  { timestamps: true }
);


export default mongoose.models.User || mongoose.model("User", userSchema);
