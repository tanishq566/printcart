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
 * Draws a complete 1200x1700 high-resolution printable Poster on an HTML5 Canvas
 */
export async function drawPosterCanvas(options: PosterOptions): Promise<HTMLCanvasElement> {
  const { shopName, city, slug, quote, rates, targetUrl } = options;

  // High-res canvas: 1200 x 1700 (aspect ratio ~ 1:1.417 matches standard A4)
  const width = 1200;
  const height = 1700;
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
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, width - 14, height - 14);

  // 2. Top Header Accent Banner
  const bannerHeight = 220;
  const grad = ctx.createLinearGradient(0, 0, width, bannerHeight);
  grad.addColorStop(0, quote.primaryColor);
  grad.addColorStop(1, quote.secondaryColor);
  ctx.fillStyle = grad;
  ctx.fillRect(14, 14, width - 28, bannerHeight);

  // Service pill in banner
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  const servicePillY = 48;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(width / 2 - 180, servicePillY, 360, 36, 18);
    ctx.fill();
  }
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚡ OFFICIAL PRINTCART SMART COUNTER', width / 2, servicePillY + 23);

  // Shop Name in Banner
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 46px "Plus Jakarta Sans", system-ui, sans-serif';
  const cleanShopName = (shopName || 'PRINT STUDIO').toUpperCase().slice(0, 35);
  ctx.fillText(cleanShopName, width / 2, 138);

  // City & Shop URL subtitle in Banner
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = '600 20px "Plus Jakarta Sans", system-ui, sans-serif';
  const locText = city ? `${city} • printcart.in/s/${slug}` : `printcart.in/s/${slug}`;
  ctx.fillText(locText, width / 2, 180);

  // 3. Catchy Quote Section
  let curY = 275;

  // Quote Badge
  ctx.fillStyle = quote.accentBg;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(width / 2 - 200, curY, 400, 42, 21);
    ctx.fill();
  }
  ctx.strokeStyle = quote.borderTint;
  ctx.lineWidth = 2;
  if (ctx.stroke) ctx.stroke();

  ctx.fillStyle = quote.primaryColor;
  ctx.font = '800 17px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(quote.badge, width / 2, curY + 27);

  curY += 75;

  // Big Quote Headline
  ctx.fillStyle = '#0F172A';
  ctx.font = '900 44px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(quote.headline, width / 2, curY);

  curY += 45;

  // Quote Subtitle
  ctx.fillStyle = '#475569';
  ctx.font = '500 21px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(quote.subheadline, width / 2, curY);

  curY += 45;

  // 4. White Center QR Standee Card with Drop Shadow
  const cardW = 540;
  const cardH = 580;
  const cardX = (width - cardW) / 2;
  const cardY = curY;

  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
  ctx.shadowBlur = 35;
  ctx.shadowOffsetY = 15;

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(cardX, cardY, cardW, cardH, 32);
  } else {
    ctx.rect(cardX, cardY, cardW, cardH);
  }
  ctx.fill();
  ctx.restore();

  // Card Border
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 3;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 32);
    ctx.stroke();
  }

  // Generate QR Code with Center Logo
  const qrDataUrl = await generateQrWithLogo(targetUrl, 440);
  const qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = qrDataUrl;
  });

  const qrX = cardX + (cardW - 440) / 2;
  const qrY = cardY + 35;
  ctx.drawImage(qrImg, qrX, qrY, 440, 440);

  // Bottom prompt under QR inside card
  ctx.fillStyle = '#0F172A';
  ctx.font = '800 20px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('👉 Camera, Google Lens ya Paytm/GPay se Scan Karein', width / 2, cardY + 510);

  ctx.fillStyle = quote.primaryColor;
  ctx.font = 'bold 15px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(`printcart.in/s/${slug}`, width / 2, cardY + 542);

  // 5. Rates Row (if available)
  curY = cardY + cardH + 40;
  if (rates && (rates.bwRate || rates.colorRate || rates.idCardRate)) {
    const rateBoxW = 780;
    const rateBoxX = (width - rateBoxW) / 2;
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(rateBoxX, curY, rateBoxW, 70, 20);
      ctx.fill();
      ctx.stroke();
    }

    const items = [
      `B&W Print: ₹${rates.bwRate || 2}/page`,
      `Color Print: ₹${rates.colorRate || 10}/page`,
      `ID Card A4 Merge: ₹${rates.idCardRate || 10}`,
    ];

    ctx.font = 'bold 20px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillStyle = '#0F172A';
    const colStep = rateBoxW / items.length;
    items.forEach((item, idx) => {
      ctx.fillText(item, rateBoxX + colStep * idx + colStep / 2, curY + 42);
    });

    curY += 95;
  } else {
    curY += 20;
  }

  // 6. 4-Step How It Works Row
  const stepsBoxW = 960;
  const stepsBoxX = (width - stepsBoxW) / 2;
  const stepW = stepsBoxW / 4;

  const steps = [
    { num: '1', title: 'Scan QR', desc: 'Phone Camera / Lens' },
    { num: '2', title: 'Upload File', desc: 'PDF / Photo / Aadhaar' },
    { num: '3', title: 'Pay via UPI', desc: 'Exact Counter Bill' },
    { num: '4', title: 'Collect Print', desc: 'Instant Ready Output' },
  ];

  steps.forEach((step, idx) => {
    const cx = stepsBoxX + idx * stepW + stepW / 2;
    const cy = curY;

    // Step Number Circle
    ctx.fillStyle = quote.primaryColor;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 18px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(step.num, cx, cy + 6);

    // Title
    ctx.fillStyle = '#0F172A';
    ctx.font = '800 19px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(step.title, cx, cy + 44);

    // Desc
    ctx.fillStyle = '#64748B';
    ctx.font = '500 15px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(step.desc, cx, cy + 70);
  });

  // 7. Footer
  const footerY = height - 70;
  ctx.fillStyle = '#94A3B8';
  ctx.font = '600 16px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('🔒 Zero-Storage Privacy Policy • Files Permanently Auto-Deleted Immediately After Print', width / 2, footerY);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 15px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('Made for Indian Photocopy Shops & Cyber Cafes • printcart.in', width / 2, footerY + 30);

  return canvas;
}

/**
 * Download the Poster as High-Resolution PNG (300 DPI equivalent)
 */
export async function downloadPosterPng(options: PosterOptions, fileName?: string): Promise<void> {
  const canvas = await drawPosterCanvas(options);
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName || `PrintCart_Poster_${options.slug}_${options.quote.id}.png`;
  a.click();
}

/**
 * Generate and download an exact A4 or A5 printable PDF using pdf-lib
 */
export async function downloadPosterPdf(
  options: PosterOptions,
  paperSize: 'A4' | 'A5' = 'A4'
): Promise<void> {
  const canvas = await drawPosterCanvas(options);
  const posterPngUrl = canvas.toDataURL('image/png', 1.0);

  const pdfDoc = await PDFDocument.create();
  // A4: 595.28 x 841.89 pt | A5: 419.53 x 595.28 pt
  const width = paperSize === 'A4' ? 595.28 : 419.53;
  const height = paperSize === 'A4' ? 841.89 : 595.28;

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
  a.download = `PrintCart_${paperSize}_Poster_${options.slug}_${options.quote.id}.pdf`;
  a.click();

  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
}
