import mongoose from "mongoose";
 
const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    ContactNumber: { type: String}, 
    userId: { type: String, required: false, unique: true },
    password: { type: String, default: null },
    profilePhoto: {
      type: String,
      default: "/assets/landingphoto/Rectangle158.png",
    },
    resetOtp: Number,
    resetOtpExpiry: Date,
  },
  { timestamps: true }
)
export default mongoose.models.User || mongoose.model("User", userSchema);
