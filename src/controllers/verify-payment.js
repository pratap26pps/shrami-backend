import crypto from 'crypto';
import connectDB from '../config/db.js';
import Order from '../models/Order.js';

export const VerifyPayments = async (req, res) => {

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    await connectDB();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
      customerName,
      customerMobile,
      amount
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification data'
      });
    }

    const secret = process.env.RAZORPAY_SECRET?.trim();
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: 'Payment configuration error'
      });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed - Invalid signature'
      });
    }


    const newOrder = await Order.create({
      amount,
      customerName: customerName || 'Customer',
      customerMobile: customerMobile || '0000000000',
      paymentStatus: 'completed',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      createdAt: new Date(),
    });
  

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        orderId: newOrder._id,
        paymentStatus: newOrder.paymentStatus,
        razorpayPaymentId: razorpay_payment_id
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
}
