import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Settings,
  Store,
  DollarSign,
  QrCode,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Power,
  Loader2,
  Sparkles,
  CreditCard,
  Printer,
  Calendar,
  UploadCloud,
  Trash2,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { UpgradeModal } from '../components/UpgradeModal';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { processCustomQrImage } from '../utils/qrUploadHelper';
import { calcTieredPrintTotal } from '../utils/pricing';

export const SettingsPage: React.FC = () => {
  const { shop, refreshShop, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [shopName, setShopName] = useState('');
  const [city, setCity] = useState('');
  const [upiId, setUpiId] = useState('');
  const [customQrUrl, setCustomQrUrl] = useState<string | null>(null);
  const [qrScanFeedback, setQrScanFeedback] = useState<string | null>(null);
  const [processingQr, setProcessingQr] = useState(false);
  const [bwRate, setBwRate] = useState('2');
  const [bwExtraRate, setBwExtraRate] = useState('');
  const [colorRate, setColorRate] = useState('10');
  const [colorExtraRate, setColorExtraRate] = useState('');
  const [idCardRate, setIdCardRate] = useState('10');
  const [isCounterOpen, setIsCounterOpen] = useState(true);

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (shop) {
      setShopName(shop.shopName || '');
      setCity(shop.city || '');
      setUpiId(shop.upiId || '');
      setCustomQrUrl(shop.customQrUrl || null);
      setBwRate(shop.bwRate !== undefined ? shop.bwRate.toString() : '2');
      setBwExtraRate(
        shop.bwExtraRate !== null && shop.bwExtraRate !== undefined
          ? shop.bwExtraRate.toString()
          : ''
      );
      setColorRate(shop.colorRate !== undefined ? shop.colorRate.toString() : '10');
      setColorExtraRate(
        shop.colorExtraRate !== null && shop.colorExtraRate !== undefined
          ? shop.colorExtraRate.toString()
          : ''
      );
      setIdCardRate(shop.idCardRate !== undefined ? shop.idCardRate.toString() : '10');
      setIsCounterOpen(shop.isCounterOpen ?? true);
    }
  }, [shop]);

  const handleCopyUrl = () => {
    if (!shop) return;
    const fullUrl = `${window.location.origin}/s/${shop.slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleCounter = async () => {
    const nextState = !isCounterOpen;
    setIsCounterOpen(nextState);
    try {
      await apiFetch('/shop/settings', {
        method: 'PATCH',
        body: JSON.stringify({ isCounterOpen: nextState }),
      });
      await refreshShop();
      setSuccessMessage(`Counter status changed to: ${nextState ? 'OPEN 🟢' : 'CLOSED 🔴'}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setIsCounterOpen(!nextState); // revert
      setErrorMessage(err.message || 'Failed to update counter state');
    }
  };

  const handleCustomQrUpload = async (file: File) => {
    try {
      setProcessingQr(true);
      setErrorMessage(null);
      setQrScanFeedback(null);
      const result = await processCustomQrImage(file);
      setCustomQrUrl(result.customQrUrl);
      if (result.detectedUpiId) {
        setUpiId(result.detectedUpiId);
        setQrScanFeedback(
          `✓ QR scanned! UPI ID auto-filled: ${result.detectedUpiId} — neeche Save button zaroor dabayein.`
        );
      } else {
        setQrScanFeedback(
          '✓ Custom QR photo ready hai — Save Changes dabakar customer page par live karein.'
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not process the selected QR image.');
    } finally {
      setProcessingQr(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const parsedBw = bwRate.trim() !== '' && !isNaN(Number(bwRate)) ? Number(bwRate) : 2;
    const parsedBwExtra =
      bwExtraRate.trim() !== '' && !isNaN(Number(bwExtraRate)) ? Number(bwExtraRate) : null;
    const parsedColor =
      colorRate.trim() !== '' && !isNaN(Number(colorRate)) ? Number(colorRate) : 10;
    const parsedColorExtra =
      colorExtraRate.trim() !== '' && !isNaN(Number(colorExtraRate))
        ? Number(colorExtraRate)
        : null;
    const parsedIdCard =
      idCardRate.trim() !== '' && !isNaN(Number(idCardRate)) ? Number(idCardRate) : 10;

    try {
      await apiFetch('/shop/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          shopName: shopName.trim(),
          city: city.trim() || null,
          upiId: upiId.trim() || null,
          customQrUrl: customQrUrl || null,
          bwRate: parsedBw,
          bwExtraRate: parsedBwExtra,
          colorRate: parsedColor,
          colorExtraRate: parsedColorExtra,
          idCardRate: parsedIdCard,
          isCounterOpen,
        }),
      });

      await refreshShop();
      setQrScanFeedback(null);
      setSuccessMessage('Shop settings saved successfully! ✓');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const shopUrl = `${window.location.origin}/s/${shop.slug}`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
                Shop Settings & Rates
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800">
                {shop.shopName}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Apni dukan ke print rates, UPI account, aur counter availability manage karein.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/dashboard/standee"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-xs transition"
            >
              <QrCode className="w-4 h-4 text-blue-600" />
              <span>QR Standee</span>
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              <span>Go to Counter</span>
            </Link>
          </div>
        </div>

        {/* Plan Status Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  shop.planStatus === 'ACTIVE_LAUNCH'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {shop.planStatus === 'ACTIVE_LAUNCH' ? (
                  <ShieldCheck className="w-6 h-6" />
                ) : (
                  <Calendar className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">
                    Subscription Plan Status:
                  </h3>
                  {shop.planStatus === 'ACTIVE_LAUNCH' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                      ACTIVE LAUNCH (₹499 Paid)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800">
                      3-DAY FREE TRIAL
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {shop.planStatus === 'ACTIVE_LAUNCH'
                    ? 'Aapki dukan par permanent unlimited access active hai.'
                    : `Trial ends on: ${
                        shop.trialEndsAt ? new Date(shop.trialEndsAt).toLocaleDateString() : '3 days'
                      }. Full counter features enabled.`}
                </p>
              </div>
            </div>

            {shop.planStatus === 'TRIAL' && (
              <button
                type="button"
                onClick={() => setShowUpgradeModal(true)}
                className="px-4 py-2 text-xs sm:text-sm font-extrabold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition flex items-center gap-1.5 self-start sm:self-center"
              >
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Upgrade to ₹499 Offer</span>
              </button>
            )}
          </div>
        </div>

        {/* Customer Upload Link Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Aapka Dedicated Customer QR URL:
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-sm text-slate-800 flex items-center justify-between">
              <span className="truncate">{shopUrl}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 font-semibold text-sm rounded-xl text-slate-700 transition flex items-center justify-center gap-1.5"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
            <a
              href={shopUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 font-semibold text-sm rounded-xl text-blue-700 transition flex items-center justify-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Customer Page</span>
            </a>
          </div>
        </div>

        {/* Feedback Notifications */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm font-semibold text-red-800 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main Settings Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Counter Availability */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <Power className="w-5 h-5 text-blue-600" />
                  <span>Counter Upload Status</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Jab dukan band ho ya lunch break ho, uploads pause kar sakte hain.
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleCounter}
                className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isCounterOpen ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isCounterOpen ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div
              className={`p-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 ${
                isCounterOpen
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isCounterOpen ? 'bg-emerald-600 animate-pulse' : 'bg-red-600'
                }`}
              ></span>
              <span>
                {isCounterOpen
                  ? 'Counter is OPEN 🟢 — Customers can scan QR & upload documents.'
                  : 'Counter is CLOSED 🔴 — Customer page will show a friendly closed banner.'}
              </span>
            </div>
          </div>

          {/* Section: Shop Profile */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2 border-b border-slate-100 pb-3">
              <Store className="w-5 h-5 text-blue-600" />
              <span>Shop Profile Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Shop Name
                </label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-slate-900 text-sm font-medium outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  City / Location
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Patna, Varanasi, Jaipur"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-slate-900 text-sm font-medium outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Owner Phone (Read-Only)
                </label>
                <input
                  type="text"
                  disabled
                  value={shop.ownerPhone}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 text-sm font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Slug (Read-Only)
                </label>
                <input
                  type="text"
                  disabled
                  value={shop.slug}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 text-sm font-mono cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Section: Printing Rates */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2 border-b border-slate-100 pb-3">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span>Customer Printing Rates (₹ in INR)</span>
            </h3>
            <p className="text-xs text-slate-500">
              1st page ka rate aur uske baad (2nd, 3rd, 10th, 100th page) ka extra-page rate alag-alag set kar sakte hain taaki bulk print sasta pade.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              {/* B&W Tiered Card */}
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
                    Black & White — 1st Page
                  </label>
                  <div className="relative mt-1.5">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      required
                      value={bwRate}
                      onChange={(e) => setBwRate(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white rounded-lg border border-slate-300 font-extrabold text-lg text-slate-900"
                    />
                    <span className="text-[11px] text-slate-500 block mt-1">
                      Default 1st page price (A4)
                    </span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-blue-200/80">
                  <label className="block text-[11px] font-bold text-blue-900 uppercase tracking-wider mb-1">
                    After 1st Page (2nd+ Page)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={bwExtraRate}
                      onChange={(e) => setBwExtraRate(e.target.value)}
                      placeholder={`Same (₹${bwRate || 0})`}
                      className="w-full pl-8 pr-3 py-1.5 bg-white rounded-lg border border-slate-300 font-bold text-sm text-slate-900"
                    />
                  </div>
                  <p className="text-[11px] text-blue-800 font-semibold mt-1.5">
                    {bwExtraRate.trim() !== ''
                      ? `Example: 5p = ₹${calcTieredPrintTotal(5, Number(bwRate) || 0, Number(bwExtraRate))} • 10p = ₹${calcTieredPrintTotal(10, Number(bwRate) || 0, Number(bwExtraRate))}`
                      : `Blank = flat ₹${bwRate || 0}/page on all pages`}
                  </p>
                </div>
              </div>

              {/* Color Tiered Card */}
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                    Color Print — 1st Page
                  </label>
                  <div className="relative mt-1.5">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      required
                      value={colorRate}
                      onChange={(e) => setColorRate(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white rounded-lg border border-slate-300 font-extrabold text-lg text-slate-900"
                    />
                    <span className="text-[11px] text-slate-500 block mt-1">
                      Default 1st page price (A4)
                    </span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-amber-200/80">
                  <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                    After 1st Page (2nd+ Page)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={colorExtraRate}
                      onChange={(e) => setColorExtraRate(e.target.value)}
                      placeholder={`Same (₹${colorRate || 0})`}
                      className="w-full pl-8 pr-3 py-1.5 bg-white rounded-lg border border-slate-300 font-bold text-sm text-slate-900"
                    />
                  </div>
                  <p className="text-[11px] text-amber-800 font-semibold mt-1.5">
                    {colorExtraRate.trim() !== ''
                      ? `Example: 5p = ₹${calcTieredPrintTotal(5, Number(colorRate) || 0, Number(colorExtraRate))} • 10p = ₹${calcTieredPrintTotal(10, Number(colorRate) || 0, Number(colorExtraRate))}`
                      : `Blank = flat ₹${colorRate || 0}/page on all pages`}
                  </p>
                </div>
              </div>

              {/* ID Card Rate Card */}
              <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200">
                <label className="block text-xs font-bold text-teal-900 uppercase tracking-wider mb-1">
                  ID Card Merge Rate
                </label>
                <div className="relative mt-2">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={idCardRate}
                    onChange={(e) => setIdCardRate(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white rounded-lg border border-slate-300 font-extrabold text-lg text-slate-900"
                  />
                  <span className="text-[11px] text-slate-500 block mt-1">
                    per merged A4 sheet (Front + Back)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: UPI Payment & Custom QR Setup */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <span>Shop UPI & Custom Payment QR (Customer Direct Payment)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left: Manual UPI ID */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Option 1: Shop UPI ID (Auto Exact-Amount QR)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. vermadigital@okhdfcbank ya 9876543210@paytm"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-slate-900 text-sm font-medium outline-none"
                  />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  💡 <strong>Zero Commission:</strong> UPI ID daalne par PrintCart har customer ke exact bill (e.g. ₹23) ke saath dynamic UPI QR + GPay/PhonePe button bana deta hai. Paise seedha aapke bank me jaate hain.
                </p>
              </div>

              {/* Right: Upload Existing Paytm / PhonePe / GPay QR Photo */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Option 2: Apna Paytm / PhonePe / GPay QR Upload Karein
                  </span>
                  {customQrUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomQrUrl(null);
                        setQrScanFeedback('Custom QR removed. Save Changes dabakar update karein.');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {customQrUrl ? (
                    <div className="w-24 h-24 rounded-xl border border-slate-300 bg-white p-1.5 shrink-0 flex items-center justify-center shadow-xs">
                      <img
                        src={customQrUrl}
                        alt="Uploaded Shop Custom QR"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-white shrink-0 flex flex-col items-center justify-center text-slate-400 text-[10px] font-bold text-center p-2">
                      <QrCode className="w-6 h-6 mb-1" />
                      <span>No QR Photo</span>
                    </div>
                  )}

                  <div className="space-y-2 flex-1 min-w-0">
                    <input
                      id="custom-qr-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleCustomQrUpload(e.target.files[0]);
                          e.target.value = '';
                        }
                      }}
                      className="sr-only"
                    />
                    <label
                      htmlFor="custom-qr-upload"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition shadow-xs"
                    >
                      {processingQr ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UploadCloud className="w-3.5 h-3.5" />
                      )}
                      <span>{customQrUrl ? 'Change QR Image' : 'Upload Custom QR'}</span>
                    </label>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      QR photo upload karte hi UPI ID automatic scan ho jaati hai, aur customer ko aapka original QR dikhane ka option bhi milta hai.
                    </p>
                  </div>
                </div>

                {qrScanFeedback && (
                  <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    {qrScanFeedback}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 transition"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <span>Save All Settings</span>
              )}
            </button>
          </div>
        </form>

        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      </main>

      <Footer />
    </div>
  );
};
