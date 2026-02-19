import { Router } from 'express';
import Review from '../models/Review.js';
import Item from '../models/Item.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Get reviews for an item
router.get('/:itemId', async (req, res, next) => {
  try {
    const reviews = await Review.find({ item: req.params.itemId }).sort({ createdAt: -1 });
    return res.json({ reviews });
  } catch (error) {
    next(error);
  }
});

// Create a review
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { itemId, rating, comment } = req.body;

    if (!itemId || !rating) {
      return res.status(400).json({ message: 'itemId and rating are required' });
    }

    const existing = await Review.findOne({ item: itemId, user: req.user._id });
    if (existing) {
      return res.status(409).json({ message: 'You have already reviewed this item' });
    }

    const review = await Review.create({
      item: itemId,
      user: req.user._id,
      rating: Math.min(5, Math.max(1, Number(rating))),
      comment: comment || '',
      userName: req.user.name
    });

    // Update item aggregate
    const allReviews = await Review.find({ item: itemId });
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Item.findByIdAndUpdate(itemId, {
      averageRating: Math.round(avg * 10) / 10,
      reviewsCount: allReviews.length
    });

    return res.status(201).json({ review });
  } catch (error) {
    next(error);
  }
});

// Helper to recalculate item rating
const recalcItemRating = async (itemId) => {
  const allReviews = await Review.find({ item: itemId });
  if (allReviews.length === 0) {
    await Item.findByIdAndUpdate(itemId, { averageRating: 0, reviewsCount: 0 });
  } else {
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Item.findByIdAndUpdate(itemId, { averageRating: Math.round(avg * 10) / 10, reviewsCount: allReviews.length });
  }
};

// Update a review
router.patch('/:reviewId', authenticate, async (req, res, next) => {
  try {
    const review = await Review.findOne({ _id: req.params.reviewId, user: req.user._id });
    if (!review) return res.status(404).json({ message: 'Review not found' });

    if (req.body.rating !== undefined) review.rating = Math.min(5, Math.max(1, Number(req.body.rating)));
    if (req.body.comment !== undefined) review.comment = req.body.comment;
    await review.save();

    await recalcItemRating(review.item);

    return res.json({ review });
  } catch (error) {
    next(error);
  }
});

// Delete a review
router.delete('/:reviewId', authenticate, async (req, res, next) => {
  try {
    const review = await Review.findOneAndDelete({ _id: req.params.reviewId, user: req.user._id });
    if (!review) return res.status(404).json({ message: 'Review not found' });

    await recalcItemRating(review.item);

    return res.json({ message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
