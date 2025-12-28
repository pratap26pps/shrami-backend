// models/Otp.js
import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  contactNumber: String,
  otp: String,
  expiresAt: Date,
});

export default mongoose.model("Otp", otpSchema);
