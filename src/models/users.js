import mongoose from "mongoose";
 
const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    // adhar details 
    email: { type: String, required: true, unique: true },
    userId: { type: String, required: false, unique: true },
    password: { type: String, default: null },

    category: { type: String },
    accountType: {
      type: String,
      enum: ["Construction", "Transport", "HouseHelp",],
      default: "Construction",
      required:  false,
    },
    profilePhoto: {
      type: String,
      default: "/assets/landingphoto/Rectangle158.png",
    },
  },
  { timestamps: true }
)
export default mongoose.models.User || mongoose.model("User", userSchema);
