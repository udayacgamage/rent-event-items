import { Router } from 'express';
import Notification from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Get my notifications
router.get('/', authenticate, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ customer: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    return res.json({ notifications });
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, customer: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    return res.json({ notification });
  } catch (error) {
    next(error);
  }
});

// Mark all as read
router.patch('/read-all', authenticate, async (req, res, next) => {
  try {
    await Notification.updateMany({ customer: req.user._id, read: false }, { read: true });
    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

// Get unread count
router.get('/unread-count', authenticate, async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ customer: req.user._id, read: false });
    return res.json({ count });
  } catch (error) {
    next(error);
  }
});

export default router;
