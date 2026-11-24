import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  QrCode,
  Printer,
  Download,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Check,
  ExternalLink,
  Layers,
  FileDown,
  Image,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';

type TemplateStyle = 'CLASSIC' | 'MINIMAL' | 'RETAIL';
type PaperSize = 'A4' | 'A5';

export const StandeePage: React.FC = () => {
  const { shop, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<TemplateStyle>('CLASSIC');
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [useProductionUrl, setUseProductionUrl] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [generatingPdf, setGeneratingPdf] = useState(false);

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

  // Generate QR Code data URL whenever targetUrl changes
  useEffect(() => {
    if (!targetUrl) return;
    QRCode.toDataURL(targetUrl, {
      width: 800,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
  }, [targetUrl]);

  // Download QR PNG directly
  const handleDownloadQrPng = () => {
    if (!qrDataUrl || !shop) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `PrintCart_QR_${shop.slug}.png`;
    a.click();
  };

  // Generate & Download Print-Ready PDF via pdf-lib
  const handleDownloadPdf = async () => {
    if (!shop || !qrDataUrl) return;

    try {
      setGeneratingPdf(true);

      const pdfDoc = await PDFDocument.create();

      // Page dimensions in points (72 points = 1 inch)
      // A4: 595.28 x 841.89 pt | A5: 419.53 x 595.28 pt
      const width = paperSize === 'A4' ? 595.28 : 419.53;
      const height = paperSize === 'A4' ? 841.89 : 595.28;
      const scale = paperSize === 'A4' ? 1.0 : 0.707;

      const page = pdfDoc.addPage([width, height]);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Embed high-res QR code image
      const qrBytes = await fetch(qrDataUrl).then((res) => res.arrayBuffer());
      const qrImage = await pdfDoc.embedPng(qrBytes);

      // Safe clean text sanitization (ASCII only for WinAnsi standard font)
      const sanitize = (text: string) => text.replace(/[^\x20-\x7E]/g, ' ').trim();
      const shopTitle = sanitize(shop.shopName || 'PRINT SHOP');

      if (template === 'CLASSIC') {
        // --- TEMPLATE 1: CLASSIC BLUE ---
        // Top Banner
        page.drawRectangle({
          x: 0,
          y: height - 160 * scale,
          width,
          height: 160 * scale,
          color: rgb(0.145, 0.388, 0.921), // #2563EB
        });

        // Banner Subtitle
        page.drawText('SCAN QR TO PRINT', {
          x: 40 * scale,
          y: height - 55 * scale,
          size: 14 * scale,
          font: fontBold,
          color: rgb(0.85, 0.92, 1.0),
        });

        // Banner Shop Name Header
        page.drawText(shopTitle.toUpperCase().slice(0, 32), {
          x: 40 * scale,
          y: height - 100 * scale,
          size: 26 * scale,
          font: fontBold,
          color: rgb(1.0, 1.0, 1.0),
        });

        page.drawText('NO WHATSAPP NEEDED - 100% PRIVATE', {
          x: 40 * scale,
          y: height - 135 * scale,
          size: 11 * scale,
          font: fontBold,
          color: rgb(0.7, 0.95, 0.8),
        });

        // White QR Box in center
        const qrBoxSize = 340 * scale;
        const qrBoxX = (width - qrBoxSize) / 2;
        const qrBoxY = height - 530 * scale;

        page.drawRectangle({
          x: qrBoxX,
          y: qrBoxY,
          width: qrBoxSize,
          height: qrBoxSize,
          color: rgb(1.0, 1.0, 1.0),
          borderColor: rgb(0.85, 0.88, 0.92),
          borderWidth: 1.5,
        });

        // QR Code centered inside box
        const qrImgSize = 300 * scale;
        page.drawImage(qrImage, {
          x: (width - qrImgSize) / 2,
          y: qrBoxY + (qrBoxSize - qrImgSize) / 2,
          width: qrImgSize,
          height: qrImgSize,
        });

        // Steps Instructions Block
        const stepsY = qrBoxY - 55 * scale;
        page.drawText('1. Scan QR with Camera or Google Lens', {
          x: 70 * scale,
          y: stepsY,
          size: 13 * scale,
          font: fontBold,
          color: rgb(0.09, 0.12, 0.18),
        });

        page.drawText('2. Upload Document or Merge Front & Back ID Card', {
          x: 70 * scale,
          y: stepsY - 30 * scale,
          size: 13 * scale,
          font: fontBold,
          color: rgb(0.09, 0.12, 0.18),
        });

        page.drawText('3. Collect Print at Counter (Instant Auto-Delete)', {
          x: 70 * scale,
          y: stepsY - 60 * scale,
          size: 13 * scale,
          font: fontBold,
          color: rgb(0.09, 0.12, 0.18),
        });

        // Viral Growth Footer Strip
        page.drawRectangle({
          x: 0,
          y: 0,
          width,
          height: 55 * scale,
          color: rgb(0.06, 0.09, 0.16),
        });

        page.drawText('Powered by PrintCart - Apni dukan ke liye Rs. 499 mein lagwayein - printcart.in', {
          x: 50 * scale,
          y: 22 * scale,
          size: 10 * scale,
          font: fontBold,
          color: rgb(0.9, 0.9, 0.95),
        });
      } else if (template === 'MINIMAL') {
        // --- TEMPLATE 2: MINIMAL WHITE ---
        // Clean outer frame
        page.drawRectangle({
          x: 20 * scale,
          y: 20 * scale,
          width: width - 40 * scale,
          height: height - 40 * scale,
          color: rgb(1, 1, 1),
          borderColor: rgb(0.1, 0.1, 0.1),
          borderWidth: 2,
        });

        // Shop Name
        page.drawText(shopTitle.toUpperCase().slice(0, 32), {
          x: 45 * scale,
          y: height - 80 * scale,
          size: 24 * scale,
          font: fontBold,
          color: rgb(0.05, 0.05, 0.05),
        });

        page.drawText('SCAN TO PRINT INSTANTLY', {
          x: 45 * scale,
          y: height - 110 * scale,
          size: 12 * scale,
          font: fontBold,
          color: rgb(0.3, 0.3, 0.3),
        });

        // Centered QR
        const qrSize = 320 * scale;
        page.drawImage(qrImage, {
          x: (width - qrSize) / 2,
          y: height - 470 * scale,
          width: qrSize,
          height: qrSize,
        });

        // Notice
        page.drawText('ZERO-STORAGE PRIVACY GUARANTEE', {
          x: 100 * scale,
          y: height - 515 * scale,
          size: 12 * scale,
          font: fontBold,
          color: rgb(0.1, 0.6, 0.3),
        });

        page.drawText('Files are permanently deleted immediately after printing.', {
          x: 80 * scale,
          y: height - 540 * scale,
          size: 10 * scale,
          font: fontRegular,
          color: rgb(0.4, 0.4, 0.4),
        });

        // Footer
        page.drawText('printcart.in | Bharat QR-to-Print', {
          x: 170 * scale,
          y: 35 * scale,
          size: 10 * scale,
          font: fontBold,
          color: rgb(0.2, 0.2, 0.2),
        });
      } else {
        // --- TEMPLATE 3: VIBRANT RETAIL ---
        // Punchy Yellow/Teal retail banner
        page.drawRectangle({
          x: 0,
          y: height - 170 * scale,
          width,
          height: 170 * scale,
          color: rgb(0.96, 0.62, 0.04), // Amber/Orange
        });

        page.drawText('PHOTOCOPY & ONLINE SERVICES', {
          x: 40 * scale,
          y: height - 50 * scale,
          size: 13 * scale,
          font: fontBold,
          color: rgb(0.2, 0.1, 0.0),
        });

        page.drawText(shopTitle.toUpperCase().slice(0, 30), {
          x: 40 * scale,
          y: height - 95 * scale,
          size: 26 * scale,
          font: fontBold,
          color: rgb(0.05, 0.05, 0.05),
        });

        page.drawText('Aadhaar / PAN / Admit Card / PDF Print', {
          x: 40 * scale,
          y: height - 130 * scale,
          size: 12 * scale,
          font: fontBold,
          color: rgb(0.15, 0.1, 0.0),
        });

        // QR Box
        const qrSize = 310 * scale;
        page.drawRectangle({
          x: (width - qrSize - 30 * scale) / 2,
          y: height - 530 * scale,
          width: qrSize + 30 * scale,
          height: qrSize + 30 * scale,
          color: rgb(1, 1, 1),
          borderColor: rgb(0.8, 0.8, 0.8),
          borderWidth: 2,
        });

        page.drawImage(qrImage, {
          x: (width - qrSize) / 2,
          y: height - 515 * scale,
          width: qrSize,
          height: qrSize,
        });

        // Highlights
        const footY = height - 580 * scale;
        page.drawText('NO NUMBER SHARING - 100% PRIVATE', {
          x: 80 * scale,
          y: footY,
          size: 13 * scale,
          font: fontBold,
          color: rgb(0.1, 0.65, 0.4),
        });

        // Footer
        page.drawRectangle({
          x: 0,
          y: 0,
          width,
          height: 50 * scale,
          color: rgb(0.1, 0.1, 0.15),
        });

        page.drawText('Get PrintCart for your shop - Rs. 499 Launch Offer - printcart.in', {
          x: 60 * scale,
          y: 20 * scale,
          size: 10 * scale,
          font: fontBold,
          color: rgb(0.95, 0.95, 0.95),
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `PrintCart_Standee_${shop.slug}_${paperSize}_${template}.pdf`;
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error('PDF export error:', err);
      alert('Failed to generate Standee PDF: ' + (err.message || 'Error'));
    } finally {
      setGeneratingPdf(false);
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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Breadcrumb & Actions */}
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
              <span>A4 / A5 QR Standee Generator</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Print-ready high-resolution standees for your shop counter. Laminate and start printing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadQrPng}
              className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
            >
              <Image className="w-4 h-4 text-slate-500" />
              <span>Download QR PNG</span>
            </button>
            <button
              disabled={generatingPdf}
              onClick={handleDownloadPdf}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/25 transition flex items-center gap-2"
            >
              {generatingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Download Print PDF ({paperSize})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Generator Controls & Live Standee Preview Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Template Selector */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Choose Standee Template:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'CLASSIC', name: 'Classic Blue', color: 'bg-blue-600' },
                  { id: 'MINIMAL', name: 'Minimal White', color: 'bg-slate-800' },
                  { id: 'RETAIL', name: 'Vibrant Retail', color: 'bg-amber-500' },
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => setTemplate(tpl.id as TemplateStyle)}
                    className={`p-3 rounded-xl border text-center transition ${
                      template === tpl.id
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-extrabold ring-2 ring-blue-500/20'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full ${tpl.color} mx-auto mb-1`} />
                    <span className="text-xs font-bold block">{tpl.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Paper Size Selector */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Paper Size:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaperSize('A4')}
                  className={`py-2.5 px-3 rounded-xl border text-center text-xs font-bold transition ${
                    paperSize === 'A4'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  📄 A4 Portrait (Standard Counter)
                </button>
                <button
                  onClick={() => setPaperSize('A5')}
                  className={`py-2.5 px-3 rounded-xl border text-center text-xs font-bold transition ${
                    paperSize === 'A5'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  📑 A5 Compact Stand
                </button>
              </div>
            </div>

            {/* Target URL Options */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Target Standee URL:
              </label>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                  <input
                    type="radio"
                    name="urlType"
                    checked={!useProductionUrl}
                    onChange={() => setUseProductionUrl(false)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Local Dev Origin: {window.location.origin}/s/{shop.slug}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                  <input
                    type="radio"
                    name="urlType"
                    checked={useProductionUrl}
                    onChange={() => setUseProductionUrl(true)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Production Domain: https://printcart.in/s/{shop.slug}</span>
                </label>
              </div>
            </div>

            {/* Tips Card */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Shopkeeper Pro-Tip:
              </span>
              <p className="leading-relaxed">
                Download the PDF, print on glossy photo paper or heavy cardstock (250+ GSM), laminate it, and place it directly on your glass counter or front gate.
              </p>
            </div>
          </div>

          {/* Standee Live Visual Preview (7 cols) */}
          <div className="lg:col-span-7 flex justify-center">
            <div
              className={`w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative ${
                template === 'CLASSIC'
                  ? 'border-blue-600'
                  : template === 'RETAIL'
                  ? 'border-amber-500'
                  : 'border-slate-800'
              }`}
            >
              {/* Standee Header */}
              {template === 'CLASSIC' && (
                <div className="bg-blue-600 text-white p-6 text-center space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-200">
                    SCAN QR TO PRINT
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">{shop.shopName}</h2>
                  <div className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-extrabold tracking-wide">
                    NO WHATSAPP NEEDED • 100% PRIVATE
                  </div>
                </div>
              )}

              {template === 'MINIMAL' && (
                <div className="bg-white border-b-2 border-slate-900 p-6 text-center space-y-1">
                  <h2 className="text-2xl font-black text-slate-950">{shop.shopName}</h2>
                  <span className="text-xs font-extrabold tracking-widest text-slate-500 uppercase">
                    SCAN TO PRINT INSTANTLY
                  </span>
                </div>
              )}

              {template === 'RETAIL' && (
                <div className="bg-amber-500 text-slate-950 p-6 text-center space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-950">
                    PHOTOCOPY & CYBER CAFE
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black">{shop.shopName}</h2>
                  <p className="text-xs font-bold text-amber-900">Aadhaar • PAN • Admit Card • PDF</p>
                </div>
              )}

              {/* Standee Body: QR Code Block */}
              <div className="p-8 text-center space-y-5 bg-white">
                <div className="p-3 bg-white border-2 border-slate-200 rounded-3xl shadow-lg inline-block">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Shop Standee QR"
                      className="w-56 h-56 mx-auto object-contain"
                    />
                  ) : (
                    <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                      Generating QR...
                    </div>
                  )}
                </div>

                {/* 3 Step Instructions */}
                <div className="space-y-2 text-left max-w-xs mx-auto text-xs text-slate-800 font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-extrabold text-[11px] flex items-center justify-center shrink-0">
                      1
                    </span>
                    <span>Scan with Camera or Google Lens</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-extrabold text-[11px] flex items-center justify-center shrink-0">
                      2
                    </span>
                    <span>Upload Document or Auto ID Card Merge</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-extrabold text-[11px] flex items-center justify-center shrink-0">
                      3
                    </span>
                    <span>Collect print at counter (Auto-deletes)</span>
                  </div>
                </div>
              </div>

              {/* Viral Growth Footer Strip */}
              <div className="bg-slate-950 text-slate-300 py-3 px-4 text-center text-[10px] font-bold tracking-wide">
                Apni dukan ke liye ₹499 mein lagwayein — printcart.in
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
