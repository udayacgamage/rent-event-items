const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'marquee', label: 'Marquee' },
  { value: 'canopy', label: 'Canopy' },
  { value: 'stage-setup', label: 'Stage Setup' },
  { value: 'floral-design', label: 'Floral Design' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'catering', label: 'Catering' }
];

const FilterSidebar = ({ filters, onChange }) => {
  return (
    <aside className="space-y-5 rounded-xl border border-slate-200 bg-white p-4">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-900">Item Type</h3>
        <select
          value={filters.category}
          onChange={(event) => onChange('category', event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {categories.map((entry) => (
            <option value={entry.value} key={entry.value}>
              {entry.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-900">Price Range</h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(event) => onChange('minPrice', event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(event) => onChange('maxPrice', event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={filters.availableOnly}
          onChange={(event) => onChange('availableOnly', event.target.checked)}
        />
        Available only
      </label>
    </aside>
  );
};

export default FilterSidebar;
