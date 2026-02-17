import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import ItemCard from '../components/ItemCard';
import ItemModal from '../components/ItemModal';
import { useCart } from '../contexts/CartContext';
import api from '../services/api';

const WishlistPage = () => {
  const { addToCart } = useCart();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState(null);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const response = await api.get('/wishlist');
        setItems(response.data.items || []);
      } catch {
        toast.error('Failed to load wishlist');
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, []);

  const removeFromWishlist = async (itemId) => {
    try {
      await api.delete(`/wishlist/${itemId}`);
      setItems((prev) => prev.filter((item) => item._id !== itemId));
      toast.success('Removed from wishlist');
    } catch {
      toast.error('Failed to remove from wishlist');
    }
  };

  const onAdd = (item) => {
    addToCart({ itemId: item._id, name: item.name, price: item.rentalPrice, quantity: 1 });
    toast.success(`${item.name} added to cart`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">My Wishlist</h1>
        <p className="text-sm text-slate-600">Items you've saved for later.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-lg font-medium text-slate-500">Your wishlist is empty</p>
          <p className="mt-1 text-sm text-slate-400">Browse the catalog and save items you love.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <div key={item._id} className="relative">
              <button
                type="button"
                onClick={() => removeFromWishlist(item._id)}
                className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1.5 text-red-500 shadow hover:bg-red-50 transition"
                aria-label="Remove from wishlist"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
              </button>
              <ItemCard item={item} onView={setActiveItem} onAdd={onAdd} />
            </div>
          ))}
        </div>
      )}

      {activeItem ? <ItemModal item={activeItem} onClose={() => setActiveItem(null)} /> : null}
    </div>
  );
};

export default WishlistPage;
