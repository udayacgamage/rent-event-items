import { useCallback, useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const tileClassName = (bookedRanges) => ({ date, view }) => {
  if (view !== 'month') return null;
  const isBooked = bookedRanges.some((range) => date >= new Date(range.from) && date <= new Date(range.to));
  return isBooked ? 'booked-date' : null;
};

const StarRating = ({ rating, onRate, interactive = false }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        disabled={!interactive}
        onClick={() => interactive && onRate(star)}
        className={`text-lg ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition ${star <= rating ? 'text-amber-400' : 'text-slate-300'}`}
      >
        ★
      </button>
    ))}
  </div>
);

const ItemModal = ({ item, onClose }) => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [calendar, setCalendar] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [availRes, reviewRes] = await Promise.all([
          api.get(`/items/${item._id}/availability`),
          api.get(`/reviews/${item._id}`)
        ]);
        setCalendar(availRes.data.calendar || []);
        setReviews(reviewRes.data.reviews || []);
      } catch {
        // silent fail
      }
    };
    fetchData();
  }, [item._id]);

  // Close on Escape key
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const handleAddToCart = () => {
    addToCart({ itemId: item._id, name: item.name, price: item.rentalPrice, quantity });
    toast.success(`${item.name} added to cart`);
    onClose();
  };

  const submitReview = async () => {
    if (!newRating) return;
    setSubmitting(true);
    try {
      await api.post('/reviews', { itemId: item._id, rating: newRating, comment: newComment });
      const res = await api.get(`/reviews/${item._id}`);
      setReviews(res.data.reviews || []);
      setNewRating(0);
      setNewComment('');
      toast.success('Review submitted!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">{item.name}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <img
          src={item.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200'}
          alt={item.name}
          className="h-72 w-full rounded-xl object-cover"
        />

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="space-y-3 text-sm text-slate-600">
            <p>{item.description}</p>
            <p><span className="font-semibold text-slate-900">Category:</span> <span className="capitalize">{item.category}</span></p>
            <p><span className="font-semibold text-slate-900">Dimensions:</span> {item.dimensions || 'Standard'}</p>
            <p><span className="font-semibold text-slate-900">Material:</span> {item.material || 'Mixed'}</p>
            <p><span className="font-semibold text-slate-900">Price:</span> <span className="text-amber-600 font-semibold">${item.rentalPrice}/day</span></p>
            <p><span className="font-semibold text-slate-900">Available:</span> {item.availableStock} units</p>
            <div className="flex items-center gap-2">
              <StarRating rating={item.averageRating || 0} />
              <span className="text-xs text-slate-500">({item.reviewsCount || 0} reviews)</span>
            </div>

            {/* Add to cart from modal */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="number"
                min={1}
                max={item.availableStock}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={item.availableStock < 1}
                className="flex-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 transition"
              >
                Add to Cart
              </button>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Availability Calendar</h3>
            <Calendar tileClassName={tileClassName(calendar)} />
          </div>
        </div>

        {/* Reviews section */}
        <div className="mt-6 border-t border-slate-200 pt-5">
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Reviews</h3>

          {user ? (
            <div className="mb-4 rounded-lg border border-slate-200 p-3">
              <p className="mb-2 text-sm font-medium text-slate-700">Leave a review</p>
              <StarRating rating={newRating} onRate={setNewRating} interactive />
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your experience..."
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                rows={2}
              />
              <button
                type="button"
                onClick={submitReview}
                disabled={!newRating || submitting}
                className="mt-2 rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50 transition"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          ) : null}

          {reviews.length === 0 ? (
            <p className="text-sm text-slate-400">No reviews yet. Be the first!</p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {reviews.map((review) => (
                <div key={review._id} className="rounded-lg border border-slate-100 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900">{review.userName}</span>
                    <StarRating rating={review.rating} />
                  </div>
                  {review.comment ? <p className="mt-1 text-sm text-slate-600">{review.comment}</p> : null}
                  <p className="mt-1 text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemModal;
