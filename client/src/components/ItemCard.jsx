const ItemCard = ({ item, onView, onAdd }) => {
  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <button type="button" onClick={() => onView(item)} className="w-full text-left">
        <div className="h-44 overflow-hidden bg-slate-100">
          <img
            src={item.images?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200'}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        </div>
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
          <span className="text-sm font-semibold text-amber-600">${item.rentalPrice}/day</span>
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
      </div>
    </article>
  );
};

export default ItemCard;
