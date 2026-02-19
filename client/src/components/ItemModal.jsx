import { useCallback, useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import ShareButton from './ShareButton';

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

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200';

// ---------- Image Gallery ----------
const ImageGallery = ({ images, name }) => {
  const imgList = images?.length ? images : [PLACEHOLDER_IMG];
  const [activeIdx, setActiveIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const prev = () => setActiveIdx((i) => (i === 0 ? imgList.length - 1 : i - 1));
  const next = () => setActiveIdx((i) => (i === imgList.length - 1 ? 0 : i + 1));

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="group relative overflow-hidden rounded-xl bg-slate-100">
        <img
          src={imgList[activeIdx]}
          alt={`${name} - ${activeIdx + 1}`}
          onClick={() => setZoomed(true)}
          className="h-72 w-full cursor-zoom-in object-cover transition duration-300 group-hover:scale-[1.02]"
        />

        {/* Navigation arrows (only if multiple images) */}
        {imgList.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-slate-700 shadow-md backdrop-blur transition hover:bg-white"
              aria-label="Previous image"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-slate-700 shadow-md backdrop-blur transition hover:bg-white"
              aria-label="Next image"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        )}

        {/* Image counter badge */}
        {imgList.length > 1 && (
          <div className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur">
            {activeIdx + 1} / {imgList.length}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {imgList.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {imgList.map((src, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={`flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${idx === activeIdx ? 'border-amber-500 ring-1 ring-amber-500/30' : 'border-transparent opacity-60 hover:opacity-100'}`}
            >
              <img
                src={src}
                alt={`${name} thumbnail ${idx + 1}`}
                className="h-16 w-16 object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen zoom overlay */}
      {zoomed && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoomed(false)}
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white transition hover:bg-white/40"
            aria-label="Close zoom"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          {imgList.length > 1 && (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white transition hover:bg-white/40" aria-label="Previous">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white transition hover:bg-white/40" aria-label="Next">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
          )}

          <img
            src={imgList[activeIdx]}
            alt={`${name} full - ${activeIdx + 1}`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
          />

          {imgList.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
              {activeIdx + 1} / {imgList.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ItemModal = ({ item, onClose }) => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [calendar, setCalendar] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingReview, setEditingReview] = useState(null); // { _id, rating, comment }
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'availability' | 'reviews'

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
      if (editingReview) {
        await api.patch(`/reviews/${editingReview._id}`, { rating: newRating, comment: newComment });
        toast.success('Review updated!');
        setEditingReview(null);
      } else {
        await api.post('/reviews', { itemId: item._id, rating: newRating, comment: newComment });
        toast.success('Review submitted!');
      }
      const res = await api.get(`/reviews/${item._id}`);
      setReviews(res.data.reviews || []);
      setNewRating(0);
      setNewComment('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await api.delete(`/reviews/${reviewId}`);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      toast.success('Review deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete review');
    }
  };

  const startEditReview = (review) => {
    setEditingReview(review);
    setNewRating(review.rating);
    setNewComment(review.comment || '');
    setActiveTab('reviews');
  };

  const cancelEdit = () => {
    setEditingReview(null);
    setNewRating(0);
    setNewComment('');
  };

  const tabs = [
    { key: 'details', label: 'Details' },
    { key: 'availability', label: 'Availability' },
    { key: 'reviews', label: `Reviews (${reviews.length})` }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl animate-in fade-in">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">{item.name}</h2>
            <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
              <span className="capitalize">{item.category}</span>
              <span>•</span>
              <div className="flex items-center gap-1 text-amber-500">
                <StarRating rating={item.averageRating || 0} />
                <span className="text-slate-400">({item.reviewsCount || 0})</span>
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 pb-2 flex justify-end">
          <ShareButton item={item} />
        </div>

        <div className="p-6">
          {/* Image Gallery + Price Card */}
          <div className="grid gap-6 md:grid-cols-[1fr_280px]">
            <ImageGallery images={item.images} name={item.name} />

            {/* Price & Add-to-Cart card */}
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div>
                <p className="text-sm text-slate-500">Rental Price</p>
                <p className="text-3xl font-bold text-amber-600">${item.rentalPrice}<span className="text-base font-normal text-slate-400">/day</span></p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Availability</span>
                  <span className={`font-medium ${item.availableStock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {item.availableStock > 0 ? `${item.availableStock} in stock` : 'Out of stock'}
                  </span>
                </div>
                {item.dimensions && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dimensions</span>
                    <span className="font-medium text-slate-700">{item.dimensions}</span>
                  </div>
                )}
                {item.material && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Material</span>
                    <span className="font-medium text-slate-700">{item.material}</span>
                  </div>
                )}
              </div>
              <div className="border-t border-slate-200 pt-4">
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Quantity</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100">−</button>
                  <input
                    type="number"
                    min={1}
                    max={item.availableStock}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-16 rounded-lg border border-slate-300 px-2 py-1.5 text-center text-sm"
                  />
                  <button type="button" onClick={() => setQuantity((q) => Math.min(item.availableStock, q + 1))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100">+</button>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={item.availableStock < 1}
                className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
              >
                {item.availableStock < 1 ? 'Out of Stock' : `Add to Cart · $${item.rentalPrice * quantity}`}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 border-b border-slate-200">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2.5 text-sm font-medium transition ${activeTab === tab.key ? 'border-b-2 border-amber-500 text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-5">
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-900">Description</h3>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{item.description || 'No description available.'}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs font-medium text-slate-400 uppercase">Category</p>
                    <p className="mt-1 text-sm font-medium capitalize text-slate-800">{item.category}</p>
                  </div>
                  {item.dimensions && (
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs font-medium text-slate-400 uppercase">Dimensions</p>
                      <p className="mt-1 text-sm font-medium text-slate-800">{item.dimensions}</p>
                    </div>
                  )}
                  {item.material && (
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs font-medium text-slate-400 uppercase">Material</p>
                      <p className="mt-1 text-sm font-medium text-slate-800">{item.material}</p>
                    </div>
                  )}
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs font-medium text-slate-400 uppercase">Total Stock</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">{item.stockQuantity} units</p>
                  </div>
                </div>
              </div>
            )}

            {/* Availability Tab */}
            {activeTab === 'availability' && (
              <div>
                <p className="mb-3 text-sm text-slate-500">Red dates are booked. Select your event dates to check availability.</p>
                <Calendar tileClassName={tileClassName(calendar)} />
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div>
                {user ? (
                  <div className="mb-5 rounded-lg border border-slate-200 p-4">
                    <p className="mb-2 text-sm font-medium text-slate-700">
                      {editingReview ? 'Edit your review' : 'Leave a review'}
                    </p>
                    <StarRating rating={newRating} onRate={setNewRating} interactive />
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your experience..."
                      className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      rows={2}
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={submitReview}
                        disabled={!newRating || submitting}
                        className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50 transition"
                      >
                        {submitting ? 'Submitting...' : editingReview ? 'Update Review' : 'Submit Review'}
                      </button>
                      {editingReview && (
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ) : null}

                {reviews.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">No reviews yet. Be the first!</p>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto">
                    {reviews.map((review) => (
                      <div key={review._id} className="rounded-lg border border-slate-100 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-900">{review.userName}</span>
                          <div className="flex items-center gap-2">
                            <StarRating rating={review.rating} />
                            {user && review.userId === user._id && (
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => startEditReview(review)}
                                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-amber-600 transition"
                                  title="Edit review"
                                >
                                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteReview(review._id)}
                                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                                  title="Delete review"
                                >
                                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {review.comment ? <p className="mt-1 text-sm text-slate-600">{review.comment}</p> : null}
                        <p className="mt-1 text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemModal;
