
import express from "express";
const router = express.Router();
import { googleLogin, callback,googleauthcreation } from "../controllers/authcontrollers.js";
 

router.get("/google", googleLogin);
router.get("/callback/google", callback);

router.post("/googleauthcreation", googleauthcreation);

export default router;