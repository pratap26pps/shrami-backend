import "dotenv/config"; // 👈 MUST be first

import express from "express";
import cors from "cors";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/authroute.js";
import workerruter from "./src/routes/workerroute.js"

connectDB();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: true, // Allow all origins (mobile app, web, local dev)
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/worker", workerruter);


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
