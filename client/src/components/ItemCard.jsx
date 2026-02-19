import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCompare } from '../contexts/CompareContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const ItemCard = ({ item, onView, onAdd, wishlisted = false }) => {
  const { user } = useAuth();
  const { addToCompare } = useCompare();
  const [inWishlist, setInWishlist] = useState(wishlisted);
  const [wishLoading, setWishLoading] = useState(false);
  const imageCount = item.images?.length || 0;

  const toggleWishlist = async (e) => {
    e.stopPropagation();
    if (!user) { toast.error('Sign in to use wishlists'); return; }
    setWishLoading(true);
    try {
      if (inWishlist) {
        await api.delete(`/wishlist/${item._id}`);
        setInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await api.post(`/wishlist/${item._id}`);
        setInWishlist(true);
        toast.success('Added to wishlist');
      }
    } catch {
      toast.error('Wishlist update failed');
    } finally {
      setWishLoading(false);
    }
  };

  return (
    <article className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <button type="button" onClick={() => onView(item)} className="relative w-full text-left">
        <div className="h-44 overflow-hidden bg-slate-100">
          <img
            src={item.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200'}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        </div>
        {imageCount > 1 && (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white backdrop-blur">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
            {imageCount}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={toggleWishlist}
        disabled={wishLoading}
        className={`absolute top-2 right-2 z-10 rounded-full p-1.5 backdrop-blur transition ${inWishlist ? 'bg-red-500 text-white' : 'bg-white/80 text-slate-400 hover:text-red-500'}`}
        aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <svg className="h-4 w-4" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
      </button>
      <div className="space-y-2 p-4">
        <h3 className="text-base font-semibold text-slate-900">{item.name}</h3>
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 capitalize">{item.category}</p>
          {item.averageRating > 0 ? (
            <div className="flex items-center gap-1 text-xs text-amber-500">
              <span>★ {item.averageRating}</span>
              <span className="text-slate-400">({item.reviewsCount})</span>
            </div>
          ) : null}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-amber-600">Rs. {item.rentalPrice?.toLocaleString()}/day</span>
          <span className="text-xs text-slate-500">{item.availableStock} available</span>
        </div>
        <button
          type="button"
          onClick={() => onAdd(item)}
          disabled={item.availableStock < 1}
          className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 transition"
        >
          {item.availableStock < 1 ? 'Out of Stock' : 'Add to Cart'}
        </button>
        <button
          type="button"
          onClick={() => addToCompare(item)}
          className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Compare
        </button>
      </div>
    </article>
  );
};

export default ItemCard;
