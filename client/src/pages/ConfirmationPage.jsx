import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

const ConfirmationPage = () => {
  const { orderId } = useParams();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await api.get(`/bookings/${orderId}`);
        setBooking(res.data.booking || res.data);
      } catch {
        /* booking fetch is optional — page still shows orderId */
      }
    };
    fetchBooking();
  }, [orderId]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-semibold text-green-800">Payment Successful</h1>
        <p className="mt-2 text-green-700">Your booking has been confirmed.</p>
        <p className="mt-4 text-sm font-medium text-green-900">Order ID: {orderId}</p>
      </div>

      {booking ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Order Summary</h2>
          <div className="divide-y divide-slate-100 text-sm">
            {booking.items?.map((item) => (
              <div key={item.name} className="flex justify-between py-2">
                <span className="text-slate-700">{item.name} &times; {item.quantity}</span>
                <span className="font-medium text-slate-900">{fmt((item.unitPrice || item.price) * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t pt-3 text-sm font-semibold text-slate-900">
            <span>Total</span>
            <span>{fmt(booking.total)}</span>
          </div>
          <p className="text-xs text-slate-500">
            Event Date: {new Date(booking.eventDate).toLocaleDateString()} · Return: {new Date(booking.returnDate).toLocaleDateString()}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/dashboard" className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-600">
          View Dashboard
        </Link>
        <Link to="/catalog" className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default ConfirmationPage;
