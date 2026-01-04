
import express from "express";
const router = express.Router();
import { googleLogin,
   callback,
   verifyOtpAndSignup,LoginHandler,LogoutHandler,forgotPassword,resetPassword } from "../controllers/authcontrollers.js";
 
router.get("/google", googleLogin);
router.get("/callback/google", callback);

// manually registration process

router.post("/SignupHandler", verifyOtpAndSignup);                         
 
router.post("/LoginHandler", LoginHandler)
router.post("/LogoutHandler", LogoutHandler);

router.post("/forgot-password", forgotPassword)
router.post("/reset-password", resetPassword)

export default router;  