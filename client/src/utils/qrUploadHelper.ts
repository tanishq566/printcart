import jsQR from 'jsqr';

export interface ProcessedCustomQrResult {
  customQrUrl: string;
  detectedUpiId: string | null;
  rawQrText: string | null;
}

export function extractUpiIdFromQrText(rawText: string): string | null {
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  const paMatch = trimmed.match(/[?&]pa=([^&\s]+)/i);
  if (paMatch && paMatch[1]) {
    try {
      return decodeURIComponent(paMatch[1]).trim();
    } catch {
      return paMatch[1].trim();
    }
  }

  if (/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read the selected image file.'));
    };
    img.src = objectUrl;
  });
}

function tryJsQrAtMaxDim(img: HTMLImageElement, maxDim: number): string | null {
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const decoded = jsQR(imageData.data, w, h, { inversionAttempts: 'attemptBoth' });
  return decoded?.data || null;
}

export async function processCustomQrImage(file: File): Promise<ProcessedCustomQrResult> {
  const img = await loadImageFromFile(file);

  let rawQrText: string | null = null;

  // 1. Native BarcodeDetector fast-path (Chromium)
  if ('BarcodeDetector' in window) {
    try {
      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      const codes = await detector.detect(img);
      if (Array.isArray(codes) && codes[0]?.rawValue) {
        rawQrText = String(codes[0].rawValue);
      }
    } catch {
      // Fall back to jsQR below
    }
  }

  // 2. Cross-browser jsQR decode fallback (try 1024px then 1600px for full-screen screenshots)
  if (!rawQrText) {
    rawQrText = tryJsQrAtMaxDim(img, 1024) || tryJsQrAtMaxDim(img, 1600);
  }

  const detectedUpiId = rawQrText ? extractUpiIdFromQrText(rawQrText) : null;

  // 3. Compress a clean scannable preview copy (max 520px side) for DB storage
  const maxOut = 520;
  const outScale = Math.min(1, maxOut / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const outW = Math.max(1, Math.round(img.naturalWidth * outScale));
  const outH = Math.max(1, Math.round(img.naturalHeight * outScale));

  const outCanvas = document.createElement('canvas');
  outCanvas.width = outW;
  outCanvas.height = outH;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) {
    throw new Error('Browser canvas unavailable to process QR image.');
  }
  outCtx.fillStyle = '#ffffff';
  outCtx.fillRect(0, 0, outW, outH);
  outCtx.drawImage(img, 0, 0, outW, outH);

  let customQrUrl = outCanvas.toDataURL('image/webp', 0.86);
  if (!customQrUrl.startsWith('data:image/webp')) {
    customQrUrl = outCanvas.toDataURL('image/jpeg', 0.85);
  }

  return {
    customQrUrl,
    detectedUpiId,
    rawQrText,
  };
}
