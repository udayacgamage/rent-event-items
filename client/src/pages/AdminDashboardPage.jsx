import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

const statusColors = {
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  returned: 'bg-slate-100 text-slate-800',
  processing: 'bg-blue-100 text-blue-800',
  'out-for-delivery': 'bg-amber-100 text-amber-800',
  delivered: 'bg-green-100 text-green-800',
  'picked-up': 'bg-purple-100 text-purple-800'
};

const AdminDashboardPage = () => {
  const [inventory, setInventory] = useState({ totalStock: 0, rentedStock: 0, pendingRepairs: 0 });
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [finance, setFinance] = useState({ totalRevenue: 0, totalBookings: 0, topItems: [] });
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [newPromo, setNewPromo] = useState({ code: '', discountPercent: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const [inventoryRes, bookingsRes, customersRes, financeRes, promoRes] = await Promise.all([
          api.get('/admin/inventory-summary'),
          api.get('/admin/bookings'),
          api.get('/admin/customers'),
          api.get('/finance/dashboard'),
          api.get('/promo-codes')
        ]);

        setInventory(inventoryRes.data);
        setBookings(bookingsRes.data.bookings || []);
        setCustomers(customersRes.data.customers || []);
        setFinance(financeRes.data);
        setPromoCodes(promoRes.data.codes || []);
      } catch {
        setError('Failed to load dashboard data. Make sure you are logged in as admin.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateBookingStatus = async (bookingId, field, value) => {
    try {
      const res = await api.patch(`/admin/bookings/${bookingId}`, { [field]: value });
      setBookings((prev) => prev.map((b) => (b._id === bookingId ? res.data.booking : b)));
      toast.success('Booking updated');
    } catch {
      toast.error('Failed to update booking');
    }
  };

  const createPromo = async () => {
    if (!newPromo.code || !newPromo.discountPercent) return;
    try {
      const res = await api.post('/promo-codes', newPromo);
      setPromoCodes((prev) => [res.data.promo, ...prev]);
      setNewPromo({ code: '', discountPercent: '' });
      toast.success('Promo code created');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create promo code');
    }
  };

  const togglePromo = async (id) => {
    try {
      const res = await api.patch(`/promo-codes/${id}`);
      setPromoCodes((prev) => prev.map((p) => (p._id === id ? res.data.promo : p)));
    } catch {
      toast.error('Failed to toggle promo code');
    }
  };

  const deletePromo = async (id) => {
    try {
      await api.delete(`/promo-codes/${id}`);
      setPromoCodes((prev) => prev.filter((p) => p._id !== id));
      toast.success('Promo code deleted');
    } catch {
      toast.error('Failed to delete promo code');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'bookings', label: `Bookings (${bookings.length})` },
    { key: 'customers', label: `Customers (${customers.length})` },
    { key: 'promos', label: 'Promo Codes' }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${activeTab === tab.key ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' ? (
        <div className="space-y-6">
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Total Stock</p>
              <p className="text-2xl font-semibold text-slate-900">{inventory.totalStock}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Currently Rented</p>
              <p className="text-2xl font-semibold text-amber-600">{inventory.rentedStock}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Pending Repairs</p>
              <p className="text-2xl font-semibold text-red-600">{inventory.pendingRepairs}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-green-600">${finance.totalRevenue}</p>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Revenue Summary</h2>
              <p className="text-sm text-slate-600">Paid Bookings: {finance.totalBookings}</p>
              <p className="mt-3 text-sm font-medium text-slate-900">Top Performing Items</p>
              {finance.topItems.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {finance.topItems.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">{i + 1}</span>
                      <span className="text-sm text-slate-700">{item.name}</span>
                      <span className="ml-auto text-sm font-medium text-slate-900">{item.quantity} rentals</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-400">No rentals yet</p>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Recent Bookings</h2>
              <div className="space-y-2 text-sm">
                {bookings.slice(0, 5).map((booking) => (
                  <div key={booking._id} className="flex items-center justify-between rounded-lg border border-slate-100 p-2">
                    <div>
                      <span className="font-medium text-slate-900">{booking.orderId}</span>
                      <span className="ml-2 text-slate-500">{booking.customerName}</span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[booking.bookingStatus] || 'bg-slate-100'}`}>
                      {booking.bookingStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {/* Bookings Tab */}
      {activeTab === 'bookings' ? (
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <p className="py-8 text-center text-slate-500">No bookings yet</p>
          ) : (
            bookings.map((booking) => (
              <div key={booking._id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{booking.orderId}</p>
                    <p className="text-sm text-slate-600">{booking.customerName} · {booking.customerEmail}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Event: {new Date(booking.eventDate).toLocaleDateString()} · Return: {new Date(booking.returnDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Items: {booking.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}
                    </p>
                  </div>
                  <span className="font-semibold text-amber-700">${booking.total}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-slate-500">Status:</label>
                    <select
                      value={booking.bookingStatus}
                      onChange={(e) => updateBookingStatus(booking._id, 'bookingStatus', e.target.value)}
                      className="rounded border border-slate-300 px-2 py-1 text-xs"
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="returned">Returned</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-slate-500">Tracking:</label>
                    <select
                      value={booking.trackingStatus}
                      onChange={(e) => updateBookingStatus(booking._id, 'trackingStatus', e.target.value)}
                      className="rounded border border-slate-300 px-2 py-1 text-xs"
                    >
                      <option value="processing">Processing</option>
                      <option value="out-for-delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="picked-up">Picked Up</option>
                      <option value="returned">Returned</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-slate-500">Payment:</label>
                    <select
                      value={booking.paymentStatus}
                      onChange={(e) => updateBookingStatus(booking._id, 'paymentStatus', e.target.value)}
                      className="rounded border border-slate-300 px-2 py-1 text-xs"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {/* Customers Tab */}
      {activeTab === 'customers' ? (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Phone</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Spending</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((customer) => (
                <tr key={customer._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{customer.name}</td>
                  <td className="px-4 py-3 text-slate-600">{customer.email}</td>
                  <td className="px-4 py-3 text-slate-600">{customer.phone || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-amber-700">${customer.totalSpending}</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(customer.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {customers.length === 0 ? <p className="py-8 text-center text-slate-500">No customers yet</p> : null}
        </div>
      ) : null}

      {/* Promo Codes Tab */}
      {activeTab === 'promos' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Code</label>
              <input
                type="text"
                value={newPromo.code}
                onChange={(e) => setNewPromo((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. SAVE20"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Discount %</label>
              <input
                type="number"
                min={1}
                max={100}
                value={newPromo.discountPercent}
                onChange={(e) => setNewPromo((p) => ({ ...p, discountPercent: e.target.value }))}
                placeholder="10"
                className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <button type="button" onClick={createPromo} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600">
              Create
            </button>
          </div>

          <div className="space-y-2">
            {promoCodes.map((promo) => (
              <div key={promo._id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-slate-100 px-3 py-1 font-mono text-sm font-bold text-slate-900">{promo.code}</span>
                  <span className="text-sm text-amber-600 font-medium">{promo.discountPercent}% off</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${promo.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {promo.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => togglePromo(promo._id)} className="text-xs text-slate-500 hover:text-slate-700">
                    {promo.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button type="button" onClick={() => deletePromo(promo._id)} className="text-xs text-red-500 hover:text-red-700">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminDashboardPage;
