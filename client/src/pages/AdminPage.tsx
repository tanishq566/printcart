import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  CreditCard,
  Printer,
  Search,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Loader2,
  Calendar,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { Shop, AdminMetrics } from '../types';

export const AdminPage: React.FC = () => {
  const { shop, isAdmin, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !isAdmin) {
        navigate('/login');
      }
    }
  }, [authLoading, isAuthenticated, isAdmin, navigate]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [overviewRes, shopsRes] = await Promise.all([
        apiFetch<{ metrics: AdminMetrics }>('/admin/overview'),
        apiFetch<{ shops: Shop[] }>(
          `/admin/shops?search=${encodeURIComponent(search)}&status=${encodeURIComponent(
            statusFilter
          )}`
        ),
      ]);
      setMetrics(overviewRes.metrics);
      setShops(shopsRes.shops);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadAdminData();
    }
  }, [search, statusFilter, isAuthenticated, isAdmin]);

  const handleAction = async (shopId: string, actionPayload: any, successNote: string) => {
    try {
      setActionLoadingId(shopId);
      await apiFetch(`/admin/shops/${shopId}`, {
        method: 'PATCH',
        body: JSON.stringify(actionPayload),
      });
      setFeedback(successNote);
      setTimeout(() => setFeedback(null), 3500);
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-600"></span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
                Super Admin Control Center
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800">
                PrintCart HQ
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Manage all registered shops, subscriptions, manual UPI payment overrides, and live print network metrics.
            </p>
          </div>

          <button
            onClick={loadAdminData}
            className="self-start sm:self-center px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 transition flex items-center gap-1.5 shadow-xs"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Refresh Live Data</span>
          </button>
        </div>

        {feedback && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Overview Metric Cards */}
        {metrics && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" /> Total Shops
              </span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                {metrics.totalShops}
              </p>
              <p className="text-[11px] text-slate-400 font-medium">Registered print shops</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Paid Shops
              </span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 tabular-nums">
                {metrics.paidShops}
              </p>
              <p className="text-[11px] text-slate-400 font-medium">₹499 Active Launch Plan</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600" /> Active Trials
              </span>
              <p className="text-2xl sm:text-3xl font-black text-amber-600 tabular-nums">
                {metrics.activeTrials}
              </p>
              <p className="text-[11px] text-slate-400 font-medium">In 3-day evaluation</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-purple-600" /> Prints Today
              </span>
              <p className="text-2xl sm:text-3xl font-black text-purple-600 tabular-nums">
                {metrics.totalPrintsToday}
              </p>
              <p className="text-[11px] text-slate-400 font-medium">Completed today (all shops)</p>
            </div>

            <div className="col-span-2 lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" /> Revenue
              </span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                ₹{metrics.totalRevenueInr.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-400 font-medium">₹499 Launch Deal revenue</p>
            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shops by name, mobile, slug, city..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none"
            >
              <option value="">All Plan Statuses</option>
              <option value="TRIAL">TRIAL (3-Day)</option>
              <option value="ACTIVE_LAUNCH">ACTIVE LAUNCH (₹499)</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>
        </div>

        {/* Shops Management Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase font-extrabold text-slate-500 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Shop Name & URL</th>
                  <th className="px-5 py-3.5">Owner / City</th>
                  <th className="px-5 py-3.5">Plan Status</th>
                  <th className="px-5 py-3.5">Rates (B/C/ID)</th>
                  <th className="px-5 py-3.5 text-center">Prints</th>
                  <th className="px-5 py-3.5 text-center">Counter</th>
                  <th className="px-5 py-3.5 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shops.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      No shops found matching your search.
                    </td>
                  </tr>
                ) : (
                  shops.map((s) => {
                    const isTrial = s.planStatus === 'TRIAL';
                    const isPaid = s.planStatus === 'ACTIVE_LAUNCH';
                    const isSuspended = s.planStatus === 'SUSPENDED';

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900 text-base">{s.shopName}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <a
                              href={`/s/${s.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <span>/s/{s.slug}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-mono text-xs font-semibold text-slate-900">
                            +91 {s.ownerPhone}
                          </div>
                          <div className="text-xs text-slate-500">{s.city || 'Location unset'}</div>
                        </td>

                        <td className="px-5 py-4">
                          {isPaid && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                              <ShieldCheck className="w-3.5 h-3.5" /> PAID (₹499)
                            </span>
                          )}
                          {isTrial && (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800">
                                3-Day Trial
                              </span>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                Exp: {s.trialEndsAt ? new Date(s.trialEndsAt).toLocaleDateString() : '—'}
                              </div>
                            </div>
                          )}
                          {isSuspended && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-red-100 text-red-800">
                              Suspended
                            </span>
                          )}
                          {s.planStatus === 'EXPIRED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700">
                              Expired
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 font-mono text-xs text-slate-600">
                          ₹{s.bwRate} / ₹{s.colorRate} / ₹{s.idCardRate}
                        </td>

                        <td className="px-5 py-4 text-center font-bold text-slate-900 tabular-nums">
                          {s._count?.printJobs ?? 0}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-block w-2.5 h-2.5 rounded-full ${
                              s.isCounterOpen ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                            title={s.isCounterOpen ? 'Counter Open' : 'Counter Closed'}
                          />
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Activate Paid Plan Override */}
                            {!isPaid && (
                              <button
                                disabled={actionLoadingId === s.id}
                                onClick={() =>
                                  handleAction(
                                    s.id,
                                    { planStatus: 'ACTIVE_LAUNCH' },
                                    `Activated ₹499 Paid Plan for ${s.shopName}`
                                  )
                                }
                                className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                                title="Mark ₹499 Paid (Manual UPI Override)"
                              >
                                Activate Paid
                              </button>
                            )}

                            {/* Extend Trial */}
                            <button
                              disabled={actionLoadingId === s.id}
                              onClick={() =>
                                handleAction(
                                  s.id,
                                  { extendTrialDays: 7 },
                                  `Extended trial by 7 days for ${s.shopName}`
                                )
                              }
                              className="px-2 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition"
                              title="Add 7 Days to Trial"
                            >
                              +7d Trial
                            </button>

                            {/* Suspend / Unsuspend */}
                            {isSuspended ? (
                              <button
                                disabled={actionLoadingId === s.id}
                                onClick={() =>
                                  handleAction(
                                    s.id,
                                    { planStatus: 'TRIAL' },
                                    `Unsuspended ${s.shopName}`
                                  )
                                }
                                className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                              >
                                Unsuspend
                              </button>
                            ) : (
                              <button
                                disabled={actionLoadingId === s.id}
                                onClick={() =>
                                  handleAction(
                                    s.id,
                                    { planStatus: 'SUSPENDED' },
                                    `Suspended ${s.shopName}`
                                  )
                                }
                                className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition"
                              >
                                Suspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
