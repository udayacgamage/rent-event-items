import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="flex flex-col items-center py-20 text-center">
    <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-amber-100">
      <svg className="h-12 w-12 text-amber-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
      </svg>
    </div>
    <h1 className="text-6xl font-bold text-slate-900">404</h1>
    <p className="mt-3 text-lg text-slate-600">Oops! The page you&apos;re looking for doesn&apos;t exist.</p>
    <p className="mt-1 text-sm text-slate-400">It may have been moved, deleted, or you may have mistyped the URL.</p>
    <div className="mt-6 flex gap-3">
      <Link to="/" className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-600 transition">
        Back to Home
      </Link>
      <Link to="/catalog" className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
        Browse Catalog
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
