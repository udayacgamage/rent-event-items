import { useNavigate } from 'react-router-dom';
import { useCompare } from '../contexts/CompareContext';

const CompareBar = () => {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const navigate = useNavigate();

  if (compareItems.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-800/95">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Compare ({compareItems.length}/4)
        </span>
        <div className="flex gap-2">
          {compareItems.map((item) => (
            <div key={item._id} className="relative">
              <img
                src={item.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=100'}
                alt={item.name}
                className="h-10 w-10 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => removeFromCompare(item._id)}
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => navigate('/compare')}
          disabled={compareItems.length < 2}
          className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition"
        >
          Compare Now
        </button>
        <button
          type="button"
          onClick={clearCompare}
          className="text-xs text-slate-400 hover:text-red-500 transition"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default CompareBar;
