import React, { useState, useEffect } from 'react';
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
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { HeroInteractiveAnimation } from '../components/HeroInteractiveAnimation';

const LOGIN_SLOGANS = [
  'Zero-Storage Counter.',
  '1-Click Smart Print.',
  'Instant Token & UPI.',
];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sloganIndex, setSloganIndex] = useState(0);
  const [sloganVisible, setSloganVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setSloganVisible(false);
      setTimeout(() => {
        setSloganIndex((i) => (i + 1) % LOGIN_SLOGANS.length);
        setSloganVisible(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="min-h-screen relative overflow-x-hidden bg-[#FAFBFD] flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Soft Animated Pastel Radial Glows matching Landing Page */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div
          className="absolute -top-24 -left-24 w-[460px] h-[460px] rounded-full blur-3xl opacity-55 login-orb-slow"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/4 -right-24 w-[440px] h-[440px] rounded-full blur-3xl opacity-50 login-orb-reverse"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.16) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-24 left-1/3 w-[420px] h-[420px] rounded-full blur-3xl opacity-45 login-orb-slow"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.14) 0%, transparent 70%)' }}
        />
      </div>

      {/* Main Split Showcase + Login Container */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* ── LEFT COLUMN: Interactive Landing-Style Animation Showcase (7 cols) ── */}
        <div className="lg:col-span-7 flex flex-col items-center lg:items-start space-y-5 login-fade-up">
          {/* Brand + Live Privacy Pill */}
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Link to="/" className="inline-flex items-center space-x-2.5 group self-center sm:self-auto">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <Printer className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Print<span className="text-indigo-600">Cart</span>
              </span>
            </Link>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-slate-100 text-[11px] font-semibold shadow-sm self-center sm:self-auto">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>🔒 PRIVACY BY DESIGN • Auto-Deletes After Print</span>
            </div>
          </div>

          {/* Animated Headline + Rotating Slogan */}
          <div className="text-center lg:text-left w-full">
            <h1 className="text-2xl sm:text-3xl xl:text-4xl font-black text-[#0F172A] tracking-tight leading-tight">
              Fast. Private.{' '}
              <span
                className={`inline-block bg-gradient-to-r from-indigo-600 via-blue-600 to-emerald-500 bg-clip-text text-transparent transition-all duration-300 ${
                  sloganVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                }`}
              >
                {LOGIN_SLOGANS[sloganIndex]}
              </span>
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600">
              QR scan se direct counter print — dekhiye aapka smart cyber cafe setup live kaise kaam karta hai.
            </p>
          </div>

          {/* Interactive 3-Stage Animation (Laser QR Scan -> Zero-Storage Stream -> Paper Print Out) */}
          <div className="w-full flex justify-center lg:justify-start">
            <HeroInteractiveAnimation />
          </div>

          {/* Compact Trust Feature Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
            <div className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-xs rounded-xl border border-slate-200/80 shadow-xs text-[11px] font-bold text-slate-700 hover:-translate-y-0.5 transition-transform">
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">1-Click Print</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-xs rounded-xl border border-slate-200/80 shadow-xs text-[11px] font-bold text-slate-700 hover:-translate-y-0.5 transition-transform">
              <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">Auto-Delete</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-xs rounded-xl border border-slate-200/80 shadow-xs text-[11px] font-bold text-slate-700 hover:-translate-y-0.5 transition-transform">
              <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate">ID A4 Merge</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-xs rounded-xl border border-slate-200/80 shadow-xs text-[11px] font-bold text-slate-700 hover:-translate-y-0.5 transition-transform">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">₹499 Offer</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Elevated Animated Login Card (5 cols) ── */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto login-fade-up-delayed">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl shadow-indigo-950/10 border border-slate-200/80 overflow-hidden">
            {/* Subtle Animated Gradient Top Accent Bar */}
            <div
              className="h-1.5 w-full"
              style={{
                background: 'linear-gradient(90deg, #4f46e5, #2563eb, #10b981, #4f46e5)',
                backgroundSize: '200% 100%',
                animation: 'loginGradientShift 4s linear infinite',
              }}
            />

            <div className="p-7 sm:p-8 space-y-5">
              {/* Welcome & Shield Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[#0F172A] leading-tight">Welcome Back!</h2>
                    <p className="text-xs text-slate-500">Apne Counter Dashboard me sign in karein</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-extrabold text-emerald-700 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  LIVE
                </span>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Mobile Number ya Shop Slug
                  </label>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. 9876543210 ya demo-shop"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 text-sm font-medium outline-none transition bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 text-sm font-medium outline-none transition bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 60%, #059669 100%)',
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
                    className="px-2.5 py-2 text-xs font-semibold bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 rounded-xl text-slate-700 transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Demo Shop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillCredentials('9999999999', 'Admin@123')}
                    className="px-2.5 py-2 text-xs font-semibold bg-white border border-slate-200 hover:border-purple-400 hover:text-purple-600 rounded-xl text-slate-700 transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                    <span>Super Admin</span>
                  </button>
                </div>
              </div>

              {/* Register Link & Footer */}
              <div className="space-y-2 border-t border-slate-100 pt-4 text-center">
                <div className="text-xs text-slate-600">
                  Nayi dukan register karni hai?{' '}
                  <Link to="/register" className="font-bold text-indigo-600 hover:underline">
                    3-Day Free Trial Start Karein →
                  </Link>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  🔒 100% Encrypted & Safe • printcart.in
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Smooth Scoped Motion Keyframes */}
      <style>{`
        @keyframes loginFadeUp {
          0% { opacity: 0; transform: translate3d(0, 18px, 0); }
          100% { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes loginOrbFloat {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(20px, -18px, 0) scale(1.06); }
        }
        @keyframes loginGradientShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .login-fade-up {
          animation: loginFadeUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .login-fade-up-delayed {
          animation: loginFadeUp 0.75s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both;
        }
        .login-orb-slow {
          animation: loginOrbFloat 11s ease-in-out infinite;
        }
        .login-orb-reverse {
          animation: loginOrbFloat 13s ease-in-out infinite reverse;
        }
      `}</style>
    </div>
  );
};
