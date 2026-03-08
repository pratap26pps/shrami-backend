import Razorpay from 'razorpay';

export const CreateOrder = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  const keyId = process.env.RAZORPAY_KEY?.trim();
  const keySecret = process.env.RAZORPAY_SECRET?.trim();

  if (!keyId || !keySecret) {
    console.error('Razorpay: RAZORPAY_KEY or RAZORPAY_SECRET missing in .env');
    return res.status(500).json({
      success: false,
      message: 'Payment configuration error. Please try again later.',
    });
  }

  try {
    const { amount, currency = 'INR', receipt, notes = {} } = req.body;

    if (!amount || !receipt) {
      return res.status(400).json({
        success: false,
        message: 'Amount and receipt are required'
      });
    }

    const amountPaise = Math.round(Number(amount) * 100);
    if (!amountPaise || amountPaise < 100) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be at least ₹1',
      });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const options = {
      amount: amountPaise,
      currency,
      receipt: String(receipt).trim(),
      notes: typeof notes === 'object' ? notes : {},
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        created_at: order.created_at,
        key_id: keyId,
      }
    });

  } catch (error) {
    const msg = error?.error?.description || error?.description || error?.message || 'Failed to create payment order';
    console.error('Razorpay order creation error:', error?.message || error);
    if (error?.error) console.error('Razorpay error details:', error.error);
    res.status(500).json({
      success: false,
      message: msg,
      error: error?.message
    });
  }
}
