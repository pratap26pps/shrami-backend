import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },

    customerName: { type: String, required: true },
    customerMobile: { type: String, required: true },

    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },

    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", orderSchema);
