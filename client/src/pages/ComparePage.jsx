import { useNavigate } from 'react-router-dom';
import { useCompare } from '../contexts/CompareContext';

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400';

const ComparePage = () => {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const navigate = useNavigate();

  if (compareItems.length === 0) {
    return (
      <div className="py-20 text-center">
        <h1 className="mb-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">Compare Items</h1>
        <p className="text-slate-500 dark:text-slate-400">No items selected for comparison.</p>
        <button
          type="button"
          onClick={() => navigate('/catalog')}
          className="mt-4 rounded-lg bg-amber-500 px-6 py-2 text-sm font-medium text-white hover:bg-amber-600 transition"
        >
          Browse Catalog
        </button>
      </div>
    );
  }

  const rows = [
    { label: 'Image', render: (item) => <img src={item.images?.[0] || PLACEHOLDER_IMG} alt={item.name} className="h-32 w-full rounded-lg object-cover" /> },
    { label: 'Name', render: (item) => <span className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</span> },
    { label: 'Category', render: (item) => <span className="capitalize text-slate-600 dark:text-slate-300">{item.category}</span> },
    { label: 'Price / Day', render: (item) => <span className="font-bold text-amber-600">Rs. {item.rentalPrice?.toLocaleString()}</span> },
    { label: 'Rating', render: (item) => <span className="text-amber-500">{'★'.repeat(Math.round(item.averageRating || 0))}{'☆'.repeat(5 - Math.round(item.averageRating || 0))} ({item.reviewsCount || 0})</span> },
    { label: 'Stock', render: (item) => <span className={item.availableStock > 0 ? 'text-green-600' : 'text-red-500'}>{item.availableStock > 0 ? `${item.availableStock} available` : 'Out of stock'}</span> },
    { label: 'Dimensions', render: (item) => <span className="text-slate-600 dark:text-slate-400">{item.dimensions || '—'}</span> },
    { label: 'Material', render: (item) => <span className="text-slate-600 dark:text-slate-400">{item.material || '—'}</span> },
    { label: 'Description', render: (item) => <p className="line-clamp-3 text-sm text-slate-500 dark:text-slate-400">{item.description || '—'}</p> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Compare Items</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{compareItems.length} items selected</p>
        </div>
        <button
          type="button"
          onClick={clearCompare}
          className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-100 transition dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Clear All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr>
              <th className="w-28 p-3 text-left text-xs font-semibold uppercase text-slate-400">&nbsp;</th>
              {compareItems.map((item) => (
                <th key={item._id} className="p-3 text-center">
                  <button
                    type="button"
                    onClick={() => removeFromCompare(item._id)}
                    className="rounded-full p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
                    title="Remove from compare"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.label} className={idx % 2 === 0 ? 'bg-slate-50 dark:bg-slate-800/50' : ''}>
                <td className="p-3 text-xs font-semibold uppercase text-slate-400">{row.label}</td>
                {compareItems.map((item) => (
                  <td key={item._id} className="p-3 text-center">
                    {row.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparePage;
