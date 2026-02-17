import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="py-16 text-center">
    <h1 className="text-4xl font-semibold text-slate-900">404</h1>
    <p className="mt-2 text-slate-600">The page you are looking for does not exist.</p>
    <Link to="/" className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">
      Back to Home
    </Link>
  </div>
);

export default NotFoundPage;
