const SearchBar = ({ value, onChange, onSubmit }) => {
  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-2xl items-center gap-2 rounded-xl bg-white p-2 shadow-lg">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search categories: chairs, tables, canopies"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
      />
      <button
        type="submit"
        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
      >
        Search
      </button>
    </form>
  );
};

export default SearchBar;
