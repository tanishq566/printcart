import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import * as pdfjsLib from 'pdfjs-dist';
import QRCode from 'qrcode';
import {
  Printer,
  ShieldCheck,
  Volume2,
  VolumeX,
  RotateCw,
  ZoomIn,
  ZoomOut,
  XCircle,
  CheckCircle2,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  Settings,
  QrCode,
  LogOut,
  ExternalLink,
  Loader2,
  Undo2,
  Sparkles,
  LayoutDashboard,
  Copy,
  Download,
  Wifi,
  WifiOff,
  Menu,
  X,
  TrendingUp,
  Users,
  Power,
  AlertCircle,
  Maximize2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { UpgradeModal } from '../components/UpgradeModal';
import { usePwaInstall } from '../hooks/usePwaInstall';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PrintJobCard {
  id: string;
  tokenNumber: number;
  customerName?: string;
  jobType: 'NORMAL' | 'ID_CARD';
  fileName?: string;
  mimeType: string;
  fileSizeBytes: number;
  pageCount: number;
  copies: number;
  colorMode: 'BW' | 'COLOR';
  sides: 'SINGLE' | 'DOUBLE';
  estimatedPrice: number;
  status: 'PENDING' | 'REVIEWING' | 'PRINTING';
  createdAt: string;
  expiresAt: string;
}

interface TodayStats {
  completedJobs: number;
  totalPrints: number;
  estimatedRevenue: number;
  activeQueueCount: number;
}

/* ─── Sidebar ─────────────────────────────────────────────────────────── */
interface SidebarProps {
  shop: any;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onUpgrade: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ shop, isOpen, onClose, onLogout, onUpgrade }) => {
  const nav = [
    { to: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Live Counter' },
    { to: '/dashboard/standee', icon: <QrCode className="w-4 h-4" />, label: 'QR Standee' },
    { to: '/dashboard/settings', icon: <Settings className="w-4 h-4" />, label: 'Rates & Settings' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-600/30">
              <Printer className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-base text-white tracking-tight">
              Print<span className="text-blue-500">Cart</span>
            </span>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shop info */}
        <div className="px-4 py-3 border-b border-slate-800">
          <p className="text-xs text-slate-500 font-medium">Active Shop</p>
          <p className="text-sm font-bold text-white truncate mt-0.5">{shop?.shopName}</p>
          <p className="text-[11px] text-blue-400 font-mono truncate">printcart.in/s/{shop?.slug}</p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ to, icon, label }) => (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition group"
            >
              <span className="text-slate-500 group-hover:text-blue-400 transition">{icon}</span>
              {label}
            </Link>
          ))}
          {shop?.slug && (
            <a
              href={`/s/${shop.slug}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition group"
            >
              <span className="text-slate-500 group-hover:text-emerald-400 transition">
                <ExternalLink className="w-4 h-4" />
              </span>
              Open Customer Page ↗
            </a>
          )}
        </nav>

        {/* Sidebar footer — Plan card */}
        <div className="px-3 py-4 border-t border-slate-800 space-y-2">
          {shop?.planStatus === 'TRIAL' ? (
            <div className="bg-gradient-to-br from-amber-950/60 to-orange-950/40 border border-amber-800/50 rounded-xl p-3">
              <p className="text-xs font-bold text-amber-300">Free Trial Active</p>
              <p className="text-[11px] text-amber-400/70 mt-0.5">3-Day trial • Upgrade anytime</p>
              <button
                onClick={onUpgrade}
                className="mt-2 w-full py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Upgrade ₹499
              </button>
            </div>
          ) : (
            <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl px-3 py-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-300">Lifetime Active</p>
                <p className="text-[10px] text-emerald-500">printcart.in</p>
              </div>
            </div>
          )}

          <button
            onClick={onLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

/* ─── KPI Cards ───────────────────────────────────────────────────────── */
interface KpiProps {
  stats: TodayStats;
  shop: any;
  jobCount: number;
  hasGeneratedQr: boolean;
  onOpenQr: () => void;
}

const KpiCards: React.FC<KpiProps> = ({ stats, shop, jobCount, hasGeneratedQr, onOpenQr }) => {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(`https://printcart.in/s/${shop?.slug}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const cards = [
    {
      label: "Today's Prints",
      value: stats.completedJobs,
      icon: <Printer className="w-5 h-5" />,
      color: 'from-blue-600 to-blue-500',
      textColor: 'text-blue-400',
      bg: 'bg-blue-950/40 border-blue-800/40',
    },
    {
      label: 'Est. Revenue (₹)',
      value: `₹${stats.estimatedRevenue}`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'from-emerald-600 to-teal-500',
      textColor: 'text-emerald-400',
      bg: 'bg-emerald-950/40 border-emerald-800/40',
    },
    {
      label: 'Pending Queue',
      value: jobCount,
      icon: <Users className="w-5 h-5" />,
      color: 'from-amber-600 to-orange-500',
      textColor: 'text-amber-400',
      bg: 'bg-amber-950/40 border-amber-800/40',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-4 py-3 border-b border-slate-800 bg-slate-950/50 shrink-0">
      {cards.map(({ label, value, icon, color, textColor, bg }) => (
        <div key={label} className={`${bg} border rounded-xl px-3 py-2.5 flex items-center gap-3`}>
          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-sm shrink-0`}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className={`text-lg font-black tabular-nums ${textColor}`}>{value}</p>
            <p className="text-[11px] text-slate-500 font-medium leading-tight truncate">{label}</p>
          </div>
        </div>
      ))}

      {/* Shop Link card with Generate / Show QR Button */}
      <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl px-3 py-2 flex items-center justify-between gap-2 col-span-2 lg:col-span-1">
        <button
          onClick={onOpenQr}
          className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-90 transition group flex-1"
          title={hasGeneratedQr ? 'Show / Download Shop QR Code' : 'Generate Counter QR Code'}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition ${
            hasGeneratedQr ? 'bg-indigo-950 text-indigo-400 border border-indigo-800/60' : 'bg-gradient-to-tr from-blue-600 to-emerald-500 text-white animate-pulse'
          }`}>
            <QrCode className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white flex items-center gap-1">
              <span>{hasGeneratedQr ? 'Show QR' : 'Generate QR'}</span>
              <span className="text-[10px] text-slate-500 group-hover:text-blue-400">↗</span>
            </p>
            <p className="text-[10px] font-mono text-slate-400 truncate">/s/{shop?.slug}</p>
          </div>
        </button>

        <button
          onClick={copyLink}
          className={`shrink-0 p-1.5 rounded-lg transition ${copied ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
          title="Copy Link"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};

/* ─── Empty State ─────────────────────────────────────────────────────── */
interface EmptyStateProps {
  shop: any;
  hasGeneratedQr: boolean;
  onOpenQr: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ shop, hasGeneratedQr, onOpenQr }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
    <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-8 max-w-sm w-full shadow-xl space-y-5">
      {/* QR mini */}
      <div
        onClick={onOpenQr}
        className="mx-auto w-28 h-28 bg-white rounded-xl flex items-center justify-center shadow-md cursor-pointer hover:scale-105 transition"
        title={hasGeneratedQr ? 'Click to Show QR' : 'Click to Generate QR'}
      >
        <svg width="88" height="88" viewBox="0 0 88 88">
          <rect width="88" height="88" fill="white" rx="4" />
          <rect x="6" y="6" width="22" height="22" rx="2" fill="#1e40af" />
          <rect x="10" y="10" width="14" height="14" rx="1" fill="white" />
          <rect x="13" y="13" width="8" height="8" rx="1" fill="#1e40af" />
          <rect x="60" y="6" width="22" height="22" rx="2" fill="#1e40af" />
          <rect x="64" y="10" width="14" height="14" rx="1" fill="white" />
          <rect x="67" y="13" width="8" height="8" rx="1" fill="#1e40af" />
          <rect x="6" y="60" width="22" height="22" rx="2" fill="#1e40af" />
          <rect x="10" y="64" width="14" height="14" rx="1" fill="white" />
          <rect x="13" y="67" width="8" height="8" rx="1" fill="#1e40af" />
          {[36, 42, 48, 54, 36, 42, 54, 36, 48, 54].map((x, i) => (
            <rect key={i} x={x} y={36 + (i % 4) * 6} width="5" height="5" rx="1" fill="#3b82f6" opacity="0.9" />
          ))}
        </svg>
      </div>

      <div>
        <h3 className="text-base font-bold text-white">Counter Ready for Prints</h3>
        <p className="text-xs text-slate-400 mt-1">
          Scan QR or share your link — jobs appear here with an audio alert
        </p>
        <p className="text-xs font-mono text-blue-400 mt-1">printcart.in/s/{shop?.slug}</p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={onOpenQr}
          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 text-white font-bold text-sm rounded-xl shadow-md hover:-translate-y-0.5 transition"
        >
          <QrCode className="w-4 h-4 text-emerald-300" />
          {hasGeneratedQr ? 'Show QR & Standee' : '✨ Generate QR & Standee'}
        </button>
        {shop?.slug && (
          <a
            href={`/s/${shop.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl transition"
          >
            <ExternalLink className="w-4 h-4 text-emerald-400" />
            Test Customer Upload
          </a>
        )}
      </div>
    </div>
  </div>
);

/* ─── DashboardPage ───────────────────────────────────────────────────── */
export const DashboardPage: React.FC = () => {
  const { shop, refreshShop, isAuthenticated, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isInstallable, promptInstall } = usePwaInstall();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Shop QR Generation / Display State
  const [hasGeneratedQr, setHasGeneratedQr] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [dashboardQrUrl, setDashboardQrUrl] = useState<string>('');

  useEffect(() => {
    if (shop?.id) {
      const generated = localStorage.getItem(`printcart_qr_generated_${shop.id}`) === 'true';
      setHasGeneratedQr(generated);
    }
  }, [shop?.id]);

  useEffect(() => {
    if (shop?.slug) {
      const targetUrl = `${window.location.origin}/s/${shop.slug}`;
      QRCode.toDataURL(targetUrl, {
        width: 600,
        margin: 1,
        color: { dark: '#0F172A', light: '#FFFFFF' },
        errorCorrectionLevel: 'H',
      })
        .then((url) => setDashboardQrUrl(url))
        .catch((err) => console.error('Dashboard QR generation error:', err));
    }
  }, [shop?.slug]);

  const handleOpenQrModal = () => {
    setShowQrModal(true);
    if (!hasGeneratedQr && shop?.id) {
      localStorage.setItem(`printcart_qr_generated_${shop.id}`, 'true');
      setHasGeneratedQr(true);
    }
  };

  const [socketConnected, setSocketConnected] = useState(false);
  const [isCounterOpen, setIsCounterOpen] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [stats, setStats] = useState<TodayStats>({
    completedJobs: 0,
    totalPrints: 0,
    estimatedRevenue: 0,
    activeQueueCount: 0,
  });

  const [jobs, setJobs] = useState<PrintJobCard[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [queueFilter, setQueueFilter] = useState<'ALL' | 'BW' | 'COLOR' | 'ID_CARD'>('ALL');
  const [loadingQueue, setLoadingQueue] = useState(true);

  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [pdfPage, setPdfPage] = useState<number>(1);
  const [pdfTotalPages, setPdfTotalPages] = useState<number>(1);

  const [showRejectMenu, setShowRejectMenu] = useState(false);
  const [customRejectReason, setCustomRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const [reprintUndo, setReprintUndo] = useState<{
    tokenNumber: number;
    blobUrl: string;
    secondsLeft: number;
  } | null>(null);

  const [isPrintingAction, setIsPrintingAction] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfDocRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const printFrameRef = useRef<HTMLIFrameElement | null>(null);

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn('Audio chime warning:', e);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login');
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (shop) setIsCounterOpen(shop.isCounterOpen ?? true);
  }, [shop]);

  const loadStats = async () => {
    try {
      const res = await apiFetch<{ stats: TodayStats }>('/shop/stats/today');
      setStats(res.stats);
    } catch (err) {
      console.warn('Stats fetch error:', err);
    }
  };

  const loadQueue = async () => {
    try {
      setLoadingQueue(true);
      const res = await apiFetch<{ jobs: PrintJobCard[] }>('/jobs/pending');
      setJobs(res.jobs);
      if (res.jobs.length > 0 && !selectedJobId) setSelectedJobId(res.jobs[0].id);
    } catch (err) {
      console.error('Queue fetch error:', err);
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
      loadQueue();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!shop) return;
    const token = localStorage.getItem('printcart_token');
    const socket = io({ path: '/socket.io', auth: { token }, transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('shop:join', shop.id);
    });
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('job:new', (newJob: PrintJobCard) => {
      setJobs((prev) => {
        if (prev.some((j) => j.id === newJob.id)) return prev;
        return [newJob, ...prev];
      });
      setSelectedJobId((curr) => curr || newJob.id);
      playChime();
      loadStats();
    });
    socket.on('job:status', (payload: { jobId: string; status: string }) => {
      if (['COMPLETED', 'REJECTED', 'EXPIRED'].includes(payload.status)) {
        setJobs((prev) => prev.filter((j) => j.id !== payload.jobId));
        setSelectedJobId((curr) => {
          if (curr === payload.jobId) {
            const remaining = jobs.filter((j) => j.id !== payload.jobId);
            return remaining.length > 0 ? remaining[0].id : null;
          }
          return curr;
        });
        loadStats();
      } else {
        setJobs((prev) =>
          prev.map((j) => (j.id === payload.jobId ? { ...j, status: payload.status as any } : j))
        );
      }
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, [shop?.id, soundEnabled]);

  const handleToggleCounter = async () => {
    const nextVal = !isCounterOpen;
    setIsCounterOpen(nextVal);
    try {
      await apiFetch('/shop/settings', { method: 'PATCH', body: JSON.stringify({ isCounterOpen: nextVal }) });
      await refreshShop();
    } catch {
      setIsCounterOpen(!nextVal);
    }
  };

  useEffect(() => {
    if (!selectedJobId) { setPreviewBlobUrl(null); setPreviewMime(null); return; }
    let active = true;
    setLoadingPreview(true);
    setPdfPage(1);

    apiFetch<{ previewUrl: string; mimeType: string; fileName: string; pageCount: number }>(
      `/jobs/${selectedJobId}/preview-url`
    )
      .then(async (res) => {
        if (!active) return;
        const fileRes = await fetch(res.previewUrl);
        const blob = await fileRes.blob();
        if (!active) return;
        const blobUrl = URL.createObjectURL(blob);
        setPreviewBlobUrl(blobUrl);
        setPreviewMime(res.mimeType);
        if (res.mimeType === 'application/pdf') {
          const arrayBuffer = await blob.arrayBuffer();
          const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          if (active) {
            pdfDocRef.current = doc;
            setPdfTotalPages(doc.numPages);
            renderPdfPage(doc, 1, zoomLevel, rotation);
          }
        }
      })
      .catch((err) => { console.warn('Preview error:', err); setPreviewBlobUrl(null); })
      .finally(() => { if (active) setLoadingPreview(false); });

    return () => { active = false; };
  }, [selectedJobId]);

  const renderPdfPage = async (doc: any, pageNum: number, zoom: number, rot: number) => {
    if (!doc || !canvasRef.current) return;
    try {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: zoom * 1.3, rotation: rot });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport }).promise;
    } catch (e) { console.warn('PDF render error:', e); }
  };

  useEffect(() => {
    if (pdfDocRef.current && previewMime === 'application/pdf') {
      renderPdfPage(pdfDocRef.current, pdfPage, zoomLevel, rotation);
    }
  }, [pdfPage, zoomLevel, rotation]);

  useEffect(() => {
    if (!reprintUndo) return;
    const timer = setInterval(() => {
      setReprintUndo((prev) => {
        if (!prev) return null;
        if (prev.secondsLeft <= 1) { URL.revokeObjectURL(prev.blobUrl); return null; }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [reprintUndo]);

  const handleApprovePrint = async () => {
    if (!selectedJobId || !previewBlobUrl) return;
    try {
      setIsPrintingAction(true);
      await apiFetch(`/jobs/${selectedJobId}/printing`, { method: 'POST' });
      if (printFrameRef.current) {
        printFrameRef.current.src = previewBlobUrl;
        printFrameRef.current.onload = () => {
          try { printFrameRef.current?.contentWindow?.focus(); printFrameRef.current?.contentWindow?.print(); }
          catch (e) { window.open(previewBlobUrl, '_blank')?.print(); }
        };
      } else { window.open(previewBlobUrl, '_blank')?.print(); }
      await completeAndWipe(selectedJobId, previewBlobUrl);
    } catch (err: any) {
      alert(err.message || 'Print action failed');
    } finally {
      setIsPrintingAction(false);
    }
  };

  const completeAndWipe = async (jobId: string, currentBlobUrl: string) => {
    const targetJob = jobs.find((j) => j.id === jobId);
    const tokenNum = targetJob?.tokenNumber || 0;
    await apiFetch(`/jobs/${jobId}/complete`, { method: 'POST' });
    setReprintUndo({ tokenNumber: tokenNum, blobUrl: currentBlobUrl, secondsLeft: 30 });
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    setSelectedJobId((curr) => {
      if (curr === jobId) {
        const remaining = jobs.filter((j) => j.id !== jobId);
        return remaining.length > 0 ? remaining[0].id : null;
      }
      return curr;
    });
    loadStats();
  };

  const handleReprintFromRAM = () => {
    if (!reprintUndo) return;
    if (printFrameRef.current) {
      printFrameRef.current.src = reprintUndo.blobUrl;
      printFrameRef.current.onload = () => { printFrameRef.current?.contentWindow?.print(); };
    } else { window.open(reprintUndo.blobUrl, '_blank')?.print(); }
  };

  const handleReject = async (reason: string) => {
    if (!selectedJobId) return;
    try {
      setIsRejecting(true);
      await apiFetch(`/jobs/${selectedJobId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
      setShowRejectMenu(false);
      setCustomRejectReason('');
      setJobs((prev) => prev.filter((j) => j.id !== selectedJobId));
      setSelectedJobId((curr) => {
        if (curr === selectedJobId) {
          const remaining = jobs.filter((j) => j.id !== selectedJobId);
          return remaining.length > 0 ? remaining[0].id : null;
        }
        return curr;
      });
      loadStats();
    } catch (err: any) {
      alert(err.message || 'Reject failed');
    } finally {
      setIsRejecting(false);
    }
  };

  const getFilteredJobs = () => {
    if (queueFilter === 'BW') return jobs.filter((j) => j.colorMode === 'BW' && j.jobType !== 'ID_CARD');
    if (queueFilter === 'COLOR') return jobs.filter((j) => j.colorMode === 'COLOR' && j.jobType !== 'ID_CARD');
    if (queueFilter === 'ID_CARD') return jobs.filter((j) => j.jobType === 'ID_CARD');
    return jobs;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;
      const filtered = getFilteredJobs();
      const currentIndex = filtered.findIndex((j) => j.id === selectedJobId);
      if (e.key === 'ArrowDown') { e.preventDefault(); if (currentIndex < filtered.length - 1) setSelectedJobId(filtered[currentIndex + 1].id); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (currentIndex > 0) setSelectedJobId(filtered[currentIndex - 1].id); }
      else if (e.key === 'Enter' || e.key === 'p' || e.key === 'P') { e.preventDefault(); if (selectedJobId && previewBlobUrl && !isPrintingAction) handleApprovePrint(); }
      else if (e.key === 'Delete') { e.preventDefault(); setShowRejectMenu(true); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jobs, selectedJobId, queueFilter, previewBlobUrl, isPrintingAction]);

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  const formatTimeLeft = (expiresAt: string) => {
    const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now());
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="h-screen flex bg-slate-900 text-slate-100 overflow-hidden font-sans">
      <iframe ref={printFrameRef} className="hidden" title="print-frame" />

      {/* Sidebar */}
      <Sidebar
        shop={shop}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={async () => { await logout(); navigate('/login'); }}
        onUpgrade={() => setShowUpgradeModal(true)}
      />

      {/* Main column */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── TOP BAR ── */}
        <header className="h-14 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-200 hidden sm:block">{shop?.shopName}</span>
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                socketConnected ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' : 'bg-amber-950 text-amber-400 border border-amber-800/60'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="hidden sm:inline">{socketConnected ? 'Connected' : 'Reconnecting'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Generate QR / Show QR Button */}
            <button
              onClick={handleOpenQrModal}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 shadow-xs ${
                hasGeneratedQr
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 text-white border-transparent animate-pulse hover:opacity-95'
              }`}
              title={hasGeneratedQr ? 'Show Your Counter QR Code' : 'Generate Counter QR Code'}
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>{hasGeneratedQr ? 'Show QR' : 'Generate QR'}</span>
            </button>

            {/* Sound toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition ${soundEnabled ? 'bg-blue-950 text-blue-400 border-blue-800' : 'bg-slate-900 text-slate-500 border-slate-800'}`}
              title={soundEnabled ? 'Sound ON' : 'Sound MUTED'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Counter toggle */}
            <button
              onClick={handleToggleCounter}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 ${
                isCounterOpen ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-red-950 text-red-400 border-red-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isCounterOpen ? 'bg-emerald-400' : 'bg-red-400'}`} />
              Counter {isCounterOpen ? 'OPEN' : 'CLOSED'}
            </button>

            {/* Install PWA */}
            {isInstallable && (
              <button
                onClick={promptInstall}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition"
              >
                Install App
              </button>
            )}

            {/* Upgrade badge */}
            {shop?.planStatus === 'TRIAL' && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-white transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                ₹499 Offer
              </button>
            )}
          </div>
        </header>

        <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

        {/* KPI Cards */}
        <KpiCards
          stats={stats}
          shop={shop}
          jobCount={jobs.length}
          hasGeneratedQr={hasGeneratedQr}
          onOpenQr={handleOpenQrModal}
        />

        {/* Reprint undo toast */}
        {reprintUndo && (
          <div className="bg-emerald-700 text-white px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm font-bold shadow-md shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Token #{reprintUndo.tokenNumber} Printed & Permanently Deleted from server.</span>
            </div>
            <button
              onClick={handleReprintFromRAM}
              className="px-3 py-1 bg-white text-emerald-800 hover:bg-emerald-50 rounded-lg font-extrabold text-xs transition flex items-center gap-1 shadow-sm"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Paper Jam? Reprint ({reprintUndo.secondsLeft}s)
            </button>
          </div>
        )}

        {/* ── SPLIT WORKSPACE ── */}
        <div className="flex-1 flex overflow-hidden">

          {/* LEFT: Queue */}
          <div className="w-full md:w-[36%] lg:w-[32%] xl:w-[28%] bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
            <div className="px-3 py-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Live Queue ({jobs.length})
              </span>
              <div className="flex items-center gap-1 text-[11px] font-bold">
                {(['ALL', 'BW', 'COLOR', 'ID_CARD'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setQueueFilter(f)}
                    className={`px-2 py-0.5 rounded-md transition ${
                      queueFilter === f ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {f === 'ALL' ? 'All' : f === 'ID_CARD' ? 'ID' : f}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {loadingQueue ? (
                <div className="py-16 text-center text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                  <span className="text-xs">Loading queue...</span>
                </div>
              ) : getFilteredJobs().length === 0 ? (
                <div className="py-16 text-center text-slate-500 px-4 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-slate-700" />
                  <p className="text-xs font-bold text-slate-400">Queue is Clear</p>
                  <p className="text-[11px] text-slate-600">New uploads from your QR code will appear here with an audio alert.</p>
                </div>
              ) : (
                getFilteredJobs().map((job) => {
                  const isSelected = job.id === selectedJobId;
                  const isIdCard = job.jobType === 'ID_CARD';
                  const isColor = job.colorMode === 'COLOR';
                  const borderColor = isIdCard ? 'border-l-teal-500' : isColor ? 'border-l-amber-500' : 'border-l-blue-500';

                  return (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      className={`p-3 rounded-xl border border-slate-800/80 cursor-pointer transition border-l-4 ${borderColor} ${
                        isSelected ? 'bg-slate-800/90 ring-1 ring-blue-500/40 shadow-sm' : 'bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black font-mono text-white">#{job.tokenNumber}</span>
                          <span className="text-xs font-semibold text-slate-300 truncate max-w-[100px]">{job.customerName || 'Walk-in'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-emerald-400 tabular-nums">₹{job.estimatedPrice}</span>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{formatTimeLeft(job.expiresAt)}</div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="truncate max-w-[130px] font-mono text-slate-500">{job.fileName || (isIdCard ? 'ID_Card_Merged.pdf' : 'document')}</span>
                        <div className="flex items-center gap-1">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isIdCard ? 'bg-teal-950 text-teal-300' : isColor ? 'bg-amber-950 text-amber-300' : 'bg-blue-950 text-blue-300'
                          }`}>
                            {isIdCard ? 'ID CARD' : job.colorMode}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">{job.pageCount}p×{job.copies}c</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-2 border-t border-slate-800/80 bg-slate-950 text-[11px] text-slate-500 flex items-center justify-between px-3">
              <span>↑/↓: Navigate</span>
              <span>Enter/P: Print</span>
              <span>Del: Reject</span>
            </div>
          </div>

          {/* RIGHT: Preview */}
          <div className="flex-1 bg-slate-900 flex flex-col overflow-hidden">
            {selectedJob ? (
              <>
                {/* Preview controls bar */}
                <div className="h-12 bg-slate-950/80 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black font-mono text-blue-400">Token #{selectedJob.tokenNumber}</span>
                    <span className="text-xs text-slate-400 hidden sm:inline">• {selectedJob.customerName || 'Walk-in'}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                      {selectedJob.colorMode} • {selectedJob.sides} • {selectedJob.copies}×
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    {previewMime === 'application/pdf' && pdfTotalPages > 1 && (
                      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg text-xs font-mono mr-2">
                        <button onClick={() => setPdfPage(Math.max(1, pdfPage - 1))} disabled={pdfPage <= 1} className="text-slate-400 hover:text-white disabled:opacity-30">
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span>{pdfPage}/{pdfTotalPages}</span>
                        <button onClick={() => setPdfPage(Math.min(pdfTotalPages, pdfPage + 1))} disabled={pdfPage >= pdfTotalPages} className="text-slate-400 hover:text-white disabled:opacity-30">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <button onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
                    <span className="text-xs font-mono text-slate-400 w-10 text-center">{Math.round(zoomLevel * 100)}%</span>
                    <button onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
                    <button onClick={() => setRotation((r) => (r + 90) % 360)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg ml-1" title="Rotate 90°"><RotateCw className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Preview body */}
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-900/50 relative">
                  {loadingPreview ? (
                    <div className="text-center text-slate-500">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                      <span className="text-xs">Fetching document from ephemeral buffer...</span>
                    </div>
                  ) : previewMime === 'application/pdf' ? (
                    <canvas ref={canvasRef} className="shadow-2xl rounded-sm max-w-full" />
                  ) : previewBlobUrl ? (
                    <img
                      src={previewBlobUrl}
                      alt="Document Preview"
                      style={{ transform: `scale(${zoomLevel}) rotate(${rotation}deg)`, transition: 'transform 0.15s ease-out' }}
                      className="max-h-[80vh] object-contain shadow-2xl rounded"
                    />
                  ) : (
                    <div className="text-slate-500 text-xs">Preview unavailable</div>
                  )}
                </div>

                {/* Action bar */}
                <div className="h-16 bg-slate-950 border-t border-slate-800 px-6 flex items-center justify-between shrink-0 relative">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowRejectMenu(!showRejectMenu)}
                      className="px-4 py-2.5 bg-red-950/80 text-red-300 hover:bg-red-900/90 border border-red-800/60 font-bold rounded-xl text-sm transition flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    {showRejectMenu && (
                      <div className="absolute bottom-14 left-0 w-64 bg-slate-950 border border-slate-800 rounded-2xl p-3 shadow-2xl z-50 space-y-1.5">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block px-2 pb-1 border-b border-slate-800">Select Rejection Reason:</span>
                        {['Photo Blur / Unclear (फोटो साफ नहीं है)', 'Password Locked PDF (पासवर्ड प्रोटेक्टेड)', 'Wrong Document / Not Supported', 'Counter Closed for Today'].map((reason) => (
                          <button key={reason} disabled={isRejecting} onClick={() => handleReject(reason)}
                            className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-red-950/60 rounded-lg transition"
                          >{reason}</button>
                        ))}
                        <div className="pt-2 border-t border-slate-800">
                          <input type="text" placeholder="Custom reason..." value={customRejectReason}
                            onChange={(e) => setCustomRejectReason(e.target.value)}
                            className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white outline-none mb-1.5"
                          />
                          <button disabled={isRejecting || !customRejectReason.trim()} onClick={() => handleReject(customRejectReason)}
                            className="w-full py-1.5 bg-red-600 text-white font-bold rounded-lg text-xs transition disabled:opacity-40"
                          >Send Custom Reject</button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => completeAndWipe(selectedJob.id, previewBlobUrl || '')}
                      className="px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
                      title="Already printed? Wipe without reopening print dialog"
                    >
                      Confirm Printed & Clear
                    </button>
                    <button
                      type="button"
                      disabled={isPrintingAction || !previewBlobUrl}
                      onClick={handleApprovePrint}
                      className="px-6 py-2.5 font-black text-sm rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50 text-white"
                      style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}
                    >
                      {isPrintingAction ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Printing...</span></> : <><Printer className="w-4 h-4" /><span>Approve & Print (Enter)</span></>}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                shop={shop}
                hasGeneratedQr={hasGeneratedQr}
                onOpenQr={handleOpenQrModal}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── QR CODE MODAL ── */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-4">
              <div>
                <span className="text-[10px] uppercase font-mono font-extrabold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/80">
                  {hasGeneratedQr ? 'Counter QR Ready' : 'New QR Generated'}
                </span>
                <h3 className="text-lg font-bold text-white mt-2">{shop?.shopName || 'Shop Counter QR'}</h3>
                <p className="text-xs text-slate-400">Customer scan karega aur direct aapke counter par file bhejega.</p>
              </div>

              {/* The Scannable QR Code */}
              <div className="p-3 bg-white rounded-2xl inline-block shadow-lg border-2 border-indigo-200">
                {dashboardQrUrl ? (
                  <img src={dashboardQrUrl} alt="Shop Counter QR" className="w-48 h-48 rounded-lg" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                  </div>
                )}
              </div>

              {/* Shop URL */}
              <div className="bg-slate-950/80 rounded-xl px-3 py-2 border border-slate-800 flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-blue-400 truncate">
                  {window.location.origin}/s/{shop?.slug}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/s/${shop?.slug}`);
                    alert('Shop Link copied to clipboard!');
                  }}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition shrink-0"
                  title="Copy"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                <Link
                  to="/dashboard/standee"
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Customize & Print A4 Standee</span>
                </Link>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      if (!dashboardQrUrl) return;
                      const a = document.createElement('a');
                      a.href = dashboardQrUrl;
                      a.download = `PrintCart_QR_${shop?.slug || 'shop'}.png`;
                      a.click();
                    }}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    <span>Download PNG</span>
                  </button>

                  <a
                    href={`/s/${shop?.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition border border-slate-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Open Customer</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
