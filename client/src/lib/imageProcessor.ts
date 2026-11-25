export type CropMode = 'perspective' | 'box';
export type FilterPreset = 'original' | 'auto' | 'magic' | 'bw' | 'id_boost';
export type AspectPreset = 'free' | 'a4' | 'id_card' | 'passport';

export interface Point2D {
  x: number; // Normalized [0..1]
  y: number; // Normalized [0..1]
}

export interface QuadPoints {
  tl: Point2D;
  tr: Point2D;
  br: Point2D;
  bl: Point2D;
}

export interface BoxCrop {
  x: number; // Normalized [0..1]
  y: number; // Normalized [0..1]
  w: number; // Normalized [0..1]
  h: number; // Normalized [0..1]
}

export interface AdjustmentValues {
  brightness: number; // -40 to +40 (0 = neutral)
  contrast: number;   // -40 to +40 (0 = neutral)
  sharpness: number;  // 0 to 100 (0 = preset default)
}

export interface EditorState {
  cropMode: CropMode;
  quad: QuadPoints;
  box: BoxCrop;
  aspectPreset: AspectPreset;
  straightenDeg: number; // -15 to +15 (applies cleanly in box mode)
  rotation90: number; // 0, 1, 2, 3 clockwise 90-degree turns
  preset: FilterPreset;
  adjustments: AdjustmentValues;
}

export const DEFAULT_ADJUSTMENTS: AdjustmentValues = {
  brightness: 0,
  contrast: 0,
  sharpness: 0,
};

export const FULL_QUAD: QuadPoints = {
  tl: { x: 0.04, y: 0.04 },
  tr: { x: 0.96, y: 0.04 },
  br: { x: 0.96, y: 0.96 },
  bl: { x: 0.04, y: 0.96 },
};

export const FULL_BOX: BoxCrop = {
  x: 0.03,
  y: 0.03,
  w: 0.94,
  h: 0.94,
};

export function clamp(val: number, min: number, max: number): number {
  return val < min ? min : val > max ? max : val;
}

/**
 * Loads a File into a print-optimal normalized Canvas (auto-handles browser EXIF rotation
 * and caps max dimension to protect mobile browser memory).
 */
export async function loadFileToCanvas(file: File, maxDim = 2200): Promise<HTMLCanvasElement> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Failed to decode image file'));
      el.src = objectUrl;
    });

    const srcW = img.naturalWidth || img.width;
    const srcH = img.naturalHeight || img.height;
    const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
    const w = Math.max(1, Math.round(srcW * scale));
    const h = Math.max(1, Math.round(srcH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return canvas;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Downscales an existing canvas to a target max dimension for ultra-fast interactive preview.
 */
export function downscaleCanvas(source: HTMLCanvasElement, maxDim = 850): HTMLCanvasElement {
  const scale = Math.min(1, maxDim / Math.max(source.width, source.height));
  if (scale >= 0.99) {
    const clone = document.createElement('canvas');
    clone.width = source.width;
    clone.height = source.height;
    clone.getContext('2d', { willReadFrequently: true })!.drawImage(source, 0, 0);
    return clone;
  }

  const w = Math.max(1, Math.round(source.width * scale));
  const h = Math.max(1, Math.round(source.height * scale));
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, w, h);
  return out;
}

/**
 * Rotates a canvas 90 degrees clockwise cleanly.
 */
export function rotateCanvas90CW(source: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = source.height;
  out.height = source.width;
  const ctx = out.getContext('2d', { willReadFrequently: true })!;
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(source, -source.width / 2, -source.height / 2);
  return out;
}

/**
 * Rotates normalized quad coordinates 90 degrees clockwise to match rotateCanvas90CW.
 */
export function rotateQuad90CW(quad: QuadPoints): QuadPoints {
  const rotPt = (p: Point2D): Point2D => ({ x: clamp(1 - p.y, 0, 1), y: clamp(p.x, 0, 1) });
  // After 90deg CW rotation: old bl becomes new tl, old tl becomes new tr, etc.
  return {
    tl: rotPt(quad.bl),
    tr: rotPt(quad.tl),
    br: rotPt(quad.tr),
    bl: rotPt(quad.br),
  };
}

/**
 * Rotates normalized box crop 90 degrees clockwise to match rotateCanvas90CW.
 */
export function rotateBox90CW(box: BoxCrop): BoxCrop {
  const newX = clamp(1 - (box.y + box.h), 0, 1);
  const newY = clamp(box.x, 0, 1);
  return {
    x: newX,
    y: newY,
    w: clamp(box.h, 0.05, 1 - newX),
    h: clamp(box.w, 0.05, 1 - newY),
  };
}

/**
 * Computes numeric aspect ratio (width / height) for preset locks, or null for free.
 */
export function getAspectRatioValue(
  preset: AspectPreset,
  imgWidth: number,
  imgHeight: number
): number | null {
  switch (preset) {
    case 'a4':
      return imgWidth >= imgHeight ? 297 / 210 : 210 / 297;
    case 'id_card':
      return imgWidth >= imgHeight ? 85.6 / 54 : 54 / 85.6;
    case 'passport':
      return 35 / 45;
    default:
      return null;
  }
}

/**
 * Adjusts a BoxCrop cleanly to fit an aspect ratio inside [0..1] normalized coordinates.
 */
export function fitBoxToAspect(
  box: BoxCrop,
  aspectRatio: number | null,
  imgWidth: number,
  imgHeight: number
): BoxCrop {
  if (!aspectRatio || imgWidth <= 0 || imgHeight <= 0) return box;

  const imgRatio = imgWidth / imgHeight;
  // Target normalized w / h ratio so pixel dimensions match aspectRatio
  const normRatio = aspectRatio / imgRatio;

  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;

  let w = box.w;
  let h = w / normRatio;

  if (h > 0.96) {
    h = 0.96;
    w = h * normRatio;
  }
  if (w > 0.96) {
    w = 0.96;
    h = w / normRatio;
  }

  const x = clamp(cx - w / 2, 0.01, 0.99 - w);
  const y = clamp(cy - h / 2, 0.01, 0.99 - h);

  return { x, y, w, h };
}

/**
 * Lightweight, fast Smart Document Bound Heuristic (<20ms):
 * Scans inward from all 4 outer edges looking for clear uniform desk/table borders
 * relative to center document brightness/texture. Falls back safely to 4% inset
 * when borders aren't distinct so text is NEVER accidentally clipped.
 */
export function detectDocumentQuad(source: HTMLCanvasElement): QuadPoints {
  try {
    const thumb = downscaleCanvas(source, 160);
    const w = thumb.width;
    const h = thumb.height;
    if (w < 40 || h < 40) return { ...FULL_QUAD };

    const ctx = thumb.getContext('2d', { willReadFrequently: true })!;
    const data = ctx.getImageData(0, 0, w, h).data;

    const lum = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const idx = i * 4;
      lum[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    }

    // Center region stats (middle 40% box)
    let centerSum = 0;
    let centerCount = 0;
    const cx0 = Math.floor(w * 0.3);
    const cx1 = Math.floor(w * 0.7);
    const cy0 = Math.floor(h * 0.3);
    const cy1 = Math.floor(h * 0.7);
    for (let y = cy0; y < cy1; y++) {
      for (let x = cx0; x < cx1; x++) {
        centerSum += lum[y * w + x];
        centerCount++;
      }
    }
    const centerMean = centerSum / Math.max(1, centerCount);

    // Outer edge ring stats (outer 3px frame)
    let edgeSum = 0;
    let edgeCount = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (x < 3 || x >= w - 3 || y < 3 || y >= h - 3) {
          edgeSum += lum[y * w + x];
          edgeCount++;
        }
      }
    }
    const edgeMean = edgeSum / Math.max(1, edgeCount);

    // If outer margin isn't noticeably darker/different from page center, keep safe FULL_QUAD
    const lumDiff = Math.abs(centerMean - edgeMean);
    if (lumDiff < 26) {
      return { ...FULL_QUAD };
    }

    // Threshold halfway between dark outer table and brighter document page
    const thresh = (edgeMean + centerMean) * 0.5;
    const isPage = (val: number) =>
      centerMean > edgeMean ? val >= thresh : val <= thresh;

    // Scan rows from top/bottom and cols from left/right (limit max trim to 25% per side for safety)
    const maxTrimX = Math.floor(w * 0.25);
    const maxTrimY = Math.floor(h * 0.25);

    let topY = 0;
    for (let y = 0; y < maxTrimY; y++) {
      let pageHits = 0;
      for (let x = Math.floor(w * 0.2); x < Math.floor(w * 0.8); x++) {
        if (isPage(lum[y * w + x])) pageHits++;
      }
      if (pageHits > (w * 0.6) * 0.55) {
        topY = y;
        break;
      }
    }

    let botY = h - 1;
    for (let y = h - 1; y >= h - maxTrimY; y--) {
      let pageHits = 0;
      for (let x = Math.floor(w * 0.2); x < Math.floor(w * 0.8); x++) {
        if (isPage(lum[y * w + x])) pageHits++;
      }
      if (pageHits > (w * 0.6) * 0.55) {
        botY = y;
        break;
      }
    }

    let leftX = 0;
    for (let x = 0; x < maxTrimX; x++) {
      let pageHits = 0;
      for (let y = Math.floor(h * 0.2); y < Math.floor(h * 0.8); y++) {
        if (isPage(lum[y * w + x])) pageHits++;
      }
      if (pageHits > (h * 0.6) * 0.55) {
        leftX = x;
        break;
      }
    }

    let rightX = w - 1;
    for (let x = w - 1; x >= w - maxTrimX; x--) {
      let pageHits = 0;
      for (let y = Math.floor(h * 0.2); y < Math.floor(h * 0.8); y++) {
        if (isPage(lum[y * w + x])) pageHits++;
      }
      if (pageHits > (h * 0.6) * 0.55) {
        rightX = x;
        break;
      }
    }

    const nx0 = clamp(leftX / w, 0.02, 0.28);
    const ny0 = clamp(topY / h, 0.02, 0.28);
    const nx1 = clamp((rightX + 1) / w, 0.72, 0.98);
    const ny1 = clamp((botY + 1) / h, 0.72, 0.98);

    // Ensure healthy bounding box area
    if (nx1 - nx0 < 0.45 || ny1 - ny0 < 0.45) {
      return { ...FULL_QUAD };
    }

    return {
      tl: { x: nx0, y: ny0 },
      tr: { x: nx1, y: ny0 },
      br: { x: nx1, y: ny1 },
      bl: { x: nx0, y: ny1 },
    };
  } catch {
    return { ...FULL_QUAD };
  }
}

/**
 * Solves an 8x8 linear system Ax = b via Gaussian elimination with partial pivoting
 * to find projective homography coefficients [h0..h7] (h8 = 1).
 */
function solveHomography(
  srcPts: [number, number][],
  dstPts: [number, number][]
): number[] {
  // Build 8x9 augmented matrix mapping dst (u,v) -> src (x,y)
  const M: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = srcPts[i];
    const [u, v] = dstPts[i];
    M.push([u, v, 1, 0, 0, 0, -x * u, -x * v, x]);
    M.push([0, 0, 0, u, v, 1, -y * u, -y * v, y]);
  }

  const n = 8;
  for (let col = 0; col < n; col++) {
    let maxRow = col;
    let maxVal = Math.abs(M[col][col]);
    for (let row = col + 1; row < n; row++) {
      const v = Math.abs(M[row][col]);
      if (v > maxVal) {
        maxVal = v;
        maxRow = row;
      }
    }
    if (maxRow !== col) {
      const tmp = M[col];
      M[col] = M[maxRow];
      M[maxRow] = tmp;
    }

    const pivot = M[col][col];
    if (Math.abs(pivot) < 1e-10) continue;

    for (let j = col; j <= n; j++) {
      M[col][j] /= pivot;
    }

    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = M[row][col];
      for (let j = col; j <= n; j++) {
        M[row][j] -= factor * M[col][j];
      }
    }
  }

  return M.map((row) => row[n]);
}

/**
 * Performs 4-corner perspective warp (homography with bilinear interpolation)
 * to turn skewed document photos into flat crisp rectangles.
 */
export function warpPerspective(
  source: HTMLCanvasElement,
  quad: QuadPoints,
  maxOutDim = 2200,
  targetAspect: number | null = null
): HTMLCanvasElement {
  const sw = source.width;
  const sh = source.height;

  const tl: [number, number] = [quad.tl.x * sw, quad.tl.y * sh];
  const tr: [number, number] = [quad.tr.x * sw, quad.tr.y * sh];
  const br: [number, number] = [quad.br.x * sw, quad.br.y * sh];
  const bl: [number, number] = [quad.bl.x * sw, quad.bl.y * sh];

  const dist = (a: [number, number], b: [number, number]) =>
    Math.hypot(b[0] - a[0], b[1] - a[1]);

  const topW = dist(tl, tr);
  const botW = dist(bl, br);
  const leftH = dist(tl, bl);
  const rightH = dist(tr, br);

  let outW = Math.max(40, Math.round((topW + botW) / 2));
  let outH = Math.max(40, Math.round((leftH + rightH) / 2));

  if (targetAspect && targetAspect > 0) {
    // Preserve dominant area while enforcing selected print aspect ratio
    const area = outW * outH;
    outW = Math.max(40, Math.round(Math.sqrt(area * targetAspect)));
    outH = Math.max(40, Math.round(outW / targetAspect));
  }

  const scale = Math.min(1, maxOutDim / Math.max(outW, outH));
  outW = Math.max(40, Math.round(outW * scale));
  outH = Math.max(40, Math.round(outH * scale));

  const H = solveHomography(
    [tl, tr, br, bl],
    [
      [0, 0],
      [outW - 1, 0],
      [outW - 1, outH - 1],
      [0, outH - 1],
    ]
  );

  const srcCtx = source.getContext('2d', { willReadFrequently: true })!;
  const srcData = srcCtx.getImageData(0, 0, sw, sh).data;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = outW;
  outCanvas.height = outH;
  const outCtx = outCanvas.getContext('2d', { willReadFrequently: true })!;
  const outImg = outCtx.createImageData(outW, outH);
  const dst = outImg.data;

  const [h0, h1, h2, h3, h4, h5, h6, h7] = H;
  const maxX = sw - 1;
  const maxY = sh - 1;

  for (let v = 0; v < outH; v++) {
    const vH1 = h1 * v + h2;
    const vH4 = h4 * v + h5;
    const vH7 = h7 * v + 1;
    let dstIdx = v * outW * 4;

    for (let u = 0; u < outW; u++) {
      const denom = h6 * u + vH7;
      const sx = (h0 * u + vH1) / denom;
      const sy = (h3 * u + vH4) / denom;

      // Clamp coordinates smoothly inside source bounds
      const cx = sx < 0 ? 0 : sx > maxX ? maxX : sx;
      const cy = sy < 0 ? 0 : sy > maxY ? maxY : sy;

      const x0 = cx | 0;
      const y0 = cy | 0;
      const x1 = x0 < maxX ? x0 + 1 : maxX;
      const y1 = y0 < maxY ? y0 + 1 : maxY;
      const fx = cx - x0;
      const fy = cy - y0;
      const fx1 = 1 - fx;
      const fy1 = 1 - fy;

      const w00 = fx1 * fy1;
      const w10 = fx * fy1;
      const w01 = fx1 * fy;
      const w11 = fx * fy;

      const i00 = (y0 * sw + x0) * 4;
      const i10 = (y0 * sw + x1) * 4;
      const i01 = (y1 * sw + x0) * 4;
      const i11 = (y1 * sw + x1) * 4;

      dst[dstIdx] = srcData[i00] * w00 + srcData[i10] * w10 + srcData[i01] * w01 + srcData[i11] * w11;
      dst[dstIdx + 1] = srcData[i00 + 1] * w00 + srcData[i10 + 1] * w10 + srcData[i01 + 1] * w01 + srcData[i11 + 1] * w11;
      dst[dstIdx + 2] = srcData[i00 + 2] * w00 + srcData[i10 + 2] * w10 + srcData[i01 + 2] * w01 + srcData[i11 + 2] * w11;
      dst[dstIdx + 3] = 255;
      dstIdx += 4;
    }
  }

  outCtx.putImageData(outImg, 0, 0);
  return outCanvas;
}

/**
 * Generates a canvas with fine straighten angle applied cleanly inside original bounds
 * (fills tiny outer corner wedges crisp white for ink-free printing).
 */
export function renderStraightenedCanvas(
  source: HTMLCanvasElement,
  straightenDeg: number
): HTMLCanvasElement {
  if (Math.abs(straightenDeg) < 0.1) return source;
  const out = document.createElement('canvas');
  out.width = source.width;
  out.height = source.height;
  const ctx = out.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate((straightenDeg * Math.PI) / 180);
  ctx.drawImage(source, -source.width / 2, -source.height / 2);
  return out;
}

/**
 * Performs standard rectangular crop from a canvas (after optional straighten).
 */
export function cropBoxCanvas(
  source: HTMLCanvasElement,
  box: BoxCrop,
  straightenDeg: number,
  maxOutDim = 2200
): HTMLCanvasElement {
  const base = renderStraightenedCanvas(source, straightenDeg);
  const sx = clamp(Math.round(box.x * base.width), 0, base.width - 10);
  const sy = clamp(Math.round(box.y * base.height), 0, base.height - 10);
  const sw = clamp(Math.round(box.w * base.width), 10, base.width - sx);
  const sh = clamp(Math.round(box.h * base.height), 10, base.height - sy);

  const scale = Math.min(1, maxOutDim / Math.max(sw, sh));
  const outW = Math.max(10, Math.round(sw * scale));
  const outH = Math.max(10, Math.round(sh * scale));

  const out = document.createElement('canvas');
  out.width = outW;
  out.height = outH;
  const ctx = out.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(base, sx, sy, sw, sh, 0, 0, outW, outH);
  return out;
}

/**
 * Estimates smooth local background illumination (for shadow removal in Magic Doc & B&W Xerox)
 * by downscaling, applying local maximum (morphological dilate) to ignore thin dark ink strokes,
 * box-blurring smoothly, and bilinearly upsampling back. O(N) complexity & super fast!
 */
function computeLocalPaperBackground(
  data: Uint8ClampedArray,
  w: number,
  h: number
): Uint8Array {
  const gridScale = Math.max(3, Math.round(Math.max(w, h) / 145));
  const gw = Math.max(8, Math.ceil(w / gridScale));
  const gh = Math.max(8, Math.ceil(h / gridScale));

  const blockR = new Uint8Array(gw * gh);
  const blockG = new Uint8Array(gw * gh);
  const blockB = new Uint8Array(gw * gh);

  // Use ~88th percentile approximation via block max of 2x2 sub-samples to avoid sensor noise speckles
  for (let gy = 0; gy < gh; gy++) {
    const yStart = Math.min(h - 1, gy * gridScale);
    const yEnd = Math.min(h, yStart + gridScale);
    for (let gx = 0; gx < gw; gx++) {
      const xStart = Math.min(w - 1, gx * gridScale);
      const xEnd = Math.min(w, xStart + gridScale);
      let maxR = 0;
      let maxG = 0;
      let maxB = 0;

      // Sample step 2 inside block for speed
      for (let y = yStart; y < yEnd; y += 2) {
        let idx = (y * w + xStart) * 4;
        for (let x = xStart; x < xEnd; x += 2) {
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          if (r > maxR) maxR = r;
          if (g > maxG) maxG = g;
          if (b > maxB) maxB = b;
          idx += 8;
        }
      }
      const gIdx = gy * gw + gx;
      blockR[gIdx] = maxR;
      blockG[gIdx] = maxG;
      blockB[gIdx] = maxB;
    }
  }

  // Dilate radius 1 (3x3 max) + 2x smooth separable blur on the tiny gw*gh grid
  const smoothChannel = (src: Uint8Array): Uint8Array => {
    const dilated = new Uint8Array(gw * gh);
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        let mx = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const yy = clamp(y + dy, 0, gh - 1);
          for (let dx = -1; dx <= 1; dx++) {
            const xx = clamp(x + dx, 0, gw - 1);
            const v = src[yy * gw + xx];
            if (v > mx) mx = v;
          }
        }
        dilated[y * gw + x] = mx;
      }
    }

    const temp = new Uint8Array(gw * gh);
    const out = new Uint8Array(gw * gh);
    // Pass 1 horizontal 5-tap blur
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        let sum = 0;
        for (let k = -2; k <= 2; k++) {
          sum += dilated[y * gw + clamp(x + k, 0, gw - 1)];
        }
        temp[y * gw + x] = (sum / 5) | 0;
      }
    }
    // Pass 2 vertical 5-tap blur
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        let sum = 0;
        for (let k = -2; k <= 2; k++) {
          sum += temp[clamp(y + k, 0, gh - 1) * gw + x];
        }
        out[y * gw + x] = Math.max(24, (sum / 5) | 0);
      }
    }
    return out;
  };

  const bgR = smoothChannel(blockR);
  const bgG = smoothChannel(blockG);
  const bgB = smoothChannel(blockB);

  // Bilinearly upsample to full image (interleaved RGB)
  const fullBg = new Uint8Array(w * h * 3);
  for (let y = 0; y < h; y++) {
    const gyf = (y + 0.5) / gridScale - 0.5;
    const gy0 = clamp(Math.floor(gyf), 0, gh - 1);
    const gy1 = clamp(gy0 + 1, 0, gh - 1);
    const fy = clamp(gyf - gy0, 0, 1);
    const fy1 = 1 - fy;

    for (let x = 0; x < w; x++) {
      const gxf = (x + 0.5) / gridScale - 0.5;
      const gx0 = clamp(Math.floor(gxf), 0, gw - 1);
      const gx1 = clamp(gx0 + 1, 0, gw - 1);
      const fx = clamp(gxf - gx0, 0, 1);
      const fx1 = 1 - fx;

      const w00 = fx1 * fy1;
      const w10 = fx * fy1;
      const w01 = fx1 * fy;
      const w11 = fx * fy;

      const i00 = gy0 * gw + gx0;
      const i10 = gy0 * gw + gx1;
      const i01 = gy1 * gw + gx0;
      const i11 = gy1 * gw + gx1;

      const outIdx = (y * w + x) * 3;
      fullBg[outIdx] = bgR[i00] * w00 + bgR[i10] * w10 + bgR[i01] * w01 + bgR[i11] * w11;
      fullBg[outIdx + 1] = bgG[i00] * w00 + bgG[i10] * w10 + bgG[i01] * w01 + bgG[i11] * w11;
      fullBg[outIdx + 2] = bgB[i00] * w00 + bgB[i10] * w10 + bgB[i01] * w01 + bgB[i11] * w11;
    }
  }

  return fullBg;
}

/**
 * Fast 3x3 Unsharp Mask sharpening on RGBA pixel array in-place.
 */
function applyUnsharpMask(data: Uint8ClampedArray, w: number, h: number, amount: number): void {
  if (amount <= 0.01) return;
  const copy = new Uint8ClampedArray(data);
  const stride = w * 4;

  for (let y = 1; y < h - 1; y++) {
    let idx = (y * w + 1) * 4;
    for (let x = 1; x < w - 1; x++) {
      for (let c = 0; c < 3; c++) {
        const i = idx + c;
        const center = copy[i];
        const blur =
          (copy[i - 4] + copy[i + 4] + copy[i - stride] + copy[i + stride] + center * 4) * 0.125;
        const val = center + amount * (center - blur);
        data[i] = val < 0 ? 0 : val > 255 ? 255 : val;
      }
      idx += 4;
    }
  }
}

/**
 * Applies print-ready Document & Image Enhancement presets + manual adjustments directly to canvas.
 */
export function applyEnhancement(
  canvas: HTMLCanvasElement,
  preset: FilterPreset,
  adjustments: AdjustmentValues
): HTMLCanvasElement {
  const w = canvas.width;
  const h = canvas.height;
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const outCtx = out.getContext('2d', { willReadFrequently: true })!;
  const srcCtx = canvas.getContext('2d', { willReadFrequently: true })!;
  const imgData = srcCtx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const pixelCount = w * h;

  let sharpAmount = adjustments.sharpness / 100;

  if (preset === 'auto' || preset === 'id_boost') {
    // Compute 0.5% - 99% channel percentiles for natural Auto-Levels & White Balance
    const histR = new Uint32Array(256);
    const histG = new Uint32Array(256);
    const histB = new Uint32Array(256);

    const step = pixelCount > 250000 ? 4 : 1;
    let sampled = 0;
    for (let i = 0; i < data.length; i += 4 * step) {
      histR[data[i]]++;
      histG[data[i + 1]]++;
      histB[data[i + 2]]++;
      sampled++;
    }

    const findPercentile = (hist: Uint32Array, pct: number) => {
      const target = sampled * pct;
      let acc = 0;
      for (let v = 0; v < 256; v++) {
        acc += hist[v];
        if (acc >= target) return v;
      }
      return 255;
    };

    // Conservative clipping limits so dark photos don't clip and bright highlights stay safe
    const loR = Math.min(findPercentile(histR, 0.008), 55);
    const hiR = Math.max(findPercentile(histR, 0.992), 185);
    const loG = Math.min(findPercentile(histG, 0.008), 55);
    const hiG = Math.max(findPercentile(histG, 0.992), 185);
    const loB = Math.min(findPercentile(histB, 0.008), 55);
    const hiB = Math.max(findPercentile(histB, 0.992), 185);

    const scaleR = 255 / Math.max(40, hiR - loR);
    const scaleG = 255 / Math.max(40, hiG - loG);
    const scaleB = 255 / Math.max(40, hiB - loB);

    const isId = preset === 'id_boost';
    // Gentle background leveling blend for ID cards so shadows lighten without killing holographic hues
    const bg = isId ? computeLocalPaperBackground(data, w, h) : null;

    for (let p = 0; p < pixelCount; p++) {
      const idx = p * 4;
      let r = clamp((data[idx] - loR) * scaleR, 0, 255);
      let g = clamp((data[idx + 1] - loG) * scaleG, 0, 255);
      let b = clamp((data[idx + 2] - loB) * scaleB, 0, 255);

      if (isId && bg) {
        const bIdx = p * 3;
        const normR = clamp((r / Math.max(30, bg[bIdx])) * 255, 0, 255);
        const normG = clamp((g / Math.max(30, bg[bIdx + 1])) * 255, 0, 255);
        const normB = clamp((b / Math.max(30, bg[bIdx + 2])) * 255, 0, 255);

        // 35% illumination leveling + slight vibrance/contrast boost for clear Aadhaar/PAN photos
        r = r * 0.65 + normR * 0.35;
        g = g * 0.65 + normG * 0.35;
        b = b * 0.65 + normB * 0.35;

        // Gentle brightness lift & clarity
        r = clamp((r - 128) * 1.1 + 134, 0, 255);
        g = clamp((g - 128) * 1.1 + 134, 0, 255);
        b = clamp((b - 128) * 1.1 + 134, 0, 255);
      } else {
        // Gentle clarity & gamma lift (gamma ~0.92 lookup-style fast mix)
        r = clamp((r - 128) * 1.07 + 132, 0, 255);
        g = clamp((g - 128) * 1.07 + 132, 0, 255);
        b = clamp((b - 128) * 1.07 + 132, 0, 255);
      }

      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
    }

    sharpAmount = Math.max(sharpAmount, isId ? 0.42 : 0.25);
  } else if (preset === 'magic' || preset === 'bw') {
    const bg = computeLocalPaperBackground(data, w, h);
    const isBw = preset === 'bw';

    for (let p = 0; p < pixelCount; p++) {
      const idx = p * 4;
      const bIdx = p * 3;

      // Divide pixel by local paper surface to erase uneven shadows & yellow cast
      let r = clamp((data[idx] / bg[bIdx]) * 255, 0, 255);
      let g = clamp((data[idx + 1] / bg[bIdx + 1]) * 255, 0, 255);
      let b = clamp((data[idx + 2] / bg[bIdx + 2]) * 255, 0, 255);

      if (isBw) {
        // Xerox crisp B&W curve: push light paper > 205 to pure white, darken ink < 150
        let lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (lum >= 205) {
          lum = 255;
        } else if (lum <= 70) {
          lum = lum * 0.45;
        } else {
          // Smooth high-contrast ramp between 70..205 -> 31..255
          const t = (lum - 70) / 135;
          lum = 31 + t * t * 224;
        }
        data[idx] = lum;
        data[idx + 1] = lum;
        data[idx + 2] = lum;
      } else {
        // Magic Doc Clean: Keep ink colors rich while snapping grey paper to pure white
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        if (lum > 212 && maxC - minC < 26) {
          // Neutral paper background -> pure crisp white (saves ink!)
          data[idx] = 255;
          data[idx + 1] = 255;
          data[idx + 2] = 255;
        } else {
          // Stretch document ink contrast cleanly
          const contrastFactor = 1.28;
          data[idx] = clamp((r - 140) * contrastFactor + 140, 0, 255);
          data[idx + 1] = clamp((g - 140) * contrastFactor + 140, 0, 255);
          data[idx + 2] = clamp((b - 140) * contrastFactor + 140, 0, 255);
        }
      }
    }

    sharpAmount = Math.max(sharpAmount, isBw ? 0.55 : 0.48);
  }

  // Apply user fine-tune brightness & contrast on top if non-zero
  if (adjustments.brightness !== 0 || adjustments.contrast !== 0) {
    const brightOffset = adjustments.brightness * 1.6;
    const cFactor = Math.pow((100 + adjustments.contrast * 1.3) / 100, 2);

    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp((data[i] - 128) * cFactor + 128 + brightOffset, 0, 255);
      data[i + 1] = clamp((data[i + 1] - 128) * cFactor + 128 + brightOffset, 0, 255);
      data[i + 2] = clamp((data[i + 2] - 128) * cFactor + 128 + brightOffset, 0, 255);
    }
  }

  if (sharpAmount > 0.02) {
    applyUnsharpMask(data, w, h, sharpAmount);
  }

  outCtx.putImageData(imgData, 0, 0);
  return out;
}

/**
 * Exports a Canvas cleanly to a JPEG File object + preview DataURL for upload.
 */
export async function exportCanvasToFile(
  canvas: HTMLCanvasElement,
  originalFileName: string,
  quality = 0.92
): Promise<{ file: File; dataUrl: string }> {
  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (b) => {
        if (b) {
          resolve(b);
        } else {
          // Fallback decode dataUrl
          const arr = dataUrl.split(',');
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) u8arr[n] = bstr.charCodeAt(n);
          resolve(new Blob([u8arr], { type: 'image/jpeg' }));
        }
      },
      'image/jpeg',
      quality
    );
  });

  const cleanBase = originalFileName.replace(/\.[^.]+$/, '') || 'document';
  const file = new File([blob], `${cleanBase}_edited.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });

  return { file, dataUrl };
}
