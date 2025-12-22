import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
 
import authRoutes from "./src/routes/authroute.js";

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5000;
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      

    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// REST API routes
app.use("/api/auth", authRoutes);


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

 
