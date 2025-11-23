import Conversation from "../models/Conversation.js";

export const getUserConversations = async (req, res) => {
  try {
    const convos = await Conversation.find({
      participants: req.params.userId,
    }).populate("lastMessage")
.populate("participants", "fullName email profilePhoto")
.sort({ updatedAt: -1 });;

    res.json({ success: true, conversations: convos });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
