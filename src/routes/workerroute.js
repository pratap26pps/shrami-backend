
import express from "express";
const router = express.Router();
import { getWorkers } from "../controllers/getworker.js";
import { CreateOrder } from "../controllers/create-order.js";
import { VerifyPayments } from "../controllers/verify-payment.js";
import { getOrders } from "../controllers/getorders.js";
import { PlaceOrder } from "../controllers/placeorder.js";
 
router.get("/getWorkers", getWorkers);
router.post("/PlaceOrder", PlaceOrder);
router.get("/getOrders", getOrders);
router.post("/CreateOrder", CreateOrder);
router.post("/VerifyPayments", VerifyPayments);
 

export default router;  