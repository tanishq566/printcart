import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Printer, Settings, LayoutDashboard, LogOut, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC<{ variant?: 'light' | 'dark' }> = () => {
  const { shop, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/75 backdrop-blur-md border-b border-slate-200/70 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  Print<span className="text-indigo-600">Cart</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                  Zero Storage
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium -mt-0.5 hidden sm:block">
                printcart.in • QR-to-Print
              </p>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="flex items-center space-x-2 sm:space-x-4">
            {!isAuthenticated ? (
              <>
                <a
                  href="/#features"
                  className="hidden md:inline-flex text-sm font-semibold text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition"
                >
                  Features
                </a>
                <a
                  href="/#pricing"
                  className="hidden md:inline-flex text-sm font-semibold text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition"
                >
                  Pricing
                </a>
                <Link
                  to="/login"
                  className="px-4 py-1.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300/80 rounded-full shadow-xs hover:border-slate-400 transition"
                >
                  Shop Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 rounded-xl shadow-md shadow-indigo-500/20 transition hover:-translate-y-0.5"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-4 h-4 hidden sm:inline" />
                </Link>
              </>
            ) : (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>Admin</span>
                  </Link>
                )}

                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition"
                >
                  <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                  <span className="hidden sm:inline">Counter</span>
                </Link>

                <Link
                  to="/dashboard/settings"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span className="hidden sm:inline">Settings</span>
                </Link>

                {shop && shop.role === 'SHOPKEEPER' && (
                  <Link
                    to={`/s/${shop.slug}`}
                    target="_blank"
                    className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition"
                    title="View Customer Upload Page"
                  >
                    <span>/s/{shop.slug}</span>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
