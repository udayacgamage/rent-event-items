import { Router } from 'express';
import multer from 'multer';
import Item from '../models/Item.js';
import Booking from '../models/Booking.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', async (req, res, next) => {
  try {
    const { category, minPrice, maxPrice, available, search, page = 1, limit = 20, sort } = req.query;
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

    // Availability filter at DB level using $expr
    if (available === 'true') {
      query.$expr = { $gt: [{ $subtract: [{ $subtract: ['$stockQuantity', '$rentedQuantity'] }, '$pendingRepairs'] }, 0] };
    }

    // Server-side sorting
    const sortOptions = {
      'price-asc': { rentalPrice: 1 },
      'price-desc': { rentalPrice: -1 },
      'rating': { averageRating: -1 },
      'name': { name: 1 },
      'newest': { createdAt: -1 }
    };
    const sortOrder = sortOptions[sort] || { createdAt: -1 };

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [items, totalCount] = await Promise.all([
      Item.find(query).sort(sortOrder).skip(skip).limit(limitNum),
      Item.countDocuments(query)
    ]);

    return res.json({
      items,
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

// Upload images for an item (up to 5)
router.post('/:id/images', authenticate, requireAdmin, upload.array('images', 5), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Check if CLOUDINARY env vars are set
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(500).json({ message: 'Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET env vars.' });
    }

    const uploadPromises = req.files.map((file) => uploadToCloudinary(file.buffer, 'occasia/items'));
    const results = await Promise.all(uploadPromises);
    const urls = results.map((r) => r.url);

    item.images = [...item.images, ...urls];
    await item.save();

    return res.json({ images: item.images });
  } catch (error) {
    next(error);
  }
});

export default router;
