
import express from "express";
const router = express.Router();
import { googleLogin,
   callback,
   googleauthcreation,
   verifyOtpAndSignup,LoginHandler } from "../controllers/authcontrollers.js";
 
router.get("/google", googleLogin);
router.get("/callback/google", callback);

router.post("/googleauthcreation", googleauthcreation);


// manually registration process

router.post("/SignupHandler", verifyOtpAndSignup);                         
 
router.post("LoginHandler", LoginHandler)

export default router;