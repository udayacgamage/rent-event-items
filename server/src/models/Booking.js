import mongoose from 'mongoose';

const bookingItemSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    name: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    eventDate: { type: Date, required: true },
    returnDate: { type: Date, required: true },
    deliveryPreference: { type: String, enum: ['delivery', 'pickup'], required: true },
    address: { type: String, default: '' },
    items: { type: [bookingItemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    bookingStatus: { type: String, enum: ['confirmed', 'cancelled', 'returned'], default: 'confirmed' },
    trackingStatus: { type: String, enum: ['processing', 'out-for-delivery', 'delivered', 'picked-up', 'returned'], default: 'processing' },
    promoCode: { type: String, default: '' },
    maintenanceNote: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.model('Booking', bookingSchema);
