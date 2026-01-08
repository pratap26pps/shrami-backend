const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: String, required: true },
    items: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, required: true, min: 1 },
            price: { type: Number, required: true }
        }
    ],
    totalAmount: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'], 
        default: 'pending' 
    },
    shippingAddress: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true }
    },
    paymentMethod: { type: String, required: true },
    paymentId: { type: String },
    paidAt: { type: Date },
    deliveredAt: { type: Date }
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model('Order', orderSchema);