import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Printer,
  Loader2,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  KeyRound,
  Zap,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim() || !password) {
      setError('Please enter your mobile number/slug and password');
      return;
    }

    setLoading(true);

    try {
      const shop = await login(identifier.trim(), password);
      if (shop.role === 'SUPER_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (idVal: string, passVal: string) => {
    setIdentifier(idVal);
    setPassword(passVal);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-blue-50/40 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link to="/" className="inline-flex items-center space-x-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Printer className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900">
            Print<span className="text-indigo-600">Cart</span>
          </span>
        </Link>
        <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
          Welcome Back!
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Apne PrintCart counter dashboard me sign in karein
        </p>
      </div>

      {/* Elevated 2-Column Split Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/70 overflow-hidden grid grid-cols-1 md:grid-cols-5">
          {/* Left Panel: Pastel Brand Showcase (2 cols) */}
          <div className="md:col-span-2 bg-gradient-to-br from-indigo-50 via-blue-50/60 to-emerald-50/40 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200/70 relative">
            <div className="space-y-6">
              {/* Floating Logo Showcase Box */}
              <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-200/60 flex items-center justify-center text-indigo-600">
                <Printer className="w-7 h-7" />
              </div>

              {/* Bold Stacked Tagline */}
              <div>
                <h3 className="text-3xl font-black text-[#0F172A] tracking-tight leading-none">
                  Fast.<br />
                  Private.<br />
                  <span className="bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                    Zero-Storage.
                  </span>
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Bharat ke 2,50,000+ Photocopy & CSC Kendras ke liye banaya gaya smart platform.
                </p>
              </div>

              {/* 4 Crisp White Trust Pills */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2.5 px-3 py-2 bg-white/90 backdrop-blur-xs rounded-xl border border-slate-200/80 shadow-xs text-xs font-semibold text-slate-700">
                  <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>1-Click Counter Print</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 bg-white/90 backdrop-blur-xs rounded-xl border border-slate-200/80 shadow-xs text-xs font-semibold text-slate-700">
                  <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Auto-Deletes After Print</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 bg-white/90 backdrop-blur-xs rounded-xl border border-slate-200/80 shadow-xs text-xs font-semibold text-slate-700">
                  <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Auto ID Card Merger</span>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2 bg-white/90 backdrop-blur-xs rounded-xl border border-slate-200/80 shadow-xs text-xs font-semibold text-slate-700">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>₹499 Special Launch Offer</span>
                </div>
              </div>
            </div>

            <div className="pt-6 text-[11px] text-slate-400 font-medium">
              🔒 100% Encrypted & Safe • printcart.in
            </div>
          </div>

          {/* Right Panel: Pure White Form (3 cols) */}
          <div className="md:col-span-3 p-8 sm:p-10 flex flex-col justify-center space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 leading-tight">Counter Login</h4>
                <p className="text-xs text-slate-500">Enter your credentials to continue</p>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Mobile Number ya Shop Slug
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 9876543210 ya demo-shop"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 text-sm font-medium outline-none transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Password
                  </label>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 text-sm font-medium outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 transition hover:-translate-y-0.5 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Login to Counter</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                1-Click Demo Logins:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillCredentials('9876543210', 'Demo@123')}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 rounded-lg text-slate-700 transition flex items-center justify-center gap-1 shadow-xs"
                >
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Demo Shop</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('9999999999', 'Admin@123')}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 hover:border-purple-400 hover:text-purple-600 rounded-lg text-slate-700 transition flex items-center justify-center gap-1 shadow-xs"
                >
                  <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                  <span>Super Admin</span>
                </button>
              </div>
            </div>

            {/* Register Link */}
            <div className="text-center text-xs text-slate-600 border-t border-slate-100 pt-4">
              Nayi dukan register karni hai?{' '}
              <Link to="/register" className="font-bold text-indigo-600 hover:underline">
                3-Day Free Trial Start Karein →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
