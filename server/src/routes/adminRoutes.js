import { Router } from 'express';
import Booking from '../models/Booking.js';
import Item from '../models/Item.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/inventory-summary', async (req, res, next) => {
  try {
    const items = await Item.find({});

    const summary = items.reduce(
      (acc, item) => {
        acc.totalStock += item.stockQuantity;
        acc.rentedStock += item.rentedQuantity;
        acc.pendingRepairs += item.pendingRepairs;
        return acc;
      },
      { totalStock: 0, rentedStock: 0, pendingRepairs: 0 }
    );

    return res.json(summary);
  } catch (error) {
    next(error);
  }
});

router.get('/bookings', async (req, res, next) => {
  try {
    const bookings = await Booking.find({}).sort({ createdAt: -1 });
    return res.json({ bookings });
  } catch (error) {
    next(error);
  }
});

router.patch('/bookings/:id', async (req, res, next) => {
  try {
    const allowedFields = ['bookingStatus', 'trackingStatus', 'paymentStatus', 'maintenanceNote'];
    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const booking = await Booking.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    return res.json({ booking });
  } catch (error) {
    next(error);
  }
});

router.get('/customers', async (req, res, next) => {
  try {
    const customers = await User.find({ role: 'customer' })
      .select('name email phone totalSpending createdAt')
      .sort({ totalSpending: -1 });

    return res.json({ customers });
  } catch (error) {
    next(error);
  }
});

router.post('/notifications', async (req, res, next) => {
  try {
    const { customerId, message } = req.body;
    if (!customerId || !message) {
      return res.status(400).json({ message: 'customerId and message are required' });
    }

    const notification = await Notification.create({
      customer: customerId,
      message,
      sentBy: req.user._id
    });

    return res.status(201).json({ notification });
  } catch (error) {
    next(error);
  }
});

export default router;
