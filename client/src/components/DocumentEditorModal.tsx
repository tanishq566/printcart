import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  X,
  RotateCw,
  Sparkles,
  Check,
  Eye,
  SlidersHorizontal,
  Scan,
  Crop,
  Wand2,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  AdjustmentValues,
  AspectPreset,
  BoxCrop,
  CropMode,
  DEFAULT_ADJUSTMENTS,
  EditorState,
  FULL_BOX,
  FULL_QUAD,
  FilterPreset,
  Point2D,
  QuadPoints,
  applyEnhancement,
  clamp,
  cropBoxCanvas,
  detectDocumentQuad,
  downscaleCanvas,
  exportCanvasToFile,
  fitBoxToAspect,
  getAspectRatioValue,
  loadFileToCanvas,
  renderStraightenedCanvas,
  rotateBox90CW,
  rotateCanvas90CW,
  rotateQuad90CW,
  warpPerspective,
} from '../lib/imageProcessor';

interface DocumentEditorModalProps {
  file: File;
  mode: 'normal' | 'id_card';
  lang: 'en' | 'hi';
  initialState?: Partial<EditorState>;
  onCancel: () => void;
  onSkip?: () => void;
  onApply: (result: {
    file: File;
    dataUrl: string;
    editorState: EditorState;
  }) => void;
}

type DragTarget =
  | { type: 'quad-corner'; corner: keyof QuadPoints }
  | { type: 'quad-edge'; edge: 't' | 'r' | 'b' | 'l'; startQuad: QuadPoints; startPt: Point2D }
  | { type: 'box-move'; startBox: BoxCrop; startPt: Point2D }
  | { type: 'box-handle'; handle: 'nw' | 'ne' | 'se' | 'sw' | 'n' | 'e' | 's' | 'w'; startBox: BoxCrop };

export const DocumentEditorModal: React.FC<DocumentEditorModalProps> = ({
  file,
  mode,
  lang,
  initialState,
  onCancel,
  onSkip,
  onApply,
}) => {
  const defaultPreset: FilterPreset = mode === 'id_card' ? 'id_boost' : 'auto';
  const defaultAspect: AspectPreset = mode === 'id_card' ? 'id_card' : 'free';
  const defaultCropMode: CropMode = initialState?.cropMode ?? 'perspective';

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [showFlatPreview, setShowFlatPreview] = useState(false);
  const [showAdjustments, setShowAdjustments] = useState(false);

  // Source canvases: fullSrc (<= 2200px) for sharp export, previewSrc (<= 850px) for 60fps preview
  const fullSrcRef = useRef<HTMLCanvasElement | null>(null);
  const previewSrcRef = useRef<HTMLCanvasElement | null>(null);
  const filteredPreviewRef = useRef<HTMLCanvasElement | null>(null);

  const [imgDims, setImgDims] = useState<{ w: number; h: number }>({ w: 800, h: 600 });
  const [displayDims, setDisplayDims] = useState<{ w: number; h: number }>({ w: 800, h: 600 });

  // Editor State
  const [cropMode, setCropMode] = useState<CropMode>(defaultCropMode);
  const [quad, setQuad] = useState<QuadPoints>(initialState?.quad ?? FULL_QUAD);
  const [box, setBox] = useState<BoxCrop>(initialState?.box ?? FULL_BOX);
  const [aspectPreset, setAspectPreset] = useState<AspectPreset>(initialState?.aspectPreset ?? defaultAspect);
  const [straightenDeg, setStraightenDeg] = useState<number>(initialState?.straightenDeg ?? 0);
  const [rotation90, setRotation90] = useState<number>(initialState?.rotation90 ?? 0);
  const [preset, setPreset] = useState<FilterPreset>(initialState?.preset ?? defaultPreset);
  const [adjustments, setAdjustments] = useState<AdjustmentValues>(
    initialState?.adjustments ?? DEFAULT_ADJUSTMENTS
  );

  // Stage Measurement & Canvas Refs
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stageSize, setStageSize] = useState<{ w: number; h: number }>({ w: 320, h: 400 });
  const [dragTarget, setDragTarget] = useState<DragTarget | null>(null);
  const [activeDragPoint, setActiveDragPoint] = useState<Point2D | null>(null);

  const copy = {
    en: {
      title: mode === 'id_card' ? 'Scan & Clean ID Card' : 'Scan, Crop & Enhance',
      skip: 'Skip Edit',
      perspective: '4-Corner Scan',
      boxCrop: 'Box Crop & Tilt',
      rotate: 'Rotate 90°',
      autoBounds: 'Auto-Detect',
      reset: 'Full',
      preview: 'Preview',
      editCrop: 'Adjust Crop',
      straighten: 'Straighten',
      tune: 'Adjust',
      apply: 'Apply & Ready',
      processing: 'Enhancing...',
      loading: 'Preparing high-res scanner...',
      brightness: 'Brightness',
      contrast: 'Contrast',
      sharpness: 'Sharpness',
      resetSliders: 'Reset Sliders',
      presets: {
        original: 'Original',
        auto: '✨ Auto Enhance',
        magic: '📄 Magic Doc',
        bw: '🖨️ B&W Xerox',
        id_boost: '⭐ ID Boost',
      },
      aspects: {
        free: 'Free',
        a4: 'A4',
        id_card: 'ID Card',
        passport: 'Passport',
      },
    },
    hi: {
      title: mode === 'id_card' ? 'ID कार्ड क्रॉप और साफ करें' : 'डॉक्यूमेंट क्रॉप व साफ करें',
      skip: 'स्किप करें',
      perspective: '4-कोना स्कैन (टेढ़ा सीधा)',
      boxCrop: 'बॉक्स क्रॉप',
      rotate: '90° घुमाएँ',
      autoBounds: 'ऑटो बॉर्डर',
      reset: 'पूरा पेज',
      preview: 'प्रीव्यू देखें',
      editCrop: 'क्रॉप बदलें',
      straighten: 'सीधा करें',
      tune: 'एडजस्ट',
      apply: 'सेव और तैयार',
      processing: 'फोटो साफ हो रही है...',
      loading: 'एडिटर लोड हो रहा है...',
      brightness: 'ब्राइटनेस',
      contrast: 'कंट्रास्ट',
      sharpness: 'शार्पनेस (साफ टेक्स्ट)',
      resetSliders: 'रीसेट',
      presets: {
        original: 'Original',
        auto: '✨ Auto Enhance',
        magic: '📄 Magic Doc',
        bw: '🖨️ B&W Xerox',
        id_boost: '⭐ ID Boost',
      },
      aspects: {
        free: 'Free',
        a4: 'A4',
        id_card: 'ID Card',
        passport: 'Passport',
      },
    },
  }[lang];

  // Observe stage dimensions cleanly
  useEffect(() => {
    const el = stageContainerRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setStageSize({ w: rect.width - 16, h: rect.height - 16 });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Load initial image file cleanly
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError(null);

    loadFileToCanvas(file, 2200)
      .then((loadedFull) => {
        if (!active) return;

        // Re-apply saved 90-degree rotations if editing an existing image
        let rotCanvas = loadedFull;
        const turns = (initialState?.rotation90 ?? 0) % 4;
        for (let i = 0; i < turns; i++) {
          rotCanvas = rotateCanvas90CW(rotCanvas);
        }

        fullSrcRef.current = rotCanvas;
        const prev = downscaleCanvas(rotCanvas, 850);
        previewSrcRef.current = prev;
        setImgDims({ w: prev.width, h: prev.height });
        setDisplayDims({ w: prev.width, h: prev.height });

        // Smart initial bounds detection on fresh upload
        if (!initialState?.quad) {
          const detected = detectDocumentQuad(prev);
          setQuad(detected);
        }

        if (!initialState?.box && defaultAspect !== 'free') {
          const ratio = getAspectRatioValue(defaultAspect, prev.width, prev.height);
          setBox(fitBoxToAspect(FULL_BOX, ratio, prev.width, prev.height));
        }

        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load image into editor:', err);
        if (active) {
          setLoadError('Could not open this image format in editor.');
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [file]);

  // Re-run Enhancement filter whenever preview source, preset, or sliders change
  useEffect(() => {
    const prevSrc = previewSrcRef.current;
    if (!prevSrc || isLoading) return;

    const enhanced = applyEnhancement(prevSrc, preset, adjustments);
    filteredPreviewRef.current = enhanced;
    renderDisplayCanvas();
  }, [isLoading, preset, adjustments, imgDims]);

  // Fast re-draw when crop view, straighten slider, or flat preview toggles
  const renderDisplayCanvas = useCallback(() => {
    const display = displayCanvasRef.current;
    const filtered = filteredPreviewRef.current;
    if (!display || !filtered) return;

    let canvasToShow: HTMLCanvasElement;
    if (showFlatPreview) {
      if (cropMode === 'perspective') {
        const quadW = Math.hypot((quad.tr.x - quad.tl.x) * filtered.width, (quad.tr.y - quad.tl.y) * filtered.height);
        const quadH = Math.hypot((quad.bl.x - quad.tl.x) * filtered.width, (quad.bl.y - quad.tl.y) * filtered.height);
        const aspectRatio = getAspectRatioValue(aspectPreset, quadW, quadH);
        canvasToShow = warpPerspective(filtered, quad, 850, aspectRatio);
      } else {
        canvasToShow = cropBoxCanvas(filtered, box, straightenDeg, 850);
      }
    } else if (cropMode === 'box' && Math.abs(straightenDeg) >= 0.1) {
      canvasToShow = renderStraightenedCanvas(filtered, straightenDeg);
    } else {
      canvasToShow = filtered;
    }

    display.width = canvasToShow.width;
    display.height = canvasToShow.height;
    setDisplayDims((prev) =>
      prev.w === canvasToShow.width && prev.h === canvasToShow.height
        ? prev
        : { w: canvasToShow.width, h: canvasToShow.height }
    );
    const ctx = display.getContext('2d')!;
    ctx.clearRect(0, 0, display.width, display.height);
    ctx.drawImage(canvasToShow, 0, 0);
  }, [showFlatPreview, cropMode, aspectPreset, imgDims, quad, box, straightenDeg]);

  useEffect(() => {
    renderDisplayCanvas();
  }, [renderDisplayCanvas]);

  // Render 2.2x Magnifier Loupe when dragging in Perspective mode
  useEffect(() => {
    const loupe = loupeCanvasRef.current;
    const filtered = filteredPreviewRef.current;
    if (!loupe || !filtered || !activeDragPoint || cropMode !== 'perspective' || showFlatPreview) {
      return;
    }
    const size = 104;
    loupe.width = size;
    loupe.height = size;
    const ctx = loupe.getContext('2d')!;
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, size, size);

    const zoom = 2.2;
    const sampleSize = size / zoom;
    const sx = activeDragPoint.x * filtered.width - sampleSize / 2;
    const sy = activeDragPoint.y * filtered.height - sampleSize / 2;

    ctx.drawImage(filtered, sx, sy, sampleSize, sampleSize, 0, 0, size, size);

    // Crosshair target
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 5, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [activeDragPoint, cropMode, showFlatPreview]);

  // Compute fitted display box preserving aspect ratio cleanly inside stage
  const getFittedDimensions = () => {
    const targetW = showFlatPreview ? displayDims.w : imgDims.w;
    const targetH = showFlatPreview ? displayDims.h : imgDims.h;
    if (targetW <= 0 || targetH <= 0) return { w: 280, h: 350 };
    const scale = Math.min(stageSize.w / targetW, stageSize.h / targetH);
    return {
      w: Math.max(80, Math.floor(targetW * scale)),
      h: Math.max(80, Math.floor(targetH * scale)),
    };
  };

  const fitted = getFittedDimensions();

  // Convert client pointer position to normalized [0..1] coords inside wrapper
  const getNormalizedPoint = (clientX: number, clientY: number): Point2D => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return { x: 0.5, y: 0.5 };
    return {
      x: clamp((clientX - rect.left) / rect.width, 0, 1),
      y: clamp((clientY - rect.top) / rect.height, 0, 1),
    };
  };

  // Pointer Move Handler
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragTarget) return;
    e.preventDefault();
    const pt = getNormalizedPoint(e.clientX, e.clientY);

    if (dragTarget.type === 'quad-corner') {
      const c = dragTarget.corner;
      setQuad((prev) => {
        const next = { ...prev };
        // Keep reasonable separation from opposite edges to avoid non-convex self-intersection
        const minGap = 0.08;
        let nx = pt.x;
        let ny = pt.y;

        if (c === 'tl') {
          nx = clamp(nx, 0, Math.min(next.tr.x, next.br.x) - minGap);
          ny = clamp(ny, 0, Math.min(next.bl.y, next.br.y) - minGap);
        } else if (c === 'tr') {
          nx = clamp(nx, Math.max(next.tl.x, next.bl.x) + minGap, 1);
          ny = clamp(ny, 0, Math.min(next.br.y, next.bl.y) - minGap);
        } else if (c === 'br') {
          nx = clamp(nx, Math.max(next.bl.x, next.tl.x) + minGap, 1);
          ny = clamp(ny, Math.max(next.tr.y, next.tl.y) + minGap, 1);
        } else if (c === 'bl') {
          nx = clamp(nx, 0, Math.min(next.br.x, next.tr.x) - minGap);
          ny = clamp(ny, Math.max(next.tl.y, next.tr.y) + minGap, 1);
        }

        next[c] = { x: nx, y: ny };
        setActiveDragPoint(next[c]);
        return next;
      });
    } else if (dragTarget.type === 'quad-edge') {
      const dx = pt.x - dragTarget.startPt.x;
      const dy = pt.y - dragTarget.startPt.y;
      const sq = dragTarget.startQuad;
      const minGap = 0.08;
      let next = { ...sq };

      if (dragTarget.edge === 't') {
        const maxDy = Math.min(sq.bl.y - sq.tl.y - minGap, sq.br.y - sq.tr.y - minGap);
        const minDy = Math.max(-sq.tl.y, -sq.tr.y);
        const cdy = clamp(dy, minDy, maxDy);
        next.tl = { x: sq.tl.x, y: sq.tl.y + cdy };
        next.tr = { x: sq.tr.x, y: sq.tr.y + cdy };
        setActiveDragPoint({ x: (next.tl.x + next.tr.x) / 2, y: (next.tl.y + next.tr.y) / 2 });
      } else if (dragTarget.edge === 'b') {
        const minDy = Math.max(sq.tl.y + minGap - sq.bl.y, sq.tr.y + minGap - sq.br.y);
        const maxDy = Math.min(1 - sq.bl.y, 1 - sq.br.y);
        const cdy = clamp(dy, minDy, maxDy);
        next.bl = { x: sq.bl.x, y: sq.bl.y + cdy };
        next.br = { x: sq.br.x, y: sq.br.y + cdy };
        setActiveDragPoint({ x: (next.bl.x + next.br.x) / 2, y: (next.bl.y + next.br.y) / 2 });
      } else if (dragTarget.edge === 'l') {
        const maxDx = Math.min(sq.tr.x - sq.tl.x - minGap, sq.br.x - sq.bl.x - minGap);
        const minDx = Math.max(-sq.tl.x, -sq.bl.x);
        const cdx = clamp(dx, minDx, maxDx);
        next.tl = { x: sq.tl.x + cdx, y: sq.tl.y };
        next.bl = { x: sq.bl.x + cdx, y: sq.bl.y };
        setActiveDragPoint({ x: (next.tl.x + next.bl.x) / 2, y: (next.tl.y + next.bl.y) / 2 });
      } else if (dragTarget.edge === 'r') {
        const minDx = Math.max(sq.tl.x + minGap - sq.tr.x, sq.bl.x + minGap - sq.br.x);
        const maxDx = Math.min(1 - sq.tr.x, 1 - sq.br.x);
        const cdx = clamp(dx, minDx, maxDx);
        next.tr = { x: sq.tr.x + cdx, y: sq.tr.y };
        next.br = { x: sq.br.x + cdx, y: sq.br.y };
        setActiveDragPoint({ x: (next.tr.x + next.br.x) / 2, y: (next.tr.y + next.br.y) / 2 });
      }
      setQuad(next);
    } else if (dragTarget.type === 'box-move') {
      const dx = pt.x - dragTarget.startPt.x;
      const dy = pt.y - dragTarget.startPt.y;
      const sb = dragTarget.startBox;
      setBox({
        x: clamp(sb.x + dx, 0, 1 - sb.w),
        y: clamp(sb.y + dy, 0, 1 - sb.h),
        w: sb.w,
        h: sb.h,
      });
    } else if (dragTarget.type === 'box-handle') {
      const sb = dragTarget.startBox;
      const h = dragTarget.handle;
      const minSize = 0.08;
      let left = sb.x;
      let top = sb.y;
      let right = sb.x + sb.w;
      let bottom = sb.y + sb.h;

      if (h.includes('w')) left = clamp(pt.x, 0, right - minSize);
      if (h.includes('e')) right = clamp(pt.x, left + minSize, 1);
      if (h.includes('n')) top = clamp(pt.y, 0, bottom - minSize);
      if (h.includes('s')) bottom = clamp(pt.y, top + minSize, 1);

      let newW = right - left;
      let newH = bottom - top;

      // Enforce aspect lock when active
      const ratio = getAspectRatioValue(aspectPreset, imgDims.w, imgDims.h);
      if (ratio && imgDims.w > 0 && imgDims.h > 0) {
        const normRatio = ratio / (imgDims.w / imgDims.h);
        if (h === 'n' || h === 's') {
          newW = clamp(newH * normRatio, minSize, 1);
          left = clamp(sb.x + sb.w / 2 - newW / 2, 0, 1 - newW);
        } else {
          newH = clamp(newW / normRatio, minSize, 1 - top);
          if (h.includes('n')) {
            top = clamp(bottom - newH, 0, bottom - minSize);
            newH = bottom - top;
          }
          newW = Math.min(newW, newH * normRatio);
          if (h.includes('w')) {
            left = right - newW;
          }
        }
      }

      setBox({
        x: clamp(left, 0, 1 - minSize),
        y: clamp(top, 0, 1 - minSize),
        w: clamp(newW, minSize, 1),
        h: clamp(newH, minSize, 1),
      });
    }
  };

  const handlePointerUp = () => {
    setDragTarget(null);
    setActiveDragPoint(null);
  };

  // Rotate 90deg clockwise
  const handleRotate90 = () => {
    if (!fullSrcRef.current || !previewSrcRef.current) return;
    fullSrcRef.current = rotateCanvas90CW(fullSrcRef.current);
    const nextPrev = rotateCanvas90CW(previewSrcRef.current);
    previewSrcRef.current = nextPrev;

    setQuad((q) => rotateQuad90CW(q));
    setBox((b) => rotateBox90CW(b));
    setRotation90((r) => (r + 1) % 4);
    setImgDims({ w: nextPrev.width, h: nextPrev.height });
  };

  // Auto-detect bounds or reset
  const handleAutoDetect = () => {
    if (!previewSrcRef.current) return;
    if (cropMode === 'perspective') {
      setQuad(detectDocumentQuad(previewSrcRef.current));
    } else {
      const detected = detectDocumentQuad(previewSrcRef.current);
      const minX = Math.min(detected.tl.x, detected.bl.x);
      const maxX = Math.max(detected.tr.x, detected.br.x);
      const minY = Math.min(detected.tl.y, detected.tr.y);
      const maxY = Math.max(detected.bl.y, detected.br.y);
      const rawBox = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
      const ratio = getAspectRatioValue(aspectPreset, imgDims.w, imgDims.h);
      setBox(fitBoxToAspect(rawBox, ratio, imgDims.w, imgDims.h));
      setStraightenDeg(0);
    }
  };

  const handleResetCrop = () => {
    setQuad({ ...FULL_QUAD });
    const ratio = getAspectRatioValue(aspectPreset, imgDims.w, imgDims.h);
    setBox(fitBoxToAspect(FULL_BOX, ratio, imgDims.w, imgDims.h));
    setStraightenDeg(0);
  };

  const handleAspectChange = (ap: AspectPreset) => {
    setAspectPreset(ap);
    const ratio = getAspectRatioValue(ap, imgDims.w, imgDims.h);
    if (ratio) {
      setBox((prev) => fitBoxToAspect(prev, ratio, imgDims.w, imgDims.h));
    }
  };

  // Final Full-Resolution Export & Apply
  const handleApply = async () => {
    if (!fullSrcRef.current || isApplying) return;
    try {
      setIsApplying(true);
      // Allow UI spinner frame to paint before synchronous pixel pass
      await new Promise((r) => setTimeout(r, 20));

      const fullSrc = fullSrcRef.current;
      let cropped: HTMLCanvasElement;
      if (cropMode === 'perspective') {
        const quadW = Math.hypot((quad.tr.x - quad.tl.x) * fullSrc.width, (quad.tr.y - quad.tl.y) * fullSrc.height);
        const quadH = Math.hypot((quad.bl.x - quad.tl.x) * fullSrc.width, (quad.bl.y - quad.tl.y) * fullSrc.height);
        const aspectRatio = getAspectRatioValue(aspectPreset, quadW, quadH);
        cropped = warpPerspective(fullSrc, quad, 2200, aspectRatio);
      } else {
        cropped = cropBoxCanvas(fullSrc, box, straightenDeg, 2200);
      }

      const enhanced = applyEnhancement(cropped, preset, adjustments);
      const exported = await exportCanvasToFile(enhanced, file.name, 0.92);

      onApply({
        file: exported.file,
        dataUrl: exported.dataUrl,
        editorState: {
          cropMode,
          quad,
          box,
          aspectPreset,
          straightenDeg,
          rotation90,
          preset,
          adjustments,
        },
      });
    } catch (err) {
      console.error('Export error:', err);
      alert('Could not process image. Try skipping or using original.');
    } finally {
      setIsApplying(false);
    }
  };

  const presetsOrder: FilterPreset[] =
    mode === 'id_card'
      ? ['id_boost', 'magic', 'bw', 'auto', 'original']
      : ['auto', 'magic', 'bw', 'id_boost', 'original'];

  const loupeOnRight = activeDragPoint && activeDragPoint.x < 0.35 && activeDragPoint.y < 0.35;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950 text-white flex flex-col overflow-hidden select-none">
      {/* Top Header */}
      <header className="h-14 px-3 sm:px-5 border-b border-slate-800/90 bg-slate-900/95 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-extrabold text-white truncate flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{copy.title}</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
            >
              {copy.skip}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowFlatPreview((p) => !p)}
            disabled={isLoading}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition ${
              showFlatPreview
                ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showFlatPreview ? copy.editCrop : copy.preview}</span>
          </button>
        </div>
      </header>

      {/* Crop Mode & Quick Tool Strip */}
      {!showFlatPreview && (
        <div className="px-3 py-2 bg-slate-900/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Option 2 vs Option 1 Switcher */}
          <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setCropMode('perspective')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition ${
                cropMode === 'perspective'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Scan className="w-3.5 h-3.5" />
              <span>{copy.perspective}</span>
            </button>
            <button
              type="button"
              onClick={() => setCropMode('box')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition ${
                cropMode === 'box'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Crop className="w-3.5 h-3.5" />
              <span>{copy.boxCrop}</span>
            </button>
          </div>

          {/* Quick Tools: Rotate, Auto-Bounds, Reset */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleRotate90}
              disabled={isLoading}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 border border-slate-700 transition"
            >
              <RotateCw className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">{copy.rotate}</span>
            </button>
            <button
              type="button"
              onClick={handleAutoDetect}
              disabled={isLoading}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 border border-slate-700 transition"
              title="Auto-detect document edges"
            >
              <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{copy.autoBounds}</span>
            </button>
            <button
              type="button"
              onClick={handleResetCrop}
              disabled={isLoading}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1 border border-slate-700 transition"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{copy.reset}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Stage (Centered Interactive Canvas) */}
      <div
        ref={stageContainerRef}
        className="flex-1 min-h-0 relative flex items-center justify-center p-2 bg-slate-950 overflow-hidden"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {isLoading ? (
          <div className="text-center space-y-3">
            <Loader2 className="w-9 h-9 animate-spin text-sky-500 mx-auto" />
            <p className="text-xs font-bold text-slate-400">{copy.loading}</p>
          </div>
        ) : loadError ? (
          <div className="text-center space-y-3 p-6 max-w-xs">
            <p className="text-sm font-bold text-rose-400">{loadError}</p>
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white"
              >
                {copy.skip}
              </button>
            )}
          </div>
        ) : (
          <div
            ref={wrapperRef}
            style={{ width: fitted.w, height: fitted.h }}
            className="relative touch-none select-none shadow-2xl rounded-lg overflow-visible"
          >
            <canvas
              ref={displayCanvasRef}
              className="w-full h-full block rounded-lg bg-white shadow-xl"
            />

            {/* OPTION 2: 4-Corner Perspective Scan Overlay */}
            {!showFlatPreview && cropMode === 'perspective' && (
              <>
                <svg
                  viewBox="0 0 1000 1000"
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full pointer-events-none rounded-lg overflow-hidden"
                >
                  {/* Dim area outside quad */}
                  <path
                    fillRule="evenodd"
                    fill="rgba(2, 6, 23, 0.58)"
                    d={`M 0 0 H 1000 V 1000 H 0 Z M ${quad.tl.x * 1000} ${quad.tl.y * 1000} L ${quad.tr.x * 1000} ${quad.tr.y * 1000} L ${quad.br.x * 1000} ${quad.br.y * 1000} L ${quad.bl.x * 1000} ${quad.bl.y * 1000} Z`}
                  />

                  {/* Subtle 3x3 internal guide lines */}
                  {[0.333, 0.666].map((t) => {
                    const topX = (quad.tl.x + (quad.tr.x - quad.tl.x) * t) * 1000;
                    const topY = (quad.tl.y + (quad.tr.y - quad.tl.y) * t) * 1000;
                    const botX = (quad.bl.x + (quad.br.x - quad.bl.x) * t) * 1000;
                    const botY = (quad.bl.y + (quad.br.y - quad.bl.y) * t) * 1000;
                    const leftX = (quad.tl.x + (quad.bl.x - quad.tl.x) * t) * 1000;
                    const leftY = (quad.tl.y + (quad.bl.y - quad.tl.y) * t) * 1000;
                    const rightX = (quad.tr.x + (quad.br.x - quad.tr.x) * t) * 1000;
                    const rightY = (quad.tr.y + (quad.br.y - quad.tr.y) * t) * 1000;
                    return (
                      <g key={t} stroke="rgba(255,255,255,0.28)" strokeWidth="1.5">
                        <line x1={topX} y1={topY} x2={botX} y2={botY} />
                        <line x1={leftX} y1={leftY} x2={rightX} y2={rightY} />
                      </g>
                    );
                  })}

                  {/* Glowing Quad Border */}
                  <polygon
                    points={`${quad.tl.x * 1000},${quad.tl.y * 1000} ${quad.tr.x * 1000},${quad.tr.y * 1000} ${quad.br.x * 1000},${quad.br.y * 1000} ${quad.bl.x * 1000},${quad.bl.y * 1000}`}
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="4"
                    strokeLinejoin="round"
                  />
                </svg>

                {/* 4 Edge Midpoint Handles */}
                {(
                  [
                    { edge: 't' as const, x: (quad.tl.x + quad.tr.x) / 2, y: (quad.tl.y + quad.tr.y) / 2, horiz: true },
                    { edge: 'b' as const, x: (quad.bl.x + quad.br.x) / 2, y: (quad.bl.y + quad.br.y) / 2, horiz: true },
                    { edge: 'l' as const, x: (quad.tl.x + quad.bl.x) / 2, y: (quad.tl.y + quad.bl.y) / 2, horiz: false },
                    { edge: 'r' as const, x: (quad.tr.x + quad.br.x) / 2, y: (quad.tr.y + quad.br.y) / 2, horiz: false },
                  ]
                ).map((item) => (
                  <div
                    key={item.edge}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                      const pt = getNormalizedPoint(e.clientX, e.clientY);
                      setDragTarget({ type: 'quad-edge', edge: item.edge, startQuad: quad, startPt: pt });
                      setActiveDragPoint({ x: item.x, y: item.y });
                    }}
                    style={{ left: `${item.x * 100}%`, top: `${item.y * 100}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center cursor-grab active:cursor-grabbing z-20 touch-none"
                  >
                    <div
                      className={`bg-white border-2 border-sky-500 rounded-full shadow-md ${
                        item.horiz ? 'w-6 h-2.5' : 'w-2.5 h-6'
                      }`}
                    />
                  </div>
                ))}

                {/* 4 Corner Touch Handles */}
                {(['tl', 'tr', 'br', 'bl'] as (keyof QuadPoints)[]).map((c) => {
                  const pt = quad[c];
                  const isActive = dragTarget?.type === 'quad-corner' && dragTarget.corner === c;
                  return (
                    <div
                      key={c}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                        setDragTarget({ type: 'quad-corner', corner: c });
                        setActiveDragPoint(pt);
                      }}
                      style={{ left: `${pt.x * 100}%`, top: `${pt.y * 100}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center cursor-grab active:cursor-grabbing z-30 touch-none"
                    >
                      <div
                        className={`rounded-full border-3 border-white shadow-lg transition-transform ${
                          isActive ? 'w-7 h-7 bg-emerald-400 scale-115' : 'w-5 h-5 bg-sky-500'
                        }`}
                      />
                    </div>
                  );
                })}
              </>
            )}

            {/* OPTION 1: Smooth Rectangular Box Crop Overlay */}
            {!showFlatPreview && cropMode === 'box' && (
              <>
                <svg
                  viewBox="0 0 1000 1000"
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full pointer-events-none rounded-lg overflow-hidden"
                >
                  <path
                    fillRule="evenodd"
                    fill="rgba(2, 6, 23, 0.62)"
                    d={`M 0 0 H 1000 V 1000 H 0 Z M ${box.x * 1000} ${box.y * 1000} H ${(box.x + box.w) * 1000} V ${(box.y + box.h) * 1000} H ${box.x * 1000} Z`}
                  />
                  {/* Rule of thirds grid */}
                  <line x1={(box.x + box.w / 3) * 1000} y1={box.y * 1000} x2={(box.x + box.w / 3) * 1000} y2={(box.y + box.h) * 1000} stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />
                  <line x1={(box.x + (box.w * 2) / 3) * 1000} y1={box.y * 1000} x2={(box.x + (box.w * 2) / 3) * 1000} y2={(box.y + box.h) * 1000} stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />
                  <line x1={box.x * 1000} y1={(box.y + box.h / 3) * 1000} x2={(box.x + box.w) * 1000} y2={(box.y + box.h / 3) * 1000} stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />
                  <line x1={box.x * 1000} y1={(box.y + (box.h * 2) / 3) * 1000} x2={(box.x + box.w) * 1000} y2={(box.y + (box.h * 2) / 3) * 1000} stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />
                  {/* Frame border */}
                  <rect
                    x={box.x * 1000}
                    y={box.y * 1000}
                    width={box.w * 1000}
                    height={box.h * 1000}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="4"
                  />
                </svg>

                {/* Draggable Box Body (Move crop frame) */}
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                    const pt = getNormalizedPoint(e.clientX, e.clientY);
                    setDragTarget({ type: 'box-move', startBox: box, startPt: pt });
                  }}
                  style={{
                    left: `${box.x * 100}%`,
                    top: `${box.y * 100}%`,
                    width: `${box.w * 100}%`,
                    height: `${box.h * 100}%`,
                  }}
                  className="absolute cursor-move z-10 touch-none"
                />

                {/* Box Edge Handles */}
                {[
                  { handle: 'n' as const, x: box.x + box.w / 2, y: box.y, horiz: true },
                  { handle: 's' as const, x: box.x + box.w / 2, y: box.y + box.h, horiz: true },
                  { handle: 'w' as const, x: box.x, y: box.y + box.h / 2, horiz: false },
                  { handle: 'e' as const, x: box.x + box.w, y: box.y + box.h / 2, horiz: false },
                ].map((edge) => (
                  <div
                    key={edge.handle}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                      setDragTarget({ type: 'box-handle', handle: edge.handle, startBox: box });
                    }}
                    style={{ left: `${edge.x * 100}%`, top: `${edge.y * 100}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center z-20 touch-none cursor-pointer"
                  >
                    <div
                      className={`bg-white border border-slate-900 rounded-full shadow-md ${
                        edge.horiz ? 'w-7 h-2' : 'w-2 h-7'
                      }`}
                    />
                  </div>
                ))}

                {/* Box Corner Handles */}
                {[
                  { handle: 'nw' as const, x: box.x, y: box.y },
                  { handle: 'ne' as const, x: box.x + box.w, y: box.y },
                  { handle: 'se' as const, x: box.x + box.w, y: box.y + box.h },
                  { handle: 'sw' as const, x: box.x, y: box.y + box.h },
                ].map((corner) => (
                  <div
                    key={corner.handle}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                      setDragTarget({ type: 'box-handle', handle: corner.handle, startBox: box });
                    }}
                    style={{ left: `${corner.x * 100}%`, top: `${corner.y * 100}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center z-30 touch-none cursor-pointer"
                  >
                    <div className="w-5 h-5 rounded-full bg-white border-3 border-sky-500 shadow-lg" />
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Magnifier Loupe in Stage Corner while Dragging Perspective Corners */}
        {activeDragPoint && cropMode === 'perspective' && !showFlatPreview && (
          <div
            className={`absolute top-3 ${
              loupeOnRight ? 'right-3' : 'left-3'
            } w-[108px] h-[108px] rounded-full border-4 border-sky-400 shadow-2xl overflow-hidden bg-slate-900 pointer-events-none z-40`}
          >
            <canvas ref={loupeCanvasRef} className="w-full h-full block" />
          </div>
        )}
      </div>

      {/* Box Mode Extras: Aspect Ratios + Straighten Angle Slider */}
      {!showFlatPreview && cropMode === 'box' && !isLoading && (
        <div className="px-3 py-2 bg-slate-900/90 border-t border-slate-800 space-y-2 shrink-0">
          <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
            {/* Aspect Presets */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {(['free', 'a4', 'id_card', 'passport'] as AspectPreset[]).map((ap) => (
                <button
                  key={ap}
                  type="button"
                  onClick={() => handleAspectChange(ap)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition whitespace-nowrap ${
                    aspectPreset === ap
                      ? 'bg-white text-slate-950 border-white'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  {copy.aspects[ap]}
                </button>
              ))}
            </div>

            {/* Straighten Readout */}
            <button
              type="button"
              onClick={() => setStraightenDeg(0)}
              className="text-[11px] font-mono text-sky-400 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700 shrink-0"
              title="Tap to reset straighten angle"
            >
              {copy.straighten}: {straightenDeg > 0 ? `+${straightenDeg}°` : `${straightenDeg}°`}
            </button>
          </div>

          <div className="max-w-lg mx-auto flex items-center gap-3">
            <span className="text-[10px] font-mono text-slate-500">-15°</span>
            <input
              type="range"
              min={-15}
              max={15}
              step={0.5}
              value={straightenDeg}
              onChange={(e) => setStraightenDeg(parseFloat(e.target.value))}
              className="flex-1 accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] font-mono text-slate-500">+15°</span>
          </div>
        </div>
      )}

      {/* Optional Fine-Tune Sliders Drawer */}
      {showAdjustments && !isLoading && (
        <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 shrink-0">
          <div className="max-w-lg mx-auto space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
                <span>{copy.tune}</span>
              </span>
              <button
                type="button"
                onClick={() => setAdjustments(DEFAULT_ADJUSTMENTS)}
                className="text-[11px] font-semibold text-sky-400 hover:underline"
              >
                {copy.resetSliders}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
              <label className="space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>{copy.brightness}</span>
                  <span className="font-mono text-white">{adjustments.brightness}</span>
                </div>
                <input
                  type="range"
                  min={-40}
                  max={40}
                  step={2}
                  value={adjustments.brightness}
                  onChange={(e) =>
                    setAdjustments((a) => ({ ...a, brightness: Number(e.target.value) }))
                  }
                  className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg"
                />
              </label>

              <label className="space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>{copy.contrast}</span>
                  <span className="font-mono text-white">{adjustments.contrast}</span>
                </div>
                <input
                  type="range"
                  min={-40}
                  max={40}
                  step={2}
                  value={adjustments.contrast}
                  onChange={(e) =>
                    setAdjustments((a) => ({ ...a, contrast: Number(e.target.value) }))
                  }
                  className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg"
                />
              </label>

              <label className="space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>{copy.sharpness}</span>
                  <span className="font-mono text-white">{adjustments.sharpness}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={adjustments.sharpness}
                  onChange={(e) =>
                    setAdjustments((a) => ({ ...a, sharpness: Number(e.target.value) }))
                  }
                  className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Filter Presets & Primary Action Bar */}
      <footer className="bg-slate-900 border-t border-slate-800 px-3 py-2.5 space-y-2.5 shrink-0">
        {/* 5 One-Tap Enhancement Presets */}
        <div className="flex items-center sm:justify-center gap-1.5 overflow-x-auto no-scrollbar max-w-2xl mx-auto pb-0.5">
          {presetsOrder.map((pKey) => {
            const active = preset === pKey;
            return (
              <button
                key={pKey}
                type="button"
                disabled={isLoading}
                onClick={() => setPreset(pKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition shrink-0 ${
                  active
                    ? 'bg-gradient-to-r from-sky-500 to-emerald-500 text-white border-transparent shadow-md shadow-sky-500/20'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                {copy.presets[pKey]}
              </button>
            );
          })}
        </div>

        {/* Footer CTA Row */}
        <div className="flex items-center justify-between gap-2.5 max-w-2xl mx-auto">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => setShowAdjustments((s) => !s)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition shrink-0 ${
              showAdjustments
                ? 'bg-slate-700 text-white border-sky-500'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-sky-400" />
            <span>{copy.tune}</span>
          </button>

          <button
            type="button"
            disabled={isLoading || isApplying}
            onClick={handleApply}
            className="flex-1 py-2.5 px-5 rounded-xl font-extrabold text-sm text-white shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #0284c7, #10b981)',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
            }}
          >
            {isApplying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{copy.processing}</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{copy.apply}</span>
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};
