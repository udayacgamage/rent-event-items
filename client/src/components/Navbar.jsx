import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const navClass = ({ isActive }) =>
  isActive ? 'text-amber-600 font-semibold' : 'text-slate-700 hover:text-amber-600 transition-colors';

const Navbar = () => {
  const { itemCount } = useCart();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = (
    <>
      <NavLink to="/catalog" className={navClass} onClick={() => setMobileOpen(false)}>
        Catalog
      </NavLink>
      {user ? (
        <NavLink to="/dashboard" className={navClass} onClick={() => setMobileOpen(false)}>
          Dashboard
        </NavLink>
      ) : null}
      {user ? (
        <NavLink to="/wishlist" className={navClass} onClick={() => setMobileOpen(false)}>
          Wishlist
        </NavLink>
      ) : null}
      <NavLink to="/cart" className={navClass} onClick={() => setMobileOpen(false)}>
        Cart
        {itemCount > 0 ? (
          <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white">
            {itemCount}
          </span>
        ) : null}
      </NavLink>
      {user?.role === 'admin' ? (
        <NavLink to="/admin/dashboard" className={navClass} onClick={() => setMobileOpen(false)}>
          Admin
        </NavLink>
      ) : null}
    </>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="text-xl font-bold text-slate-900">
          EventGoods
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-5 text-sm md:flex">
          {links}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">Hi, {user.name?.split(' ')[0]}</span>
              <button
                type="button"
                onClick={logout}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-white transition hover:bg-slate-700"
              >
                Logout
              </button>
            </div>
          ) : (
            <NavLink to="/admin" className={navClass}>
              Login
            </NavLink>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="flex flex-col gap-1 md:hidden"
          aria-label="Toggle menu"
        >
          <span className={`h-0.5 w-5 bg-slate-900 transition-transform ${mobileOpen ? 'translate-y-1.5 rotate-45' : ''}`} />
          <span className={`h-0.5 w-5 bg-slate-900 transition-opacity ${mobileOpen ? 'opacity-0' : ''}`} />
          <span className={`h-0.5 w-5 bg-slate-900 transition-transform ${mobileOpen ? '-translate-y-1.5 -rotate-45' : ''}`} />
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen ? (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm">
            {links}
            {user ? (
              <button
                type="button"
                onClick={() => { logout(); setMobileOpen(false); }}
                className="w-full rounded-md bg-slate-900 px-3 py-2 text-white"
              >
                Logout ({user.name?.split(' ')[0]})
              </button>
            ) : (
              <NavLink to="/admin" className={navClass} onClick={() => setMobileOpen(false)}>
                Login
              </NavLink>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
};

export default Navbar;
