import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import jwt from "jsonwebtoken";
import Message from "./src/models/Message.js";
import Conversation from "./src/models/Conversation.js";
import messageRoutes from "./src/routes/messageRoutes.js";
import conversationRoutes from "./src/routes/conversationRoutes.js";

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5000;
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://corptube-alpha.vercel.app"
    ],
    credentials: true,
  })
);

// REST API routes
app.use("/api/messages", messageRoutes);
app.use("/api/conversations", conversationRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://corptube-alpha.vercel.app"],
    methods: ["GET", "POST"],
  },
   path: "/socket.io",
});

// Map user → socket IDs
const userSockets = new Map();

// JWT Authenticate each socket
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("NO_TOKEN"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error("INVALID_TOKEN"));
  }
});

io.on("connection", (socket) => {
  const userId = String(socket.userId);

  if (!userSockets.has(userId)) userSockets.set(userId, new Set());
  userSockets.get(userId).add(socket.id);

  socket.join(userId);

  console.log("User connected:", userId);

  // ========== SEND MESSAGE ==========
  socket.on("send-message", async (data, ack) => {
    try {
      let conversationId = data.conversationId;

      if (!conversationId) {
        const newConv = await Conversation.create({
          participants: [userId, data.to],
        });
        conversationId = newConv._id;
      }

      const msg = await Message.create({
        conversation: conversationId,
        sender: userId,
        recipient: data.to,
        text: data.text,
        media: data.media,
        mediaType: data.mediaType,
        createdAt: Date.now(),
      });


    // 🔥 IMPORTANT: Update lastMessage & Timestamp
    await Conversation.findByIdAndUpdate(
      conversationId,
      {
        lastMessage: msg._id,
        updatedAt: Date.now(),
      },
      { new: true }
    );


      io.to(String(data.to)).emit("receive-message", msg);
      io.to(String(userId)).emit("message-sent", msg);

     ack?.(msg);

    } catch (e) {
      ack?.({ status: "error", message: "server_error" });
    }
  });

  // ========== EDIT MESSAGE ==========
  socket.on("edit-message", async (data, ack) => {
    try {
      const msg = await Message.findOne({ _id: data.messageId, sender: userId });
      if (!msg) {
        return ack?.({ status: "error", message: "Message not found or unauthorized" });
      }

      msg.text = data.text;
      await msg.save();

      // Emit to both users in the conversation
      const conversation = await Conversation.findById(msg.conversation);
      if (conversation) {
        const updatedMsg = await Message.findById(msg._id);
        conversation.participants.forEach(participantId => {
          io.to(String(participantId)).emit("message-edited", updatedMsg);
        });
      }

      ack?.({ status: "ok", message: msg });
    } catch (e) {
      console.error("Edit message error:", e);
      ack?.({ status: "error", message: "server_error" });
    }
  });

  // ========== DELETE MESSAGE ==========
  socket.on("delete-message", async (data, ack) => {
    try {
      const msg = await Message.findOne({ _id: data.messageId, sender: userId });
      if (!msg) {
        return ack?.({ status: "error", message: "Message not found or unauthorized" });
      }

      const conversationId = msg.conversation;
      await Message.deleteOne({ _id: data.messageId });

      // Emit to both users in the conversation
      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        conversation.participants.forEach(participantId => {
          io.to(String(participantId)).emit("message-deleted", { messageId: data.messageId });
        });
      }

      ack?.({ status: "ok" });
    } catch (e) {
      ack?.({ status: "error", message: "server_error" });
    }
  });

  // ========== MARK MESSAGE AS READ ==========
  socket.on("mark-as-read", async (data, ack) => {
    try {
      const { messageIds } = data;
      if (!Array.isArray(messageIds) || messageIds.length === 0) {
        return ack?.({ status: "error", message: "Invalid messageIds" });
      }

      // Update all messages that are sent to this user (recipient)
      const result = await Message.updateMany(
        { 
          _id: { $in: messageIds },
          recipient: userId,
          isRead: false 
        },
        { 
          isRead: true,
          readAt: new Date()
        }
      );

      // Get updated messages to emit
      const updatedMessages = await Message.find({ _id: { $in: messageIds } });
      
      // Emit to sender that messages were read
      updatedMessages.forEach(msg => {
        io.to(String(msg.sender)).emit("message-read", {
          messageId: msg._id,
          isRead: true,
          readAt: msg.readAt
        });
      });

      ack?.({ status: "ok", count: result.modifiedCount });
    } catch (e) {
      console.error("Mark as read error:", e);
      ack?.({ status: "error", message: "server_error" });
    }
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
    // Clean up userSockets map
    if (userSockets.has(userId)) {
      userSockets.get(userId).delete(socket.id);
      if (userSockets.get(userId).size === 0) {
        userSockets.delete(userId);
      }
    }
  });
});


server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

