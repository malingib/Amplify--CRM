import React, { useState } from 'react';
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react';

const ADMIN_EMAIL = 'malingib9@gmail.com';

const AdminBootstrap: React.FC = () => {
  const [token, setToken] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password.length < 12) {
      setError('Use a password with at least 12 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/bootstrap-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email: ADMIN_EMAIL, name, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Administrator setup failed.');
      localStorage.setItem('amplify_token', data.token);
      window.location.replace('/');
    } catch (err: any) {
      setError(err.message || 'Administrator setup failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f7fb] flex items-center justify-center p-4 sm:p-8">
      <section className="w-full max-w-[480px] rounded-3xl border border-slate-200 bg-white p-7 sm:p-10 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#17264a] text-white"><ShieldCheck className="h-6 w-6" /></div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">One-time setup</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Create the first administrator</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">This setup is restricted to the authorized account and closes automatically after the first administrator is created.</p>
        {error && <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <form onSubmit={submit} className="mt-7 space-y-4">
          <div><label className="mb-2 block text-xs font-semibold text-slate-700">Administrator email</label><input value={ADMIN_EMAIL} readOnly className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600" /></div>
          <div><label htmlFor="bootstrap-name" className="mb-2 block text-xs font-semibold text-slate-700">Full name</label><input id="bootstrap-name" autoComplete="name" required minLength={2} value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" /></div>
          <div><label htmlFor="bootstrap-token" className="mb-2 block text-xs font-semibold text-slate-700">One-time setup key</label><input id="bootstrap-token" required autoComplete="off" value={token} onChange={e => setToken(e.target.value)} placeholder="Paste the setup key" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" /></div>
          <div><label htmlFor="bootstrap-password" className="mb-2 block text-xs font-semibold text-slate-700">Create password</label><input id="bootstrap-password" type="password" autoComplete="new-password" required minLength={12} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 12 characters" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" /></div>
          <div><label htmlFor="bootstrap-confirm" className="mb-2 block text-xs font-semibold text-slate-700">Confirm password</label><input id="bootstrap-confirm" type="password" autoComplete="new-password" required minLength={12} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" /></div>
          <button type="submit" disabled={loading || !token || !name || !password || !confirmPassword} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#17264a] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#22365f] disabled:cursor-not-allowed disabled:opacity-60">{loading && <Loader2 className="h-4 w-4 animate-spin" />}{loading ? 'Creating administrator…' : 'Create administrator'}{!loading && <ArrowRight className="h-4 w-4" />}</button>
        </form>
        <p className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-400">This page only works while the one-time setup authorization is active.</p>
      </section>
    </main>
  );
};

export default AdminBootstrap;
