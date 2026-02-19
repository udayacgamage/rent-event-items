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

// Analytics: monthly revenue + booking-status breakdown + category breakdown
router.get('/analytics', async (req, res, next) => {
  try {
    const allBookings = await Booking.find();

    // Monthly revenue (last 12 months)
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth() });
    }

    const monthlyRevenue = months.map(({ year, month }) => {
      const label = new Date(year, month).toLocaleString('default', { month: 'short', year: '2-digit' });
      const rev = allBookings
        .filter((b) => b.paymentStatus === 'paid' && new Date(b.createdAt).getFullYear() === year && new Date(b.createdAt).getMonth() === month)
        .reduce((s, b) => s + b.total, 0);
      return { label, revenue: rev };
    });

    // Status breakdown
    const statusCounts = {};
    allBookings.forEach((b) => {
      statusCounts[b.bookingStatus] = (statusCounts[b.bookingStatus] || 0) + 1;
    });

    // Category breakdown (from items)
    const categoryCounts = {};
    allBookings.forEach((b) => {
      b.items.forEach((item) => {
        categoryCounts[item.name] = (categoryCounts[item.name] || 0) + item.quantity;
      });
    });

    const topCategories = Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return res.json({ monthlyRevenue, statusCounts, topCategories });
  } catch (error) {
    next(error);
  }
});

export default router;
