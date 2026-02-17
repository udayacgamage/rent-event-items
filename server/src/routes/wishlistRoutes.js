import { Router } from 'express';
import Wishlist from '../models/Wishlist.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Get user's wishlist (populated with item data)
router.get('/', async (req, res, next) => {
  try {
    const entries = await Wishlist.find({ user: req.user._id }).populate('item');
    const items = entries.map((entry) => entry.item).filter(Boolean);
    return res.json({ items });
  } catch (error) {
    next(error);
  }
});

// Add to wishlist
router.post('/:itemId', async (req, res, next) => {
  try {
    await Wishlist.findOneAndUpdate(
      { user: req.user._id, item: req.params.itemId },
      { user: req.user._id, item: req.params.itemId },
      { upsert: true, new: true }
    );
    return res.status(201).json({ message: 'Added to wishlist' });
  } catch (error) {
    next(error);
  }
});

// Remove from wishlist
router.delete('/:itemId', async (req, res, next) => {
  try {
    await Wishlist.findOneAndDelete({ user: req.user._id, item: req.params.itemId });
    return res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    next(error);
  }
});

export default router;
