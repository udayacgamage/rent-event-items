import { useMemo, useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import CheckoutSteps from '../components/CheckoutSteps';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import api from '../services/api';

const PAYHERE_SANDBOX = import.meta.env.VITE_PAYHERE_SANDBOX !== 'false'; // default true

const CartCheckoutPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, register } = useAuth();
  const { items, total, updateQuantity, removeFromCart, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
    eventDate: '',
    returnDate: '',
    deliveryPreference: 'delivery',
    address: '',
    promoCode: ''
  });

  const canProceed = useMemo(() => items.length > 0, [items]);
  const [orderError, setOrderError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [promoApplied, setPromoApplied] = useState(null); // { code, discountPercent }
  const [promoChecking, setPromoChecking] = useState(false);

  // Handle payment callback query params
  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'cancelled') {
      toast.error('Payment was cancelled. You can try again.');
      setSearchParams({}, { replace: true });
    } else if (payment === 'failed') {
      toast.error('Payment failed. Please try again or use a different method.');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const discountAmount = promoApplied ? Math.round(total * promoApplied.discountPercent / 100) : 0;
  const finalTotal = total - discountAmount;

  const applyPromo = async () => {
    if (!form.promoCode.trim()) return;
    setPromoChecking(true);
    try {
      const res = await api.get(`/promo-codes/validate/${form.promoCode.toUpperCase()}`);
      setPromoApplied({ code: form.promoCode.toUpperCase(), discountPercent: res.data.discountPercent });
      toast.success(`Promo applied! ${res.data.discountPercent}% off`);
    } catch {
      setPromoApplied(null);
      toast.error('Invalid or expired promo code');
    } finally {
      setPromoChecking(false);
    }
  };

  const validateForm = () => {
    if (!form.name || !form.email || !form.eventDate || !form.returnDate) {
      return 'Please fill in all required fields (name, email, event date, return date).';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return 'Please enter a valid email address.';
    }
    if (!form.phone) {
      return 'Phone number is required for PayHere payment.';
    }
    const today = new Date().toISOString().slice(0, 10);
    if (form.eventDate < today) {
      return 'Event date cannot be in the past.';
    }
    if (form.returnDate <= form.eventDate) {
      return 'Return date must be after the event date.';
    }
    return null;
  };

  const today = new Date().toISOString().slice(0, 10);

  // Load PayHere JS SDK dynamically
  const ensurePayHereSDK = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.payhere) {
        resolve(window.payhere);
        return;
      }
      const script = document.createElement('script');
      script.src = PAYHERE_SANDBOX
        ? 'https://sandbox.payhere.lk/lib/payhere.js'
        : 'https://www.payhere.lk/lib/payhere.js';
      script.onload = () => resolve(window.payhere);
      script.onerror = () => reject(new Error('Failed to load PayHere SDK'));
      document.head.appendChild(script);
    });
  }, []);

  const placeOrder = async () => {
    const validationError = validateForm();
    if (validationError) {
      setOrderError(validationError);
      return;
    }
    setOrderError('');
    setPlacing(true);

    try {
      // 1. Register the user if not logged in
      if (!user) {
        await register({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password || 'Temporary123!'
        });
      }

      // 2. Create the booking with pending payment
      const bookingRes = await api.post('/bookings', {
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone,
        eventDate: form.eventDate,
        returnDate: form.returnDate,
        deliveryPreference: form.deliveryPreference,
        address: form.address,
        promoCode: form.promoCode,
        paymentStatus: 'pending',
        cartItems: items
      });

      const booking = bookingRes.data.booking;

      // 3. Get PayHere hash from the server
      const hashRes = await api.post('/payhere/hash', {
        orderId: booking.orderId,
        amount: booking.total,
        currency: 'LKR'
      });

      // 4. Load PayHere SDK & initiate payment
      const payhere = await ensurePayHereSDK();

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const payment = {
        sandbox: PAYHERE_SANDBOX,
        merchant_id: hashRes.data.merchant_id,
        return_url: `${apiUrl}/payhere/return?order_id=${booking.orderId}`,
        cancel_url: `${apiUrl}/payhere/cancel?order_id=${booking.orderId}`,
        notify_url: `${apiUrl}/payhere/notify`,
        order_id: booking.orderId,
        items: items.map((i) => i.name).join(', '),
        amount: hashRes.data.amount,
        currency: hashRes.data.currency,
        hash: hashRes.data.hash,
        first_name: form.name.split(' ')[0] || form.name,
        last_name: form.name.split(' ').slice(1).join(' ') || '',
        email: form.email,
        phone: form.phone,
        address: form.address || 'N/A',
        city: 'Colombo',
        country: 'Sri Lanka'
      };

      // PayHere event callbacks
      payhere.onCompleted = function onCompleted(orderId) {
        console.log('[PayHere] Payment completed. Order:', orderId);
        clearCart();
        navigate(`/confirmation/${orderId}`);
      };

      payhere.onDismissed = function onDismissed() {
        console.log('[PayHere] Payment dismissed');
        setOrderError('Payment was cancelled. Your order is saved — you can retry payment from your dashboard.');
        setPlacing(false);
      };

      payhere.onError = function onError(error) {
        console.error('[PayHere] Payment error:', error);
        setOrderError('Payment failed. Please try again.');
        setPlacing(false);
      };

      payhere.startPayment(payment);
    } catch (error) {
      setOrderError(error.response?.data?.message || 'Something went wrong placing your order. Please try again.');
      setPlacing(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="mb-2 text-2xl font-semibold text-slate-900">Cart & Checkout</h1>
        <CheckoutSteps step={step} />

        {/* Step 1 – Cart Items */}
        {step === 1 ? (
          <div className="space-y-3">
            {items.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">Your cart is empty.</p>
            )}
            {items.map((item) => (
              <div key={item.itemId} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <div>
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-500">Rs. {item.price?.toLocaleString()} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(event) => updateQuantity(item.itemId, Number(event.target.value))}
                    className="w-20 rounded-lg border border-slate-300 px-2 py-1"
                    aria-label={`Quantity for ${item.name}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.itemId)}
                    className="rounded-lg border border-red-200 p-1.5 text-red-500 hover:bg-red-50 transition"
                    aria-label={`Remove ${item.name}`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              disabled={!canProceed}
              onClick={() => setStep(2)}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        ) : null}

        {/* Step 2 – Details */}
        {step === 2 ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Full Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Phone *</label>
                <input type="tel" placeholder="+94 77 123 4567" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500" />
              </div>
              {!user && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Password</label>
                  <input type="password" placeholder="Create account password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500" />
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Event Date *</label>
                <input type="date" min={today} value={form.eventDate} onChange={(e) => setForm((p) => ({ ...p, eventDate: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Return Date *</label>
                <input type="date" min={form.eventDate || today} value={form.returnDate} onChange={(e) => setForm((p) => ({ ...p, returnDate: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Delivery</label>
                <select value={form.deliveryPreference} onChange={(e) => setForm((p) => ({ ...p, deliveryPreference: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500">
                  <option value="delivery">Delivery</option>
                  <option value="pickup">Pickup</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Promo Code</label>
                <div className="flex gap-2">
                  <input type="text" value={form.promoCode} onChange={(e) => { setForm((p) => ({ ...p, promoCode: e.target.value })); setPromoApplied(null); }} placeholder="e.g. WELCOME10" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500" />
                  <button type="button" disabled={promoChecking || !form.promoCode.trim()} onClick={applyPromo} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50 transition">
                    {promoChecking ? '...' : 'Apply'}
                  </button>
                </div>
                {promoApplied && (
                  <p className="mt-1 text-xs text-green-600">&#10003; {promoApplied.discountPercent}% discount applied (−Rs. {discountAmount.toLocaleString()})</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">Address</label>
                <input type="text" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Back</button>
              <button
                type="button"
                onClick={() => {
                  const err = validateForm();
                  if (err) { setOrderError(err); return; }
                  setOrderError('');
                  setStep(3);
                }}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
              >
                Continue to Payment
              </button>
            </div>
            {orderError ? <p className="text-sm text-red-600">{orderError}</p> : null}
          </div>
        ) : null}

        {/* Step 3 – PayHere Payment */}
        {step === 3 ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-3">
                <svg className="h-8 w-8 text-amber-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-amber-800">Secure Payment via PayHere</h3>
                  <p className="text-sm text-amber-700">Your payment is processed securely through PayHere payment gateway. We never store your card details.</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-medium">Accepted payment methods:</p>
              <ul className="mt-2 grid grid-cols-2 gap-1.5 text-slate-600">
                <li className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-500" /> Visa / Mastercard
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500" /> Lanka QR
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-purple-500" /> Dialog / Mobitel
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-orange-500" /> Bank Transfer
                </li>
              </ul>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(2)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Back</button>
              <button
                type="button"
                disabled={placing}
                onClick={placeOrder}
                className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
              >
                {placing ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Processing…
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                    Pay Rs. {finalTotal.toLocaleString()} with PayHere
                  </>
                )}
              </button>
            </div>
            {orderError ? <p className="mt-2 text-sm text-red-600">{orderError}</p> : null}
          </div>
        ) : null}
      </section>

      {/* Cart Summary Sidebar */}
      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Cart Summary</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          {items.map((item) => (
            <li key={item.itemId} className="flex justify-between">
              <span>{item.name} x {item.quantity}</span>
              <span>Rs. {(item.price * item.quantity).toLocaleString()}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-slate-200 pt-3 space-y-1">
          {promoApplied && (
            <>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>Rs. {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount ({promoApplied.discountPercent}%)</span>
                <span>−Rs. {discountAmount.toLocaleString()}</span>
              </div>
            </>
          )}
          <div className="flex justify-between text-base font-semibold text-slate-900">
            <span>Total</span>
            <span>Rs. {finalTotal.toLocaleString()}</span>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-xs text-green-700">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>
          Secured by PayHere Payment Gateway
        </div>
      </aside>
    </div>
  );
};

export default CartCheckoutPage;
