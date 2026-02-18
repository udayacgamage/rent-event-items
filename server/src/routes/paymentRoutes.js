import { Router } from 'express';
import crypto from 'crypto';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * PayHere Payment Gateway Integration
 * ────────────────────────────────────
 * Flow:
 *  1. Client requests a payment hash from POST /api/payhere/hash
 *  2. Client opens PayHere checkout with the hash
 *  3. PayHere posts to POST /api/payhere/notify on payment completion
 *  4. Client redirects to /api/payhere/return or /api/payhere/cancel
 */

const generatePayHereHash = ({ merchantId, orderId, amount, currency, merchantSecret }) => {
  // PayHere hash: md5(merchant_id + order_id + amount_formatted + currency + md5(merchant_secret))
  const amountFormatted = parseFloat(amount).toFixed(2);
  const secretHash = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
  const raw = merchantId + orderId + amountFormatted + currency + secretHash;
  return crypto.createHash('md5').update(raw).digest('hex').toUpperCase();
};

// ---------- Generate Payment Hash ----------
router.post('/hash', authenticate, async (req, res, next) => {
  try {
    const { orderId, amount, currency = 'LKR' } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ message: 'orderId and amount are required' });
    }

    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

    if (!merchantId || !merchantSecret) {
      return res.status(500).json({ message: 'PayHere merchant credentials not configured' });
    }

    const hash = generatePayHereHash({ merchantId, orderId, amount, currency, merchantSecret });

    return res.json({
      merchant_id: merchantId,
      order_id: orderId,
      amount: parseFloat(amount).toFixed(2),
      currency,
      hash
    });
  } catch (error) {
    next(error);
  }
});

// ---------- PayHere Server Notification (notify_url) ----------
// PayHere POSTs here after payment is completed/failed
router.post('/notify', async (req, res, next) => {
  try {
    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig
    } = req.body;

    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

    // Verify the notification hash
    const secretHash = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
    const localSig = crypto
      .createHash('md5')
      .update(
        merchant_id +
        order_id +
        payhere_amount +
        payhere_currency +
        status_code +
        secretHash
      )
      .digest('hex')
      .toUpperCase();

    if (localSig !== md5sig?.toUpperCase()) {
      console.error('[PayHere] Invalid notification signature for order:', order_id);
      return res.status(400).json({ message: 'Invalid signature' });
    }

    // status_code: 2 = success, 0 = pending, -1 = canceled, -2 = failed, -3 = chargeback
    const booking = await Booking.findOne({ orderId: order_id });
    if (!booking) {
      console.error('[PayHere] Booking not found for order:', order_id);
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (Number(status_code) === 2) {
      booking.paymentStatus = 'paid';
      // Credit totalSpending only when payment is confirmed
      if (booking.customer) {
        await User.findByIdAndUpdate(booking.customer, { $inc: { totalSpending: booking.total } });
      }
    } else if (Number(status_code) === 0) {
      booking.paymentStatus = 'pending';
    } else {
      booking.paymentStatus = 'failed';
    }

    await booking.save();
    console.log(`[PayHere] Order ${order_id} payment status → ${booking.paymentStatus}`);

    return res.json({ message: 'Notification processed' });
  } catch (error) {
    next(error);
  }
});

// ---------- Return URL (user redirected here after payment) ----------
router.get('/return', (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const orderId = req.query.order_id || '';
  return res.redirect(`${clientUrl}/confirmation/${orderId}`);
});

// ---------- Cancel URL ----------
router.get('/cancel', (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  return res.redirect(`${clientUrl}/cart?payment=cancelled`);
});

export default router;
