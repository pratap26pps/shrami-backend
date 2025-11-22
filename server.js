import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// HTTP Server for Socket.io
const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000","https://corptube-alpha.vercel.app"], // For development, use your vercel URL in production
    methods: ["GET", "POST"],
  },
});

// Socket events handling
io.on("connection", (socket) => {
  console.log("🔗 User connected:", socket.id);

  socket.on("send-message", (data) => {
    io.emit("receive-message", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// Test API route
app.get("/", (req, res) => {
  res.send("Backend running successfully!");
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
