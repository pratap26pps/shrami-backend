import Razorpay from 'razorpay';

export const CreateOrder = async (req, res) => {
  console.log('[CreateOrder] Request received, method:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  // Support both RAZORPAY_KEY/RAZORPAY_SECRET and RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET
  const keyId = (process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY)?.trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET)?.trim();

  console.log('[CreateOrder] Env check - key present:', !!keyId, '| secret present:', !!keySecret);

  if (!keyId || !keySecret) {
    console.error('[CreateOrder] BUG: RAZORPAY_KEY or RAZORPAY_SECRET missing in .env');
    return res.status(500).json({
      success: false,
      message: 'Payment configuration error. Please try again later.',
    });
  }

  try {
    const { amount, currency = 'INR', receipt, notes = {} } = req.body;
    console.log('[CreateOrder] Request body:', { amount, currency, receipt, notes });

    if (!amount || !receipt) {
      return res.status(400).json({
        success: false,
        message: 'Amount and receipt are required'
      });
    }

    const amountPaise = Math.round(Number(amount) * 100);
    console.log('[CreateOrder] Amount in paise:', amountPaise);
    if (!amountPaise || amountPaise < 100) {
      console.error('[CreateOrder] BUG: Invalid amount - amountPaise:', amountPaise);
      return res.status(400).json({
        success: false,
        message: 'Amount must be at least ₹1',
      });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    console.log('[CreateOrder] Calling Razorpay orders.create...');

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
    // Razorpay SDK throws { statusCode, error: { code, description } }; axios uses response.data
    const razorpayErrObj = error?.error ?? error?.response?.data?.error;
    const msg = razorpayErrObj?.description ?? error?.description ?? error?.message ?? 'Failed to create payment order';
    const razorpayErr = razorpayErrObj
      ? String(razorpayErrObj.description || razorpayErrObj.reason || JSON.stringify(razorpayErrObj))
      : (error?.message || String(error));
    const errStatus = error?.statusCode ?? error?.status ?? error?.response?.status ?? null;

    console.error('[CreateOrder] BUG - Full error:', JSON.stringify({
      message: error?.message,
      statusCode: errStatus,
      errorKeys: error ? Object.keys(error) : [],
      razorpayErr: razorpayErrObj,
    }));

    // Always send strings so frontend sees the real error (JSON omits undefined)
    res.status(500).json({
      success: false,
      message: msg,
      error: error?.message || razorpayErr || 'Unknown',
      razorpayError: razorpayErr,
      razorpayStatusCode: errStatus,
    });
  }
}
