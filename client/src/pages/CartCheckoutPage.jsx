import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckoutSteps from '../components/CheckoutSteps';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import api from '../services/api';

const CartCheckoutPage = () => {
  const navigate = useNavigate();
  const { user, register } = useAuth();
  const { items, total, updateQuantity, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
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

  const validateForm = () => {
    if (!form.name || !form.email || !form.eventDate || !form.returnDate) {
      return 'Please fill in all required fields (name, email, event date, return date).';
    }
    return null;
  };

  const placeOrder = async () => {
    const validationError = validateForm();
    if (validationError) {
      setOrderError(validationError);
      return;
    }
    setOrderError('');
    setPlacing(true);

    try {
      if (!user) {
        await register({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password || 'Temporary123!'
        });
      }

      await api.post('/bookings/payment-intent', { amount: total });

      const response = await api.post('/bookings', {
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone,
        eventDate: form.eventDate,
        returnDate: form.returnDate,
        deliveryPreference: form.deliveryPreference,
        address: form.address,
        promoCode: form.promoCode,
        paymentStatus: 'paid',
        cartItems: items
      });

      clearCart();
      navigate(`/confirmation/${response.data.booking.orderId}`);
    } catch (error) {
      setOrderError(error.response?.data?.message || 'Something went wrong placing your order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="mb-2 text-2xl font-semibold text-slate-900">Cart & Checkout</h1>
        <CheckoutSteps step={step} />

        {step === 1 ? (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.itemId} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <div>
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-500">${item.price} each</p>
                </div>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(event) => updateQuantity(item.itemId, Number(event.target.value))}
                  className="w-20 rounded-lg border border-slate-300 px-2 py-1"
                />
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

        {step === 2 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {['name', 'email', 'phone', 'eventDate', 'returnDate', 'address', 'promoCode', 'password'].map((field) => (
              <input
                key={field}
                type={field.includes('Date') ? 'date' : field === 'password' ? 'password' : 'text'}
                placeholder={field}
                value={form[field]}
                onChange={(event) => setForm((previous) => ({ ...previous, [field]: event.target.value }))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            ))}
            <select
              value={form.deliveryPreference}
              onChange={(event) => setForm((previous) => ({ ...previous, deliveryPreference: event.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="delivery">Delivery</option>
              <option value="pickup">Pickup</option>
            </select>
            <div className="sm:col-span-2 flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">
                Back
              </button>
              <button type="button" onClick={() => { const err = validateForm(); if (err) { setOrderError(err); return; } setOrderError(''); setStep(3); }} className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">
                Continue to Payment
              </button>
              {orderError ? <p className="sm:col-span-2 text-sm text-red-600">{orderError}</p> : null}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">Stripe/PayPal integration is wired via backend payment intent. Click below to finalize this demo payment flow.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(2)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">
                Back
              </button>
              <button type="button" disabled={placing} onClick={placeOrder} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {placing ? 'Processing…' : 'Pay & Confirm'}
              </button>
              {orderError ? <p className="text-sm text-red-600">{orderError}</p> : null}
            </div>
          </div>
        ) : null}
      </section>

      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Cart Summary</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          {items.map((item) => (
            <li key={item.itemId} className="flex justify-between">
              <span>
                {item.name} x {item.quantity}
              </span>
              <span>${item.price * item.quantity}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">Total: ${total}</div>
      </aside>
    </div>
  );
};

export default CartCheckoutPage;
