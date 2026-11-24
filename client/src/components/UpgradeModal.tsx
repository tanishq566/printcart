import React, { useState } from 'react';
import { Sparkles, ShieldCheck, CheckCircle2, ArrowRight, Loader2, X, CreditCard } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { shop, refreshShop } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartPayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Create PhonePe Order
      const orderRes = await apiFetch<{
        mockMode: boolean;
        merchantOrderId: string;
        amountInr: number;
        redirectUrl?: string;
      }>('/payments/create-order', {
        method: 'POST',
      });

      if (orderRes.mockMode) {
        // 2a. Mock Mode: Instant test simulation
        await apiFetch('/payments/verify', {
          method: 'POST',
          body: JSON.stringify({
            merchantOrderId: orderRes.merchantOrderId,
            mockMode: true,
          }),
        });

        await refreshShop();
        if (onSuccess) onSuccess();
        onClose();
        alert('🎉 ₹499 Lifetime Launch Offer Activated via PhonePe! You now have permanent access to PrintCart.');
      } else if (orderRes.redirectUrl) {
        // 2b. Live / Sandbox Mode: Redirect to PhonePe Standard Checkout
        window.location.href = orderRes.redirectUrl;
      }
    } catch (err: any) {
      setError(err.message || 'Payment initiation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Special Launch Deal • PhonePe PG</span>
          </div>
          <h3 className="text-2xl font-black text-slate-950">
            Activate ₹499 Lifetime Pass
          </h3>
          <p className="text-xs text-slate-500">
            Pay once, use forever on your shop counter with zero monthly renewals.
          </p>
        </div>

        {/* Pricing Pill */}
        <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 border border-purple-200 rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-black text-slate-900">₹499</span>
            <div className="text-left">
              <span className="text-xs line-through text-slate-400 block font-bold">₹1,999</span>
              <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                75% OFF
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-600 font-medium mt-1">
            0% Platform Fee • Direct UPI & PhonePe Integration
          </p>
        </div>

        {/* Benefits list */}
        <div className="space-y-2.5 text-xs text-slate-700">
          {[
            'Custom Branded QR Code & URL (printcart.in/s/your-shop)',
            'Auto ID Card Front+Back A4 PDF Merger',
            'Real-Time Split-Screen Counter Dashboard (Chrome PWA)',
            'Web Audio Bell Chime on customer uploads',
            'Download Ready-to-Print A4/A5 QR Standee PDF',
            'Direct UPI Payment Link for customer payments',
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
            {error}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleStartPayment}
          disabled={loading}
          className="w-full py-3.5 px-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 text-sm transition"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Connecting to PhonePe...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              <span>Pay ₹499 via PhonePe / UPI (0% Fee)</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-center text-[11px] text-slate-400">
          🔒 Secured by PhonePe Payment Gateway • Instant Activation
        </p>
      </div>
    </div>
  );
};
