import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
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

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [editingProfile, setEditingProfile] = useState(false);
  const [tab, setTab] = useState('upcoming');

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || '', phone: user.phone || '' });
    }
  }, [user]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await api.get('/bookings/my');
        setBookings(response.data.bookings || []);
      } catch {
        setError('Failed to load your bookings.');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const upcoming = useMemo(
    () => bookings.filter((e) => e.bookingStatus === 'confirmed' && new Date(e.eventDate) >= new Date()),
    [bookings]
  );

  const past = useMemo(
    () => bookings.filter((e) => e.bookingStatus !== 'confirmed' || new Date(e.eventDate) < new Date()),
    [bookings]
  );

  const cancelBooking = async (bookingId) => {
    try {
      await api.patch(`/bookings/${bookingId}/cancel`);
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, bookingStatus: 'cancelled' } : b))
      );
      toast.success('Booking cancelled successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const saveProfile = async () => {
    try {
      await api.patch('/auth/profile', profileForm);
      toast.success('Profile updated');
      setEditingProfile(false);
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const displayBookings = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold text-slate-900">My Dashboard</h1>
        <p className="text-sm text-slate-600">Manage your profile, orders, and rental history.</p>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </section>

      {/* Profile Section */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
          <button type="button" onClick={() => setEditingProfile(!editingProfile)} className="text-sm text-amber-600 hover:text-amber-700">
            {editingProfile ? 'Cancel' : 'Edit'}
          </button>
        </div>
        {editingProfile ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
              <input type="text" value={profileForm.name} onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
              <input type="text" value={profileForm.phone} onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <button type="button" onClick={saveProfile} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600">
              Save Changes
            </button>
          </div>
        ) : (
          <div className="grid gap-1 text-sm text-slate-600">
            <p><span className="font-medium text-slate-900">Name:</span> {user?.name}</p>
            <p><span className="font-medium text-slate-900">Email:</span> {user?.email}</p>
            <p><span className="font-medium text-slate-900">Phone:</span> {user?.phone || 'Not set'}</p>
            <p><span className="font-medium text-slate-900">Total Spending:</span> ${user?.totalSpending || 0}</p>
          </div>
        )}
      </section>

      {/* Orders */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-4 mb-4">
          <button type="button" onClick={() => setTab('upcoming')} className={`text-sm font-medium pb-1 border-b-2 transition ${tab === 'upcoming' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            Upcoming ({upcoming.length})
          </button>
          <button type="button" onClick={() => setTab('history')} className={`text-sm font-medium pb-1 border-b-2 transition ${tab === 'history' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            History ({past.length})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
          </div>
        ) : displayBookings.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-slate-500">{tab === 'upcoming' ? 'No upcoming orders' : 'No past orders'}</p>
            <button type="button" onClick={() => navigate('/catalog')} className="mt-2 text-sm text-amber-600 hover:text-amber-700">Browse Catalog →</button>
          </div>
        ) : (
          <div className="space-y-3">
            {displayBookings.map((booking) => (
              <article key={booking._id} className="rounded-lg border border-slate-200 p-4 text-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{booking.orderId}</p>
                    <p className="mt-1 text-slate-600">{booking.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}</p>
                  </div>
                  <span className="font-semibold text-amber-700">${booking.total}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[booking.bookingStatus] || 'bg-slate-100 text-slate-700'}`}>{booking.bookingStatus}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[booking.trackingStatus] || 'bg-slate-100 text-slate-700'}`}>{booking.trackingStatus}</span>
                  <span className="text-xs text-slate-400">Event: {new Date(booking.eventDate).toLocaleDateString()} · Return: {new Date(booking.returnDate).toLocaleDateString()}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  {booking.bookingStatus === 'confirmed' ? (
                    <button type="button" onClick={() => cancelBooking(booking._id)} className="rounded-lg border border-red-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50 transition">Cancel Booking</button>
                  ) : null}
                  <button type="button" onClick={() => navigate('/catalog')} className="rounded-lg bg-slate-900 px-3 py-1 text-xs text-white hover:bg-slate-700 transition">Rebook</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
