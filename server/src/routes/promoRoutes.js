import { Router } from 'express';
import PromoCode from '../models/PromoCode.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public: validate a promo code (no admin required)
router.get('/validate/:code', async (req, res, next) => {
  try {
    const promo = await PromoCode.findOne({ code: req.params.code.toUpperCase(), active: true });
    if (!promo) {
      return res.status(404).json({ message: 'Invalid or expired promo code' });
    }
    return res.json({ code: promo.code, discountPercent: promo.discountPercent });
  } catch (error) {
    next(error);
  }
});

router.use(authenticate, requireAdmin);

// List all promo codes
router.get('/', async (req, res, next) => {
  try {
    const codes = await PromoCode.find({}).sort({ createdAt: -1 });
    return res.json({ codes });
  } catch (error) {
    next(error);
  }
});

// Create a promo code
router.post('/', async (req, res, next) => {
  try {
    const { code, discountPercent } = req.body;
    if (!code || discountPercent == null) {
      return res.status(400).json({ message: 'code and discountPercent are required' });
    }

    const promo = await PromoCode.create({
      code: code.toUpperCase(),
      discountPercent: Math.min(100, Math.max(0, Number(discountPercent)))
    });

    return res.status(201).json({ promo });
  } catch (error) {
    next(error);
  }
});

// Toggle active status
router.patch('/:id', async (req, res, next) => {
  try {
    const promo = await PromoCode.findById(req.params.id);
    if (!promo) {
      return res.status(404).json({ message: 'Promo code not found' });
    }

    promo.active = !promo.active;
    await promo.save();

    return res.json({ promo });
  } catch (error) {
    next(error);
  }
});

// Delete promo code
router.delete('/:id', async (req, res, next) => {
  try {
    await PromoCode.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Promo code deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
