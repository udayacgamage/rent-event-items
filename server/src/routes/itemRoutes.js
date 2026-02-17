import { Router } from 'express';
import Item from '../models/Item.js';
import Booking from '../models/Booking.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { category, minPrice, maxPrice, available, search, page = 1, limit = 20 } = req.query;
    const query = { disabled: false };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (minPrice || maxPrice) {
      query.rentalPrice = {};
      if (minPrice) query.rentalPrice.$gte = Number(minPrice);
      if (maxPrice) query.rentalPrice.$lte = Number(maxPrice);
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [items, totalCount] = await Promise.all([
      Item.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Item.countDocuments(query)
    ]);

    let filtered = items;
    if (available === 'true') {
      filtered = items.filter((item) => item.availableStock > 0);
    }

    return res.json({
      items: filtered,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/availability', async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const bookings = await Booking.find({
      'items.item': id,
      bookingStatus: { $in: ['confirmed'] }
    }).select('eventDate returnDate bookingStatus');

    const calendar = bookings.map((entry) => ({
      from: entry.eventDate,
      to: entry.returnDate,
      status: entry.bookingStatus
    }));

    return res.json({ item, calendar });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const item = await Item.create(req.body);
    return res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    return res.json({ item });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    item.disabled = true;
    await item.save();

    return res.json({ message: 'Item disabled' });
  } catch (error) {
    next(error);
  }
});

export default router;
