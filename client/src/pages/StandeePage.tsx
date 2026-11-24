import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  QrCode,
  Printer,
  Download,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Layers,
  FileDown,
  Image,
  RefreshCw,
  Loader2,
  Check,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import {
  POSTER_QUOTES,
  PosterQuote,
  drawPosterCanvas,
  downloadPosterPng,
  downloadPosterPdf,
} from '../lib/posterGenerator';

export const StandeePage: React.FC = () => {
  const { shop, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [selectedQuote, setSelectedQuote] = useState<PosterQuote>(POSTER_QUOTES[0]);
  const [paperSize, setPaperSize] = useState<'A5' | 'A4'>('A5');
  const [useProductionUrl, setUseProductionUrl] = useState(false);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState<string>('');
  const [isRendering, setIsRendering] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<'none' | 'png' | 'pdf'>('none');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Target URL for QR code
  const targetUrl = shop
    ? useProductionUrl
      ? `https://printcart.in/s/${shop.slug}`
      : `${window.location.origin}/s/${shop.slug}`
    : '';

  // Render high-res live poster canvas whenever options change
  useEffect(() => {
    if (!shop?.slug || !targetUrl) return;
    let active = true;
    setIsRendering(true);

    drawPosterCanvas({
      shopName: shop.shopName || 'PRINT STUDIO',
      city: shop.city,
      slug: shop.slug,
      quote: selectedQuote,
      rates: {
        bwRate: shop.bwRate,
        colorRate: shop.colorRate,
        idCardRate: shop.idCardRate,
      },
      targetUrl,
    })
      .then((canvas) => {
        if (!active) return;
        setPosterPreviewUrl(canvas.toDataURL('image/png'));
      })
      .catch((err) => console.error('Standee preview render error:', err))
      .finally(() => {
        if (active) setIsRendering(false);
      });

    return () => {
      active = false;
    };
  }, [shop, targetUrl, selectedQuote]);

  // Download High-Res Poster PNG (1200x1700)
  const handleDownloadPng = async () => {
    if (!shop?.slug || !targetUrl) return;
    try {
      setDownloadingFormat('png');
      await downloadPosterPng({
        shopName: shop.shopName || 'PRINT STUDIO',
        city: shop.city,
        slug: shop.slug,
        quote: selectedQuote,
        rates: {
          bwRate: shop.bwRate,
          colorRate: shop.colorRate,
          idCardRate: shop.idCardRate,
        },
        targetUrl,
      });
    } catch (err: any) {
      console.error(err);
      alert('Failed to download PNG poster');
    } finally {
      setDownloadingFormat('none');
    }
  };

  // Download Print-Ready A4 / A5 PDF
  const handleDownloadPdf = async () => {
    if (!shop?.slug || !targetUrl) return;
    try {
      setDownloadingFormat('pdf');
      await downloadPosterPdf(
        {
          shopName: shop.shopName || 'PRINT STUDIO',
          city: shop.city,
          slug: shop.slug,
          quote: selectedQuote,
          rates: {
            bwRate: shop.bwRate,
            colorRate: shop.colorRate,
            idCardRate: shop.idCardRate,
          },
          targetUrl,
        },
        paperSize
      );
    } catch (err: any) {
      console.error(err);
      alert('Failed to download PDF');
    } finally {
      setDownloadingFormat('none');
    }
  };

  if (authLoading || !shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1">
            <Link
              to="/dashboard"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Counter Dashboard</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 flex items-center gap-2">
              <QrCode className="w-7 h-7 text-blue-600" />
              <span>Shop Poster & QR Standee Studio</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Chunein apna pasandeeda quote aur 1-click mein high-res A4/A5 poster download karein laminate karke counter par lagane ke liye.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={downloadingFormat !== 'none' || isRendering}
              onClick={handleDownloadPng}
              className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition flex items-center gap-2 shadow-xs"
            >
              {downloadingFormat === 'png' ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              ) : (
                <Image className="w-4 h-4 text-blue-600" />
              )}
              <span>Download Poster (PNG)</span>
            </button>

            <button
              disabled={downloadingFormat !== 'none' || isRendering}
              onClick={handleDownloadPdf}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/25 transition flex items-center gap-2"
            >
              {downloadingFormat === 'pdf' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              <span>Download Print PDF ({paperSize})</span>
            </button>
          </div>
        </div>

        {/* Generator Controls & Live Standee Preview Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* 1. Quote / Slogan Selection */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Choose Poster Quote / Theme:
              </label>
              <div className="space-y-2">
                {POSTER_QUOTES.map((q) => {
                  const isSelected = selectedQuote.id === q.id;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setSelectedQuote(q)}
                      className={`w-full text-left p-3.5 rounded-xl border transition flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 text-blue-950 font-extrabold ring-2 ring-blue-500/20 shadow-xs'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <span
                          className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md inline-block mb-1"
                          style={{
                            color: q.primaryColor,
                            backgroundColor: q.accentBg,
                          }}
                        >
                          {q.badge}
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                          {q.headline}
                        </p>
                        <p className="text-[11px] text-slate-500 font-normal line-clamp-1 mt-0.5">
                          {q.subheadline}
                        </p>
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Paper Size for PDF */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                2. PDF Standee Paper Size:
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'A5', label: 'A5 Size (Tabletop Standee)', desc: '148 × 210 mm • Tabletop Scanner Stand (Recommended)' },
                  { id: 'A4', label: 'A4 Size (Full Sheet)', desc: '210 × 297 mm • Wall / Door Poster' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPaperSize(p.id as 'A4' | 'A5')}
                    className={`p-3 rounded-xl border text-left transition ${
                      paperSize === p.id
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold ring-2 ring-blue-500/20'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-xs font-bold">{p.label}</span>
                    <span className="block text-[10px] text-slate-500 font-normal mt-0.5">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Shop & Rates Details Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Shop Name:</span>
                <span className="font-bold text-slate-900">{shop.shopName}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">City / Location:</span>
                <span className="font-bold text-slate-900">{shop.city || 'Not specified'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Printed Rates Display:</span>
                <span className="font-bold text-emerald-700">
                  B&W: ₹{shop.bwRate} | Color: ₹{shop.colorRate} | ID: ₹{shop.idCardRate}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500 font-medium">Customer Upload Link:</span>
                <a
                  href={`/s/${shop.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>/s/{shop.slug}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Production URL toggle */}
            <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs text-slate-600">
              <span className="font-medium">Force Production Link (printcart.in/s/...):</span>
              <input
                type="checkbox"
                checked={useProductionUrl}
                onChange={(e) => setUseProductionUrl(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Right Preview Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="bg-slate-900 text-white rounded-t-2xl px-5 py-3 w-full max-w-[480px] flex items-center justify-between text-xs font-bold border-t border-x border-slate-800">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Counter Standee Preview</span>
              </span>
              <span className="text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80">
                A5 Tabletop Scanner Size
              </span>
            </div>

            <div className="w-full max-w-[480px] bg-slate-950 p-4 rounded-b-2xl shadow-2xl border border-slate-800 flex items-center justify-center">
              <div className="relative w-full aspect-[1/1.414] bg-white rounded-xl overflow-hidden shadow-xl border-4 border-slate-800 flex items-center justify-center">
                {isRendering ? (
                  <div className="text-center space-y-2 p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">Generating Standee Preview with "P" Logo...</p>
                  </div>
                ) : posterPreviewUrl ? (
                  <img
                    src={posterPreviewUrl}
                    alt="PrintCart Shop Standee"
                    className="w-full h-full object-contain select-none"
                  />
                ) : (
                  <div className="text-slate-400 text-xs">Loading standee...</div>
                )}
              </div>
            </div>

            {/* Quick Action Hint */}
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl w-full max-w-[480px] text-xs text-emerald-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                <strong>PrintCart Guarantee:</strong> QR code ke center mein stylish <strong>"P" badge</strong> embedded hai jo camera ya kisi bhi UPI app (Paytm, PhonePe, GPay, Google Lens) se 100% instant scan hota hai.
              </span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
