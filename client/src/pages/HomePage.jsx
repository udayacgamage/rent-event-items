import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ItemCard from '../components/ItemCard';
import ItemModal from '../components/ItemModal';
import SearchBar from '../components/SearchBar';
import { useCart } from '../contexts/CartContext';
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

const testimonials = [
  { name: 'Amaya P.', text: 'Occasia made our wedding décor absolutely stunning. The marquees and floral arches were top quality.', rating: 5 },
  { name: 'Kasun D.', text: 'Fast delivery and great communication. The stage setup was exactly what we needed for our corporate event.', rating: 5 },
  { name: 'Nimesha R.', text: 'Very affordable prices and excellent service. Will definitely rent from Occasia again!', rating: 4 }
];

const stats = [
  { value: '2,500+', label: 'Events Served' },
  { value: '150+', label: 'Rental Items' },
  { value: '98%', label: 'Happy Clients' },
  { value: '24/7', label: 'Support' }
];

const HomePage = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [search, setSearch] = useState('');
  const [featured, setFeatured] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  const onAdd = (item) => {
    addToCart({ itemId: item._id, name: item.name, price: item.rentalPrice, quantity: 1 });
    toast.success(`${item.name} added to cart`);
  };

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/items?limit=6&sort=rating');
        const items = res.data.items || res.data;
        setFeatured(items.length > 0 ? items.slice(0, 6) : fallbackFeatured);
      } catch {
        setFeatured(fallbackFeatured);
      } finally {
        setFeaturedLoading(false);
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
          <h1 className="max-w-2xl text-4xl font-bold sm:text-5xl">Premium event rentals & catering for your perfect occasion</h1>
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

      {/* Featured Items */}
      <section>
        <h2 className="mb-6 text-2xl font-semibold text-slate-900">Featured Items</h2>
        {featuredLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="h-44 bg-slate-200" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-3/4 rounded bg-slate-200" />
                  <div className="h-3 w-1/2 rounded bg-slate-200" />
                  <div className="h-8 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item) => (
              <ItemCard key={item._id} item={item} onView={setSelectedItem} onAdd={onAdd} />
            ))}
          </div>
        )}
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

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5 text-center">
            <p className="text-2xl font-bold text-amber-600">{s.value}</p>
            <p className="mt-1 text-sm text-slate-600">{s.label}</p>
          </div>
        ))}
      </section>

      {/* Testimonials */}
      <section>
        <h2 className="mb-8 text-center text-2xl font-semibold text-slate-900">What Our Clients Say</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-3 flex gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className={`h-4 w-4 ${i < t.rating ? 'fill-current' : 'text-slate-200 fill-current'}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                ))}
              </div>
              <p className="text-sm text-slate-600 italic">&ldquo;{t.text}&rdquo;</p>
              <p className="mt-3 text-sm font-semibold text-slate-900">{t.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="rounded-2xl bg-amber-50 border border-amber-200 px-6 py-10 text-center">
        <h2 className="text-2xl font-semibold text-slate-900">Stay in the Loop</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">Get exclusive deals, new item alerts & event planning tips straight to your inbox.</p>
        <form onSubmit={(e) => { e.preventDefault(); toast.success('Subscribed! Check your inbox.'); }} className="mx-auto mt-5 flex max-w-md gap-2">
          <input type="email" required placeholder="you@example.com" className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500" />
          <button type="submit" className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition">Subscribe</button>
        </form>
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

      {selectedItem ? <ItemModal item={selectedItem} onClose={() => setSelectedItem(null)} /> : null}
    </div>
  );
};

export default HomePage;
