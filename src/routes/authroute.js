
import express from "express";
const router = express.Router();
import { googleLogin, callback,googleauthcreation,verifyOtpAndSignup } from "../controllers/authcontrollers.js";
 
import admin from "../config/firebaseAdmin.js";
import jwt from "jsonwebtoken";
import User from "../models/users.js";
router.get("/google", googleLogin);
router.get("/callback/google", callback);

router.post("/googleauthcreation", googleauthcreation);


// manually registration process

router.post("/signup", verifyOtpAndSignup);                         
 

router.post("/phone-login", async (req, res) => {
  try {
    const { token } = req.body;

    const decoded = await admin.auth().verifyIdToken(token);
    const ContactNumber = decoded.phone_number;

    let user = await User.findOne({ ContactNumber });
    if (!user) {
      user = await User.create({ ContactNumber });
    }

    const appToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ success: true, token: appToken, user });
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
});

export default router;