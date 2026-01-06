
import express from "express";
const router = express.Router();
import { getWorkers } from "../controllers/getworker.js";
 
router.get("/getWorkers", getWorkers);
 

export default router;  