import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const user = await login(form.email, form.password);
      if (user.role !== 'admin') {
        logout();
        setError('This account is not an admin user.');
        return;
      }
      navigate('/admin/dashboard');
    } catch {
      setError('Invalid login credentials.');
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Admin Login</h1>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(event) => setForm((previous) => ({ ...previous, password: event.target.value }))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button type="submit" className="w-full rounded-lg bg-slate-900 px-4 py-2 text-white">
          Sign In
        </button>
      </form>
    </div>
  );
};

export default AdminLoginPage;
