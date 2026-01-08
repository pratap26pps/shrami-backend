import connectDB from '../config/db.js';
import Order from '../models/Order.js';
 

function padOrderNumber(num) {
  return num.toString().padStart(11, '0');
}

export const PlaceOrder = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const { user, items, totalAmount, shippingAddress, paymentMethod } = req.body;
  
  // Validate required fields
  if (!user || !items || !totalAmount || !shippingAddress || !paymentMethod) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  // Validate items array
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Items must be a non-empty array' });
  }
  
  try {
    await connectDB();
    
    // Process and validate each item
    const processedItems = items.map((item, index) => {
      // Basic validation for each item
      if (!item.product || !item.quantity || !item.price) {
        throw new Error(`Item at index ${index} is missing required fields (product, quantity, price)`);
      }
      
      // Create processed item with all available fields
      const processedItem = {
        product: item.product,
        quantity: item.quantity,
        price: item.price,
        // Service package specific fields
        ...(item.packageId && { packageId: item.packageId }),
        ...(item.packageName && { packageName: item.packageName }),
        ...(item.selectedProblems && { selectedProblems: item.selectedProblems }),
        ...(item.carBrand && { carBrand: item.carBrand }),
        ...(item.carModel && { carModel: item.carModel }),
        ...(item.warranty && { warranty: item.warranty }),
        ...(item.duration && { duration: item.duration }),
        ...(item.serviceSlug && { serviceSlug: item.serviceSlug }),
      };
      
      return processedItem;
    });
    
    // Get the current order count for unique orderId
    const orderCount = await Order.countDocuments();
    const orderId = `ORDERIDGNB${padOrderNumber(orderCount + 1)}`;
    
    // Create order with processed items
    const orderData = {
      user,
      items: processedItems,
      totalAmount,
      shippingAddress,
      paymentMethod,
      orderId,
      // Add timestamp
      createdAt: new Date(),
      // Add order status
      status: paymentMethod === "cod" ? 'processing' : 'pending',
    };
    
    const newOrder = await Order.create(orderData);
    
  
    
 
    res.status(201).json({ 
      message: 'Order placed successfully', 
      order: newOrder, 
      orderId,
      itemCount: processedItems.length
    });
    
  } catch (error) {
    console.error('Order placement error:', error);
    res.status(500).json({ 
      message: 'Failed to place order', 
      error: error.message 
    });
  }
} 