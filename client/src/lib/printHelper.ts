import { PDFDocument, degrees } from 'pdf-lib';

/**
 * Loads an image Blob URL cleanly, applies preview rotation if needed,
 * and returns a self-contained DataURL plus final rendered dimensions.
 */
async function prepareImageForPrint(
  blobUrl: string,
  rotationDeg: number
): Promise<{ dataUrl: string; width: number; height: number }> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Failed to load image for printing'));
    el.src = blobUrl;
  });

  if (typeof img.decode === 'function') {
    await img.decode().catch(() => {});
  }

  const normRot = ((rotationDeg % 360) + 360) % 360;
  const swapAxes = normRot === 90 || normRot === 270;
  const outW = swapAxes ? img.naturalHeight || img.height : img.naturalWidth || img.width;
  const outH = swapAxes ? img.naturalWidth || img.width : img.naturalHeight || img.height;

  // Render onto canvas to apply any shopkeeper preview rotation AND guarantee crisp self-contained print image
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, outW);
  canvas.height = Math.max(1, outH);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (normRot !== 0) {
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((normRot * Math.PI) / 180);
    ctx.drawImage(
      img,
      -(img.naturalWidth || img.width) / 2,
      -(img.naturalHeight || img.height) / 2
    );
  } else {
    ctx.drawImage(img, 0, 0);
  }

  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.95),
    width: canvas.width,
    height: canvas.height,
  };
}

/**
 * Generates an exact single-page A4 HTML document sized in physical millimeters
 * so Blink/Chromium NEVER spills an image across 2 pages or outside A4 bounds.
 */
export async function buildSinglePageA4ImageHtml(
  blobUrl: string,
  rotationDeg = 0
): Promise<{ html: string; widthMm: number; heightMm: number; isLandscape: boolean }> {
  const { dataUrl, width, height } = await prepareImageForPrint(blobUrl, rotationDeg);

  // Match sheet orientation for distinctly wide landscape scans (e.g. single ID card / horizontal form)
  const isLandscape = width > height * 1.15;

  // Safe inner dimensions that fit comfortably inside BOTH A4 (210x297mm) and US Letter (215.9x279.4mm)
  const maxW = isLandscape ? 274 : 194;
  const maxH = isLandscape ? 194 : 274;
  const boxH = isLandscape ? 196 : 276;

  const scale = Math.min(maxW / width, maxH / height);
  const widthMm = Number((width * scale).toFixed(2));
  const heightMm = Number((height * scale).toFixed(2));

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>PrintCart A4 Counter Print</title>
    <style>
      @page {
        size: A4 ${isLandscape ? 'landscape' : 'portrait'};
        margin: 0;
      }
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      html, body {
        width: 100%;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff;
        overflow: hidden !important;
      }
      .a4-sheet {
        width: 100%;
        height: ${boxH}mm;
        max-height: ${boxH}mm;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden !important;
        page-break-before: avoid;
        page-break-after: avoid;
        break-inside: avoid;
      }
      img {
        display: block;
        width: ${widthMm}mm;
        height: ${heightMm}mm;
        max-width: ${maxW}mm;
        max-height: ${maxH}mm;
        object-fit: contain;
      }
    </style>
  </head>
  <body>
    <div class="a4-sheet">
      <img src="${dataUrl}" alt="Document" />
    </div>
  </body>
</html>`;

  return { html, widthMm, heightMm, isLandscape };
}

/**
 * Checks uploaded PDF page boxes; if oversized (> A4) or rotated in preview,
 * scales each page cleanly onto crisp A4 (595.28 x 841.89 pt) keeping vector text intact.
 */
async function normalizePdfForA4(
  blobUrl: string,
  rotationDeg = 0
): Promise<{ url: string; createdTempUrl: boolean }> {
  const normRot = ((rotationDeg % 360) + 360) % 360;
  try {
    const bytes = await fetch(blobUrl).then((r) => r.arrayBuffer());
    const srcDoc = await PDFDocument.load(bytes);
    const pages = srcDoc.getPages();
    if (pages.length === 0) return { url: blobUrl, createdTempUrl: false };

    const needsNormalize =
      normRot !== 0 ||
      pages.some((p) => {
        const { width, height } = p.getSize();
        return Math.max(width, height) > 865 || Math.min(width, height) > 625;
      });

    if (!needsNormalize) {
      return { url: blobUrl, createdTempUrl: false };
    }

    const outDoc = await PDFDocument.create();
    for (const srcPage of pages) {
      const { width: rawW, height: rawH } = srcPage.getSize();
      const embedded = await outDoc.embedPage(srcPage);

      const swapAxes = normRot === 90 || normRot === 270;
      const effW = swapAxes ? rawH : rawW;
      const effH = swapAxes ? rawW : rawH;
      const isLandscape = effW > effH * 1.1;

      const pageW = isLandscape ? 841.89 : 595.28;
      const pageH = isLandscape ? 595.28 : 841.89;
      const margin = 16;
      const availW = pageW - margin * 2;
      const availH = pageH - margin * 2;

      const scale = Math.min(availW / effW, availH / effH);
      const drawW = rawW * scale;
      const drawH = rawH * scale;
      const newPage = outDoc.addPage([pageW, pageH]);

      // Position center cleanly for all 4 right-angle rotations in pdf-lib (CCW degrees)
      if (normRot === 0) {
        newPage.drawPage(embedded, {
          x: (pageW - drawW) / 2,
          y: (pageH - drawH) / 2,
          width: drawW,
          height: drawH,
        });
      } else if (normRot === 90) {
        // Rotate 90deg clockwise = -90deg CCW around origin rotated right
        newPage.drawPage(embedded, {
          x: (pageW - drawH) / 2,
          y: (pageH + drawW) / 2,
          width: drawW,
          height: drawH,
          rotate: degrees(-90),
        });
      } else if (normRot === 180) {
        newPage.drawPage(embedded, {
          x: (pageW + drawW) / 2,
          y: (pageH + drawH) / 2,
          width: drawW,
          height: drawH,
          rotate: degrees(180),
        });
      } else {
        // 270deg clockwise = +90deg CCW
        newPage.drawPage(embedded, {
          x: (pageW + drawH) / 2,
          y: (pageH - drawW) / 2,
          width: drawW,
          height: drawH,
          rotate: degrees(90),
        });
      }
    }

    const outBytes = await outDoc.save();
    const outBlob = new Blob([outBytes as Uint8Array], { type: 'application/pdf' });
    return { url: URL.createObjectURL(outBlob), createdTempUrl: true };
  } catch (err) {
    console.warn('PDF A4 normalize skipped, printing original PDF:', err);
    return { url: blobUrl, createdTempUrl: false };
  }
}

/**
 * Prints an Image or PDF cleanly sized onto A4 sheets via an offscreen iframe.
 * Guarantees uploaded photos/documents fit neatly on a single A4 page instead of overflowing.
 */
export async function printDocumentViaFrame(
  iframe: HTMLIFrameElement | null,
  blobUrl: string,
  mimeType: string | null,
  rotationDeg = 0
): Promise<void> {
  const isPdf = mimeType === 'application/pdf';
  let targetUrl = blobUrl;
  let tempUrlToRevoke: string | null = null;

  if (isPdf) {
    const normalized = await normalizePdfForA4(blobUrl, rotationDeg);
    targetUrl = normalized.url;
    if (normalized.createdTempUrl) tempUrlToRevoke = normalized.url;
  } else {
    const { html } = await buildSinglePageA4ImageHtml(blobUrl, rotationDeg);
    const htmlBlob = new Blob([html], { type: 'text/html' });
    targetUrl = URL.createObjectURL(htmlBlob);
    tempUrlToRevoke = targetUrl;
  }

  const cleanupTempUrl = () => {
    if (tempUrlToRevoke) {
      const toRevoke = tempUrlToRevoke;
      setTimeout(() => URL.revokeObjectURL(toRevoke), 60000);
    }
  };

  if (!iframe) {
    window.open(targetUrl, '_blank')?.print();
    cleanupTempUrl();
    return;
  }

  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      cleanupTempUrl();
      resolve();
    };

    const triggerPrint = async () => {
      try {
        const win = iframe.contentWindow;
        const doc = iframe.contentDocument;
        if (!isPdf && doc?.images?.[0] && typeof doc.images[0].decode === 'function') {
          await doc.images[0].decode().catch(() => {});
        } else if (isPdf) {
          // Small settle tick for Chrome's PDF plugin viewer
          await new Promise((r) => setTimeout(r, 180));
        }
        win?.focus();
        win?.print();
      } catch (err) {
        console.warn('Iframe print failed, opening window fallback:', err);
        window.open(targetUrl, '_blank')?.print();
      } finally {
        finish();
      }
    };

    iframe.onload = () => {
      void triggerPrint();
    };

    // Safety fallback if onload doesn't fire within 3s
    setTimeout(finish, 3000);

    // Clear srcdoc just in case, and load target Blob URL cleanly
    iframe.removeAttribute('srcdoc');
    iframe.src = targetUrl;
  });
}
