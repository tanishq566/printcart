import QRCode from 'qrcode';
import { PDFDocument } from 'pdf-lib';

export interface PosterQuote {
  id: string;
  badge: string;
  headline: string;
  subheadline: string;
  themeName: string;
  primaryColor: string;
  secondaryColor: string;
  accentBg: string;
  borderTint: string;
}

export const POSTER_QUOTES: PosterQuote[] = [
  {
    id: 'no-whatsapp',
    themeName: 'WhatsApp Chhodo (Blue & Emerald)',
    badge: '🔒 100% PRIVATE • ZERO-STORAGE',
    headline: 'WhatsApp Chhodo, Seedha Print Bhejo!',
    subheadline: 'Personal number share karne ki bilkul zaroorat nahi. QR scan karein aur direct counter par print bhejein.',
    primaryColor: '#2563EB',
    secondaryColor: '#10B981',
    accentBg: '#EEF2FF',
    borderTint: '#C7D2FE',
  },
  {
    id: 'privacy-warning',
    themeName: 'Number Dena Mana Hai (Bold Crimson)',
    badge: '⛔ STRICT PRIVACY WARNING',
    headline: 'Yahan WhatsApp Number Dena Mana Hai!',
    subheadline: 'Apna phone number safe rakhein. QR scan karke document upload karein, print hone par file turant delete.',
    primaryColor: '#DC2626',
    secondaryColor: '#EA580C',
    accentBg: '#FEF2F2',
    borderTint: '#FECACA',
  },
  {
    id: 'id-card-merge',
    themeName: 'Aadhaar / PAN A4 Special (Teal & Cyan)',
    badge: '🪪 CSC & JAN SEVA KENDRA SPECIAL',
    headline: 'Aadhaar & PAN Card A4 Auto-Print Yahan!',
    subheadline: 'Front aur Back side ki photo bhejein — System automatically single A4 page par center-align karke print karega.',
    primaryColor: '#0891B2',
    secondaryColor: '#059669',
    accentBg: '#ECFEFF',
    borderTint: '#A5F3FC',
  },
  {
    id: 'fast-print',
    themeName: 'No Pen Drive / Virus (Amber Gold)',
    badge: '⚡ 10-SECOND FAST COUNTER PRINT',
    headline: 'No Pen Drive • No Virus • Fast Print!',
    subheadline: 'Pen drive lagane ka jhanjhat khatam. Phone se seedha Photo, PDF, Resume aur Forms 1-click mein print karwayein.',
    primaryColor: '#D97706',
    secondaryColor: '#B45309',
    accentBg: '#FFFBEB',
    borderTint: '#FDE68A',
  },
  {
    id: 'smart-counter',
    themeName: 'Smart Counter (Modern Indigo)',
    badge: '🚀 DIGITAL INDIA • SMART COUNTER',
    headline: 'Apni Dukan Ka Smart Counter — Scan & Print',
    subheadline: 'Lambi line mein khade hone ki zaroorat nahi. Scan karein, UPI se pay karein aur 1-minute mein print collect karein.',
    primaryColor: '#4F46E5',
    secondaryColor: '#7C3AED',
    accentBg: '#F5F3FF',
    borderTint: '#DDD6FE',
  },
];

/**
 * Generate high-res QR code with an iconic "P" PrintCart logo in the center
 */
export async function generateQrWithLogo(url: string, size = 900): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  await QRCode.toCanvas(canvas, url, {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'H', // High error correction allows center badge without breaking scan
    color: {
      dark: '#0F172A',
      light: '#FFFFFF',
    },
  });

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas.toDataURL('image/png');

  // Center badge size: ~22% of total QR size
  const centerSize = Math.round(size * 0.22);
  const centerPos = (size - centerSize) / 2;
  const radius = Math.round(centerSize * 0.28);

  // Outer white rounded shield
  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.25)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(centerPos - 5, centerPos - 5, centerSize + 10, centerSize + 10, radius + 2);
  } else {
    ctx.rect(centerPos - 5, centerPos - 5, centerSize + 10, centerSize + 10);
  }
  ctx.fill();
  ctx.restore();

  // Inner gradient badge (Indigo to Blue)
  const grad = ctx.createLinearGradient(centerPos, centerPos, centerPos + centerSize, centerPos + centerSize);
  grad.addColorStop(0, '#4F46E5');
  grad.addColorStop(0.5, '#2563EB');
  grad.addColorStop(1, '#059669');

  ctx.fillStyle = grad;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(centerPos, centerPos, centerSize, centerSize, radius);
  } else {
    ctx.rect(centerPos, centerPos, centerSize, centerSize);
  }
  ctx.fill();

  // Bold "P" symbol in center
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 ${Math.round(centerSize * 0.65)}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('P', size / 2, size / 2 + Math.round(centerSize * 0.03));

  return canvas.toDataURL('image/png');
}

export interface PosterOptions {
  shopName: string;
  city?: string | null;
  slug: string;
  quote: PosterQuote;
  rates?: {
    bwRate?: number | null;
    colorRate?: number | null;
    idCardRate?: number | null;
  };
  targetUrl: string;
}

/**
 * Draws a complete high-resolution printable Scanner Standee (A5 standard 1000x1414) on an HTML5 Canvas
 */
export async function drawPosterCanvas(options: PosterOptions): Promise<HTMLCanvasElement> {
  const { shopName, city, slug, quote, rates, targetUrl } = options;

  // High-res canvas: 1000 x 1414 (exact standard A5 aspect ratio 1:1.414 for tabletop scanner standees)
  const width = 1000;
  const height = 1414;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // 1. Background
  ctx.fillStyle = '#FAFBFD';
  ctx.fillRect(0, 0, width, height);

  // Outer framing border
  ctx.strokeStyle = quote.borderTint;
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, width - 8, height - 8);

  // 2. Top Header Accent Banner
  const bannerHeight = 150;
  const grad = ctx.createLinearGradient(0, 0, width, bannerHeight);
  grad.addColorStop(0, quote.primaryColor);
  grad.addColorStop(1, quote.secondaryColor);
  ctx.fillStyle = grad;
  ctx.fillRect(8, 8, width - 16, bannerHeight);

  // Service pill in banner
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  const servicePillY = 22;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(width / 2 - 140, servicePillY, 280, 26, 13);
    ctx.fill();
  }
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 12px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚡ PRINTCART SMART COUNTER', width / 2, servicePillY + 17);

  // Shop Name in Banner
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 36px "Plus Jakarta Sans", system-ui, sans-serif';
  const cleanShopName = (shopName || 'PRINT STUDIO').toUpperCase().slice(0, 36);
  ctx.fillText(cleanShopName, width / 2, 85);

  // City & Shop URL subtitle in Banner
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.font = '600 16px "Plus Jakarta Sans", system-ui, sans-serif';
  const locText = city ? `${city} • printcart.in/s/${slug}` : `printcart.in/s/${slug}`;
  ctx.fillText(locText, width / 2, 126);

  // 3. Catchy Quote Section
  let curY = 185;

  // Quote Badge
  ctx.fillStyle = quote.accentBg;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(width / 2 - 170, curY, 340, 30, 15);
    ctx.fill();
  }
  ctx.strokeStyle = quote.borderTint;
  ctx.lineWidth = 1.5;
  if (ctx.stroke) ctx.stroke();

  ctx.fillStyle = quote.primaryColor;
  ctx.font = '800 13px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(quote.badge, width / 2, curY + 20);

  curY += 60;

  // Big Quote Headline
  ctx.fillStyle = '#0F172A';
  ctx.font = '900 34px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(quote.headline, width / 2, curY);

  curY += 34;

  // Quote Subtitle
  ctx.fillStyle = '#475569';
  ctx.font = '500 16px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(quote.subheadline, width / 2, curY);

  // 4. White Center QR Standee Card with Drop Shadow (HUGE SCANNER SIZE)
  const cardW = 860;
  const cardH = 920;
  const cardX = (width - cardW) / 2;
  const cardY = 310;

  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.10)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(cardX, cardY, cardW, cardH, 28);
  } else {
    ctx.rect(cardX, cardY, cardW, cardH);
  }
  ctx.fill();
  ctx.restore();

  // Card Border
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2.5;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 28);
    ctx.stroke();
  }

  // Generate Large QR Code with Center "P" Logo (670px size!)
  const qrSize = 670;
  const qrDataUrl = await generateQrWithLogo(targetUrl, qrSize);
  const qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = qrDataUrl;
  });

  const qrX = cardX + (cardW - qrSize) / 2;
  const qrY = cardY + 28;
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  // Under QR prompt inside card
  const promptY = qrY + qrSize + 48;
  ctx.fillStyle = '#0F172A';
  ctx.font = '800 22px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('👉 Camera, Google Lens ya Paytm/GPay se Scan Karein', width / 2, promptY);

  const urlY = promptY + 42;
  ctx.fillStyle = quote.primaryColor;
  ctx.font = 'bold 18px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(`printcart.in/s/${slug}`, width / 2, urlY);

  const helperY = urlY + 36;
  ctx.fillStyle = '#64748B';
  ctx.font = '600 13px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('⚡ Instant Upload • Auto ID Card Merge • 100% Zero-Storage Privacy', width / 2, helperY);

  // 5. Bottom Rates Row (Compact & Clean single strip)
  if (rates && (rates.bwRate || rates.colorRate || rates.idCardRate)) {
    const rateBoxW = 760;
    const rateBoxH = 50;
    const rateBoxX = (width - rateBoxW) / 2;
    const rateBoxY = 1255;

    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(rateBoxX, rateBoxY, rateBoxW, rateBoxH, 25);
      ctx.fill();
      ctx.stroke();
    }

    const items = [
      `B&W Print: ₹${rates.bwRate || 2}/pg`,
      `Color Print: ₹${rates.colorRate || 10}/pg`,
      `ID Card A4: ₹${rates.idCardRate || 10}`,
    ];

    ctx.font = 'bold 16px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillStyle = '#1E293B';
    const colStep = rateBoxW / items.length;
    items.forEach((item, idx) => {
      ctx.fillText(item, rateBoxX + colStep * idx + colStep / 2, rateBoxY + 31);
    });

    // Small footer label under rates
    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 12px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('Official PrintCart Smart Counter Standee', width / 2, 1345);
  } else {
    // If no rates, clean footer label
    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 13px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('Official PrintCart Smart Counter Standee • 100% Zero-Storage', width / 2, 1290);
  }

  return canvas;
}

/**
 * Download the Standee as High-Resolution PNG (300 DPI equivalent)
 */
export async function downloadPosterPng(options: PosterOptions, fileName?: string): Promise<void> {
  const canvas = await drawPosterCanvas(options);
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName || `PrintCart_Standee_${options.slug}_${options.quote.id}.png`;
  a.click();
}

/**
 * Generate and download an exact A5 (tabletop scanner standee) or A4 printable PDF using pdf-lib
 */
export async function downloadPosterPdf(
  options: PosterOptions,
  paperSize: 'A5' | 'A4' = 'A5'
): Promise<void> {
  const canvas = await drawPosterCanvas(options);
  const posterPngUrl = canvas.toDataURL('image/png', 1.0);

  const pdfDoc = await PDFDocument.create();
  // A5: 419.53 x 595.28 pt (Standee Standard) | A4: 595.28 x 841.89 pt
  const width = paperSize === 'A5' ? 419.53 : 595.28;
  const height = paperSize === 'A5' ? 595.28 : 841.89;

  const page = pdfDoc.addPage([width, height]);
  const pngBytes = await fetch(posterPngUrl).then((res) => res.arrayBuffer());
  const img = await pdfDoc.embedPng(pngBytes);

  page.drawImage(img, {
    x: 0,
    y: 0,
    width,
    height,
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as Uint8Array], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = `PrintCart_${paperSize}_Standee_${options.slug}_${options.quote.id}.pdf`;
  a.click();

  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
}
