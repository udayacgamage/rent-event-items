import { Router } from 'express';
import Booking from '../models/Booking.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/dashboard', async (req, res, next) => {
  try {
    const bookings = await Booking.find({ paymentStatus: 'paid' });

    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.total, 0);
    const totalBookings = bookings.length;

    const itemTotals = {};
    for (const booking of bookings) {
      for (const item of booking.items) {
        itemTotals[item.name] = (itemTotals[item.name] || 0) + item.quantity;
      }
    }

    const topItems = Object.entries(itemTotals)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return res.json({ totalRevenue, totalBookings, topItems });
  } catch (error) {
    next(error);
  }
});

router.get('/invoices/:bookingId', async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    return res.json({
      invoice: {
        orderId: booking.orderId,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        eventDate: booking.eventDate,
        returnDate: booking.returnDate,
        items: booking.items,
        subtotal: booking.subtotal,
        discountAmount: booking.discountAmount,
        total: booking.total,
        paymentStatus: booking.paymentStatus
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
