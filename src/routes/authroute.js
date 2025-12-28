
import express from "express";
const router = express.Router();
import { googleLogin,
   callback,
   googleauthcreation,
   verifyOtpAndSignup,
   verifyOtpAndSignup } from "../controllers/authcontrollers.js";
 
router.get("/google", googleLogin);
router.get("/callback/google", callback);

router.post("/googleauthcreation", googleauthcreation);


// manually registration process

router.post("/signup", verifyOtpAndSignup);                         
 

router.post("/phone-login",verifyOtpAndSignup);

export default router;