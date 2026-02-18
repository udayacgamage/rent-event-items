import { Router } from 'express';
import Booking from '../models/Booking.js';
import Item from '../models/Item.js';
import PromoCode from '../models/PromoCode.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const orderCode = () => `EVT-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 900 + 100)}`;

// ---------- Create Booking ----------
router.post('/', authenticate, async (req, res, next) => {
  try {
    const {
      eventDate,
      returnDate,
      deliveryPreference,
      address,
      customerName,
      customerEmail,
      customerPhone,
      cartItems,
      promoCode,
      paymentStatus
    } = req.body;

    if (!cartItems?.length) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const itemIds = cartItems.map((entry) => entry.itemId);
    const inventory = await Item.find({ _id: { $in: itemIds }, disabled: false });

    const mapped = new Map(inventory.map((item) => [item._id.toString(), item]));

    let subtotal = 0;
    const bookingItems = [];

    for (const entry of cartItems) {
      const item = mapped.get(entry.itemId);
      if (!item) {
        return res.status(400).json({ message: 'Invalid cart item detected' });
      }

      if (item.availableStock < entry.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${item.name}` });
      }

      subtotal += item.rentalPrice * entry.quantity;
      bookingItems.push({
        item: item._id,
        name: item.name,
        unitPrice: item.rentalPrice,
        quantity: entry.quantity
      });
    }

    // Atomically update stock for all items; roll back on failure
    const updatedItemIds = [];
    for (const entry of cartItems) {
      const result = await Item.findOneAndUpdate(
        { _id: entry.itemId, availableStock: { $gte: entry.quantity } },
        { $inc: { rentedQuantity: entry.quantity } },
        { new: true }
      );
      if (!result) {
        // Roll back previously updated items
        for (const prev of updatedItemIds) {
          await Item.findByIdAndUpdate(prev.id, { $inc: { rentedQuantity: -prev.qty } });
        }
        const item = mapped.get(entry.itemId);
        return res.status(400).json({ message: `Insufficient stock for ${item?.name || 'an item'}` });
      }
      updatedItemIds.push({ id: entry.itemId, qty: entry.quantity });
    }

    let discountAmount = 0;
    if (promoCode) {
      const promo = await PromoCode.findOne({ code: promoCode.toUpperCase(), active: true });
      if (promo) {
        discountAmount = (subtotal * promo.discountPercent) / 100;
      }
    }

    const total = Math.max(subtotal - discountAmount, 0);

    const booking = await Booking.create({
      orderId: orderCode(),
      customer: req.user._id,
      customerName,
      customerEmail,
      customerPhone,
      eventDate,
      returnDate,
      deliveryPreference,
      address,
      items: bookingItems,
      subtotal,
      discountAmount,
      total,
      paymentStatus: paymentStatus || 'pending'
    });

    return res.status(201).json({ booking });
  } catch (error) {
    next(error);
  }
});

router.get('/my', authenticate, async (req, res, next) => {
  try {
    const bookings = await Booking.find({ customer: req.user._id }).sort({ createdAt: -1 });
    return res.json({ bookings });
  } catch (error) {
    next(error);
  }
});

// ---------- Get Booking by orderId ----------
router.get('/:orderId', authenticate, async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      orderId: req.params.orderId,
      customer: req.user._id
    });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    return res.json({ booking });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, customer: req.user._id });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    if (booking.bookingStatus === 'returned') {
      return res.status(400).json({ message: 'Cannot cancel a returned booking' });
    }

    // Restore stock for each item
    for (const entry of booking.items) {
      await Item.findByIdAndUpdate(entry.item, { $inc: { rentedQuantity: -entry.quantity } });
    }

    booking.bookingStatus = 'cancelled';
    booking.trackingStatus = 'processing';
    await booking.save();

    return res.json({ booking });
  } catch (error) {
    next(error);
  }
});

export default router;
