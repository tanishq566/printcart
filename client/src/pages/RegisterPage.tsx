import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Printer,
  Check,
  X,
  Loader2,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Zap,
  Lock,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [shopName, setShopName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bwRate, setBwRate] = useState('2');
  const [colorRate, setColorRate] = useState('10');
  const [idCardRate, setIdCardRate] = useState('10');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto generate slug from shop name
  useEffect(() => {
    if (!isSlugManual && shopName.trim()) {
      const generated = shopName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(generated);
    }
  }, [shopName, isSlugManual]);

  // Debounced check slug availability
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugStatus('idle');
      return;
    }

    setSlugStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch<{ available: boolean; slug: string }>(`/auth/check-slug/${slug}`);
        setSlugStatus(res.available ? 'available' : 'taken');
      } catch {
        setSlugStatus('idle');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!shopName.trim() || !ownerPhone.trim() || !password) {
      setError('Please fill in Shop Name, Phone Number, and Password');
      return;
    }

    if (slugStatus === 'taken') {
      setError('Selected shop URL is already taken. Please choose another one.');
      return;
    }

    setLoading(true);

    try {
      await register({
        shopName: shopName.trim(),
        slug: slug.trim().toLowerCase(),
        ownerPhone: ownerPhone.trim(),
        password,
        city: city.trim() || undefined,
        upiId: upiId.trim() || undefined,
        bwRate: Number(bwRate) || 2,
        colorRate: Number(colorRate) || 10,
        idCardRate: Number(idCardRate) || 10,
      });

      navigate('/dashboard/settings');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
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
          Create Your PrintCart Shop
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          3-Day Free Trial turant shuru hoga • Sirf 2 minute setup
        </p>
      </div>

      {/* Elevated 2-Column Split Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/70 overflow-hidden grid grid-cols-1 md:grid-cols-5">
          {/* Left Panel: Pastel Brand Showcase (2 cols) */}
          <div className="md:col-span-2 bg-gradient-to-br from-indigo-50 via-blue-50/60 to-emerald-50/40 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200/70">
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
                  Apni photocopy dukan ko professional banayein. Zero WhatsApp chats, zero paper-jam stress.
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
              🔒 100% Privacy Guarantee • Free Ready-to-Print Standee
            </div>
          </div>

          {/* Right Panel: Pure White Form (3 cols) */}
          <div className="md:col-span-3 p-8 sm:p-10 flex flex-col justify-center space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 leading-tight">Start 3-Day Free Trial</h4>
                <p className="text-xs text-slate-500">No payment info needed • Instant counter activation</p>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Shop Name */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Shop / Center Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Verma Digital Cyber Cafe"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 text-sm font-medium outline-none transition"
                />
              </div>

              {/* Custom Slug */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Aapka Branded QR Link <span className="text-red-500">*</span>
                  </label>
                  {slugStatus === 'checking' && (
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Checking...
                    </span>
                  )}
                  {slugStatus === 'available' && (
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Available!
                    </span>
                  )}
                  {slugStatus === 'taken' && (
                    <span className="text-[11px] text-red-600 font-bold flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> Already taken
                    </span>
                  )}
                </div>
                <div className="flex rounded-xl border border-slate-300 overflow-hidden focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-500/20">
                  <span className="bg-slate-100 text-slate-500 text-xs font-mono px-3 py-2 border-r border-slate-200 flex items-center select-none">
                    printcart.in/s/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => {
                      setIsSlugManual(true);
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                    }}
                    placeholder="verma-digital"
                    className="w-full px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Phone & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="10 digit number"
                    maxLength={10}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 text-sm font-medium outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 text-sm font-medium outline-none transition"
                  />
                </div>
              </div>

              {/* City & UPI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    City / Town (Optional)
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Patna, Varanasi"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 text-sm font-medium outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Shop UPI ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. shop@okaxis"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 text-sm font-medium outline-none transition"
                  />
                </div>
              </div>

              {/* Default Rates */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Initial Rates (Baad me badal sakte hain):
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">B&W (₹/pg)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={bwRate}
                      onChange={(e) => setBwRate(e.target.value)}
                      className="w-full px-2 py-1 bg-white rounded-lg border border-slate-300 text-xs font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Color (₹/pg)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={colorRate}
                      onChange={(e) => setColorRate(e.target.value)}
                      className="w-full px-2 py-1 bg-white rounded-lg border border-slate-300 text-xs font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">ID Card (₹/ea)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={idCardRate}
                      onChange={(e) => setIdCardRate(e.target.value)}
                      className="w-full px-2 py-1 bg-white rounded-lg border border-slate-300 text-xs font-bold text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
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
                    <span>Creating Your Shop...</span>
                  </>
                ) : (
                  <>
                    <span>Start 3-Day Free Trial</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center text-xs text-slate-600 border-t border-slate-100 pt-3">
              Pehle se registered hain?{' '}
              <Link to="/login" className="font-bold text-indigo-600 hover:underline">
                Yahan Login Karein →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
