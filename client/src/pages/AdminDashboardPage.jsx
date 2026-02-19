import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

const CATEGORIES = ['marquee', 'canopy', 'stage-setup', 'floral-design', 'lighting', 'catering'];

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
  const [analytics, setAnalytics] = useState(null);
  const [items, setItems] = useState([]);
  const [itemForm, setItemForm] = useState({ name: '', description: '', category: 'marquee', rentalPrice: '', stockQuantity: '', dimensions: '', material: '' });
  const [editingItem, setEditingItem] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [newPromo, setNewPromo] = useState({ code: '', discountPercent: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const [inventoryRes, bookingsRes, customersRes, financeRes, promoRes, analyticsRes, itemsRes] = await Promise.all([
          api.get('/admin/inventory-summary'),
          api.get('/admin/bookings'),
          api.get('/admin/customers'),
          api.get('/finance/dashboard'),
          api.get('/promo-codes'),
          api.get('/finance/analytics'),
          api.get('/items?limit=200')
        ]);

        setInventory(inventoryRes.data);
        setBookings(bookingsRes.data.bookings || []);
        setCustomers(customersRes.data.customers || []);
        setFinance(financeRes.data);
        setPromoCodes(promoRes.data.codes || []);
        setAnalytics(analyticsRes.data);
        setItems(itemsRes.data.items || []);
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

  const saveItem = async () => {
    try {
      if (editingItem) {
        const res = await api.patch(`/items/${editingItem._id}`, itemForm);
        setItems((prev) => prev.map((i) => (i._id === editingItem._id ? res.data.item : i)));
        toast.success('Item updated');
      } else {
        const res = await api.post('/items', itemForm);
        setItems((prev) => [res.data.item, ...prev]);
        toast.success('Item created');
      }
      setItemForm({ name: '', description: '', category: 'marquee', rentalPrice: '', stockQuantity: '', dimensions: '', material: '' });
      setEditingItem(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save item');
    }
  };

  const startEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description,
      category: item.category,
      rentalPrice: item.rentalPrice,
      stockQuantity: item.stockQuantity,
      dimensions: item.dimensions || '',
      material: item.material || ''
    });
    setActiveTab('items');
  };

  const disableItem = async (id) => {
    try {
      await api.delete(`/items/${id}`);
      setItems((prev) => prev.map((i) => (i._id === id ? { ...i, disabled: true } : i)));
      toast.success('Item disabled');
    } catch {
      toast.error('Failed to disable item');
    }
  };

  const handleImageUpload = async (itemId, files) => {
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append('images', f));
      const res = await api.post(`/items/${itemId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setItems((prev) => prev.map((i) => (i._id === itemId ? { ...i, images: res.data.images } : i)));
      toast.success('Images uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Image upload failed');
    } finally {
      setUploadingImages(false);
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
    { key: 'analytics', label: 'Analytics' },
    { key: 'items', label: `Items (${items.length})` },
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
              <p className="text-2xl font-semibold text-green-600">Rs. {finance.totalRevenue?.toLocaleString()}</p>
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

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics ? (
        <div className="space-y-6">
          {/* Monthly Revenue Bar Chart */}
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Monthly Revenue (Last 12 Months)</h2>
            <div className="flex items-end gap-2" style={{ height: 200 }}>
              {analytics.monthlyRevenue.map((m) => {
                const maxRev = Math.max(...analytics.monthlyRevenue.map((r) => r.revenue), 1);
                const h = (m.revenue / maxRev) * 100;
                return (
                  <div key={m.label} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] font-medium text-slate-500">
                      {m.revenue > 0 ? `Rs.${(m.revenue / 1000).toFixed(0)}k` : ''}
                    </span>
                    <div
                      className="w-full rounded-t-md bg-amber-500 transition-all hover:bg-amber-600"
                      style={{ height: `${Math.max(h, 2)}%` }}
                      title={`${m.label}: Rs. ${m.revenue.toLocaleString()}`}
                    />
                    <span className="text-[10px] text-slate-400">{m.label}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Booking Status Breakdown */}
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Booking Status</h2>
              <div className="space-y-3">
                {Object.entries(analytics.statusCounts).map(([status, count]) => {
                  const total = Object.values(analytics.statusCounts).reduce((s, c) => s + c, 0);
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize text-slate-700">{status}</span>
                        <span className="text-slate-500">{count} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all ${status === 'confirmed' ? 'bg-green-500' : status === 'cancelled' ? 'bg-red-500' : 'bg-slate-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Top Items */}
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Most Rented Items</h2>
              <div className="space-y-3">
                {analytics.topCategories.map((item, i) => {
                  const maxCount = analytics.topCategories[0]?.count || 1;
                  const pct = (item.count / maxCount) * 100;
                  return (
                    <div key={item.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-700">{i + 1}. {item.name}</span>
                        <span className="text-slate-500">{item.count} rentals</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {analytics.topCategories.length === 0 && (
                  <p className="text-sm text-slate-400">No data yet</p>
                )}
              </div>
            </section>
          </div>
        </div>
      ) : null}

      {/* Items Tab */}
      {activeTab === 'items' ? (
        <div className="space-y-4">
          {/* Item Form */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Name*</label>
                <input type="text" value={itemForm.name} onChange={(e) => setItemForm((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Category*</label>
                <select value={itemForm.category} onChange={(e) => setItemForm((p) => ({ ...p, category: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Price/Day (Rs.)*</label>
                <input type="number" min={0} value={itemForm.rentalPrice} onChange={(e) => setItemForm((p) => ({ ...p, rentalPrice: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Stock Quantity*</label>
                <input type="number" min={0} value={itemForm.stockQuantity} onChange={(e) => setItemForm((p) => ({ ...p, stockQuantity: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Dimensions</label>
                <input type="text" value={itemForm.dimensions} onChange={(e) => setItemForm((p) => ({ ...p, dimensions: e.target.value }))} placeholder="e.g. 10m × 5m" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Material</label>
                <input type="text" value={itemForm.material} onChange={(e) => setItemForm((p) => ({ ...p, material: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">Description*</label>
                <textarea value={itemForm.description} onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))} rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={saveItem} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600">{editingItem ? 'Update Item' : 'Create Item'}</button>
              {editingItem && (
                <button type="button" onClick={() => { setEditingItem(null); setItemForm({ name: '', description: '', category: 'marquee', rentalPrice: '', stockQuantity: '', dimensions: '', material: '' }); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
              )}
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item._id} className={`rounded-xl border bg-white p-4 ${item.disabled ? 'opacity-50 border-red-200' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    {item.images?.[0] && (
                      <img src={item.images[0]} alt={item.name} className="h-16 w-16 rounded-lg object-cover" />
                    )}
                    <div>
                      <p className="font-semibold text-slate-900">{item.name} {item.disabled && <span className="text-xs text-red-500">(disabled)</span>}</p>
                      <p className="text-xs text-slate-500 capitalize">{item.category} · Rs. {item.rentalPrice}/day · Stock: {item.stockQuantity}</p>
                      <p className="mt-1 text-xs text-slate-400 line-clamp-1">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button type="button" onClick={() => startEditItem(item)} className="rounded border border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100">Edit</button>
                    {!item.disabled && (
                      <button type="button" onClick={() => disableItem(item._id)} className="rounded border border-red-300 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50">Disable</button>
                    )}
                  </div>
                </div>
                {/* Image Upload */}
                <div className="mt-3 flex items-center gap-2">
                  <label className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500 cursor-pointer hover:bg-slate-50 transition">
                    {uploadingImages ? 'Uploading...' : 'Upload Images'}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={uploadingImages}
                      onChange={(e) => handleImageUpload(item._id, e.target.files)}
                    />
                  </label>
                  {item.images?.length > 0 && (
                    <div className="flex gap-1">
                      {item.images.slice(0, 4).map((img, idx) => (
                        <img key={idx} src={img} alt="" className="h-8 w-8 rounded object-cover" />
                      ))}
                      {item.images.length > 4 && <span className="text-xs text-slate-400">+{item.images.length - 4}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
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
                  <span className="font-semibold text-amber-700">Rs. {booking.total?.toLocaleString()}</span>
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
                  <td className="px-4 py-3 text-right font-medium text-amber-700">Rs. {customer.totalSpending?.toLocaleString()}</td>
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
