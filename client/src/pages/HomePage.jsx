import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ItemCard from '../components/ItemCard';
import ItemModal from '../components/ItemModal';
import SearchBar from '../components/SearchBar';
import api from '../services/api';

const fallbackFeatured = [
  {
    _id: 'f1',
    name: 'Grand Wedding Marquee',
    rentalPrice: 350,
    images: ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800'],
    availableStock: 5
  },
  {
    _id: 'f2',
    name: 'Premium Event Canopy',
    rentalPrice: 120,
    images: ['https://images.unsplash.com/photo-1510076857177-7470076d4098?w=800'],
    availableStock: 10
  },
  {
    _id: 'f3',
    name: 'Floral Arch Arrangement',
    rentalPrice: 180,
    images: ['https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800'],
    availableStock: 8
  }
];

const steps = [
  { icon: '1', title: 'Browse & Search', desc: 'Explore marquees, canopies, stage setups, floral designs, lighting & catering with real-time availability.' },
  { icon: '2', title: 'Add to Cart', desc: 'Pick the items you need and choose your rental dates.' },
  { icon: '3', title: 'Checkout & Pay', desc: 'Confirm your order with secure payment — delivery handled for you.' }
];

const HomePage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [featured, setFeatured] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/items?limit=6&sort=rating');
        const items = res.data.items || res.data;
        setFeatured(items.length > 0 ? items.slice(0, 6) : fallbackFeatured);
      } catch {
        setFeatured(fallbackFeatured);
      }
    };
    fetchFeatured();
  }, []);

  const submitSearch = (event) => {
    event.preventDefault();
    navigate(`/catalog?search=${encodeURIComponent(search)}`);
  };

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-slate-900 text-white">
        <img
          src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1800"
          alt="Event setup"
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="relative mx-auto flex max-w-5xl flex-col items-start gap-6 px-6 py-24">
          <h1 className="max-w-2xl text-4xl font-bold sm:text-5xl">Event rentals & catering for your perfect occasion</h1>
          <p className="max-w-xl text-slate-100">Rent marquees, canopies, stage setups, floral designs, lighting — plus full catering services — with live availability and fast checkout.</p>
          <button
            type="button"
            onClick={() => navigate('/catalog')}
            className="rounded-lg bg-amber-500 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-600"
          >
            Start Your Event
          </button>
          <SearchBar value={search} onChange={setSearch} onSubmit={submitSearch} />
        </div>
      </section>

      {/* How it Works */}
      <section>
        <h2 className="mb-8 text-center text-2xl font-semibold text-slate-900">How It Works</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.title} className="rounded-xl border border-slate-200 bg-white p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-lg font-bold text-amber-600">{step.icon}</div>
              <h3 className="mb-2 font-semibold text-slate-900">{step.title}</h3>
              <p className="text-sm text-slate-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Items */}
      <section>
        <h2 className="mb-6 text-2xl font-semibold text-slate-900">Featured Items</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((item) => (
            <ItemCard key={item._id} item={item} onViewDetails={() => setSelectedItem(item)} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => navigate('/catalog')}
            className="rounded-lg border border-amber-500 px-6 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50"
          >
            View Full Catalog &rarr;
          </button>
        </div>
      </section>

      {selectedItem ? <ItemModal item={selectedItem} onClose={() => setSelectedItem(null)} /> : null}
    </div>
  );
};

export default HomePage;
