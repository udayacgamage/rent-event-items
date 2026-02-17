import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import FilterSidebar from '../components/FilterSidebar';
import ItemCard from '../components/ItemCard';
import ItemModal from '../components/ItemModal';
import { useCart } from '../contexts/CartContext';
import api from '../services/api';

const CatalogPage = () => {
  const { addToCart } = useCart();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || 'all',
    minPrice: '',
    maxPrice: '',
    availableOnly: false,
    search: searchParams.get('search') || ''
  });
  const [items, setItems] = useState([]);
  const [activeItem, setActiveItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const timeout = setTimeout(() => {
      const fetchItems = async () => {
        setLoading(true);
        try {
          const params = {
            ...(filters.category !== 'all' ? { category: filters.category } : {}),
            ...(filters.minPrice ? { minPrice: filters.minPrice } : {}),
            ...(filters.maxPrice ? { maxPrice: filters.maxPrice } : {}),
            ...(filters.availableOnly ? { available: true } : {}),
            ...(filters.search ? { search: filters.search } : {}),
            page: pagination.page
          };

          const response = await api.get('/items', { params });
          let fetched = response.data.items || [];

          // Client-side sort
          if (sortBy === 'price-asc') fetched.sort((a, b) => a.rentalPrice - b.rentalPrice);
          else if (sortBy === 'price-desc') fetched.sort((a, b) => b.rentalPrice - a.rentalPrice);
          else if (sortBy === 'rating') fetched.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
          else if (sortBy === 'name') fetched.sort((a, b) => a.name.localeCompare(b.name));

          setItems(fetched);
          if (response.data.pagination) {
            setPagination((prev) => ({ ...prev, pages: response.data.pagination.pages, total: response.data.pagination.total }));
          }
        } catch {
          toast.error('Failed to load items');
        } finally {
          setLoading(false);
        }
      };
      fetchItems();
    }, 300); // debounce

    return () => clearTimeout(timeout);
  }, [filters, pagination.page, sortBy]);

  const onAdd = (item) => {
    addToCart({ itemId: item._id, name: item.name, price: item.rentalPrice, quantity: 1 });
    toast.success(`${item.name} added to cart`);
  };

  const updateFilter = (key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
      <FilterSidebar filters={filters} onChange={updateFilter} />

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Item Catalog</h1>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search items..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="rating">Top Rated</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-lg font-medium text-slate-500">No items found</p>
            <p className="mt-1 text-sm text-slate-400">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-500">{pagination.total || items.length} items found</p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <ItemCard key={item._id} item={item} onView={setActiveItem} onAdd={onAdd} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 ? (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>

      {activeItem ? <ItemModal item={activeItem} onClose={() => setActiveItem(null)} /> : null}
    </div>
  );
};

export default CatalogPage;
