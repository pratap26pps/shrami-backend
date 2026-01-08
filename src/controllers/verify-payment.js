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
    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature
       || !order_id || !amount || !customerName || !customerMobile ) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification data'
      });
    }

    // Verify payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed - Invalid signature'
      });
    }


    // 🎉 Create order in MongoDB after successful verification
    const newOrder = await Order.create({
      amount,
      customerName,
      customerMobile,
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
