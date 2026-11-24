import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight, QrCode, LayoutDashboard } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const PaymentStatusPage: React.FC = () => {
  const { merchantOrderId } = useParams<{ merchantOrderId: string }>();
  const { refreshShop } = useAuth();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!merchantOrderId) {
      setLoading(false);
      setMessage('Missing order reference');
      return;
    }

    apiFetch('/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ merchantOrderId }),
    })
      .then(async (res) => {
        setSuccess(true);
        setMessage(res.message || 'Payment successfully completed!');
        await refreshShop();
      })
      .catch((err) => {
        setSuccess(false);
        setMessage(err.message || 'Could not verify payment status.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [merchantOrderId]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-6 shadow-xl">
          {loading ? (
            <div className="py-12 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto" />
              <h2 className="text-xl font-bold text-slate-900">Verifying PhonePe Payment...</h2>
              <p className="text-xs text-slate-500 font-mono">Order ID: {merchantOrderId}</p>
            </div>
          ) : success ? (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                  PhonePe Payment Confirmed
                </span>
                <h2 className="text-2xl font-black text-slate-950 mt-1">
                  Lifetime Pass Unlocked!
                </h2>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {message} Your shop now has permanent access to PrintCart.
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <Link
                  to="/dashboard/standee"
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Download Ready-to-Print Standee →</span>
                </Link>

                <Link
                  to="/dashboard"
                  className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Open Counter Dashboard</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-red-600">
                  Payment Verification Pending or Incomplete
                </span>
                <h2 className="text-xl font-black text-slate-950 mt-1">Transaction Not Verified</h2>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{message}</p>
              </div>

              <div className="pt-2">
                <Link
                  to="/dashboard/settings"
                  className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm"
                >
                  <span>Return to Settings</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
