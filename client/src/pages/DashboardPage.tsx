import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import * as pdfjsLib from 'pdfjs-dist';
import QRCode from 'qrcode';
import {
  POSTER_QUOTES,
  PosterQuote,
  drawPosterCanvas,
  downloadPosterPng,
  downloadPosterPdf,
} from '../lib/posterGenerator';
import { printDocumentViaFrame } from '../lib/printHelper';
import { DocumentEditorModal } from '../components/DocumentEditorModal';
import type { EditorState } from '../lib/imageProcessor';
import { unlockVoiceAudio, notifyShopkeeperPrintRequest } from '../lib/voiceAlert';
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
  Crop,
  Monitor,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { UpgradeModal } from '../components/UpgradeModal';
import { usePwaInstall } from '../hooks/usePwaInstall';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

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
  paymentMethod?: string;
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
  isInstalled: boolean;
  onInstallApp: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  shop,
  isOpen,
  onClose,
  onLogout,
  onUpgrade,
  isInstalled,
  onInstallApp,
}) => {
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
          {!isInstalled && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onInstallApp();
              }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 mt-2 rounded-xl text-sm font-bold text-indigo-200 bg-indigo-950/70 hover:bg-indigo-900/70 border border-indigo-700/60 transition"
            >
              <span className="flex items-center gap-3">
                <Monitor className="w-4 h-4 text-indigo-400" />
                <span>Install PC App</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                Desktop
              </span>
            </button>
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
  const { isInstallable, isInstalled, promptInstall } = usePwaInstall();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleInstallApp = async () => {
    const outcome = await promptInstall();
    if (outcome === 'unavailable') {
      setShowInstallModal(true);
    }
  };

  // Shop QR & Poster Generation / Display State
  const [hasGeneratedQr, setHasGeneratedQr] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [selectedQuote, setSelectedQuote] = useState<PosterQuote>(POSTER_QUOTES[0]);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState<string>('');
  const [isGeneratingPoster, setIsGeneratingPoster] = useState<boolean>(false);
  const [posterPaperSize, setPosterPaperSize] = useState<'A5' | 'A4'>('A5');
  const [downloadingFormat, setDownloadingFormat] = useState<'none' | 'png' | 'pdf'>('none');

  useEffect(() => {
    if (shop?.id) {
      const generated = localStorage.getItem(`printcart_qr_generated_${shop.id}`) === 'true';
      setHasGeneratedQr(generated);
    }
  }, [shop?.id]);

  // Generate live Poster preview whenever modal opens or quote changes
  useEffect(() => {
    if (!showQrModal || !shop?.slug) return;
    let active = true;
    setIsGeneratingPoster(true);

    const targetUrl = `${window.location.origin}/s/${shop.slug}`;
    drawPosterCanvas({
      shopName: shop.shopName || 'Shop Counter',
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
      .catch((err) => console.error('Poster preview generation error:', err))
      .finally(() => {
        if (active) setIsGeneratingPoster(false);
      });

    return () => {
      active = false;
    };
  }, [showQrModal, selectedQuote, shop]);

  const handleOpenQrModal = () => {
    setShowQrModal(true);
    if (!hasGeneratedQr && shop?.id) {
      localStorage.setItem(`printcart_qr_generated_${shop.id}`, 'true');
      setHasGeneratedQr(true);
    }
  };

  const handleDownloadPosterPng = async () => {
    if (!shop?.slug) return;
    try {
      setDownloadingFormat('png');
      const targetUrl = `${window.location.origin}/s/${shop.slug}`;
      await downloadPosterPng({
        shopName: shop.shopName || 'Shop Counter',
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
    } catch (e) {
      console.error(e);
      alert('Failed to download poster');
    } finally {
      setDownloadingFormat('none');
    }
  };

  const handleDownloadPosterPdf = async () => {
    if (!shop?.slug) return;
    try {
      setDownloadingFormat('pdf');
      const targetUrl = `${window.location.origin}/s/${shop.slug}`;
      await downloadPosterPdf(
        {
          shopName: shop.shopName || 'Shop Counter',
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
        posterPaperSize
      );
    } catch (e) {
      console.error(e);
      alert('Failed to download PDF');
    } finally {
      setDownloadingFormat('none');
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
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewRetryTick, setPreviewRetryTick] = useState(0);
  const [pdfDocVersion, setPdfDocVersion] = useState(0);
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
    mimeType: string | null;
    rotation: number;
    secondsLeft: number;
  } | null>(null);

  const [isPrintingAction, setIsPrintingAction] = useState(false);

  // Shopowner In-Counter Document Editor State
  const origPreviewFileRef = useRef<{ jobId: string; file: File } | null>(null);
  const [shopEditorState, setShopEditorState] = useState<EditorState | undefined>(undefined);
  const [shopEditorSession, setShopEditorSession] = useState<{
    file: File;
    mode: 'normal' | 'id_card';
    initialState?: Partial<EditorState>;
  } | null>(null);
  const [isPreparingEdit, setIsPreparingEdit] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const printFrameRef = useRef<HTMLIFrameElement | null>(null);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;
  const jobsRef = useRef<PrintJobCard[]>(jobs);
  jobsRef.current = jobs;
  const selectedJobIdRef = useRef<string | null>(selectedJobId);
  selectedJobIdRef.current = selectedJobId;
  const shopEditorSessionRef = useRef(shopEditorSession);
  shopEditorSessionRef.current = shopEditorSession;
  const isPrintingActionRef = useRef(isPrintingAction);
  isPrintingActionRef.current = isPrintingAction;

  // Unlock browser speech/audio permissions on first dashboard click
  useEffect(() => {
    const unlockOnce = () => unlockVoiceAudio();
    window.addEventListener('pointerdown', unlockOnce, { once: true });
    return () => window.removeEventListener('pointerdown', unlockOnce);
  }, []);

  const announcePrintRequest = (tokenNumber: number, paymentMethod?: string) => {
    if (!soundEnabledRef.current) return;
    notifyShopkeeperPrintRequest(tokenNumber, paymentMethod);
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

  const loadQueue = async (silent = false) => {
    try {
      if (!silent) setLoadingQueue(true);
      const res = await apiFetch<{ jobs: PrintJobCard[] }>('/jobs/pending');
      setJobs(res.jobs);
      if (res.jobs.length > 0 && !selectedJobIdRef.current) {
        setSelectedJobId(res.jobs[0].id);
      }
    } catch (err) {
      console.error('Queue fetch error:', err);
    } finally {
      if (!silent) setLoadingQueue(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
      loadQueue();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const onVisibilityChange = () => {
      if (!document.hidden) {
        loadQueue(true);
        loadStats();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!shop) return;
    const token = localStorage.getItem('printcart_token');
    const socket = io({ path: '/socket.io', auth: { token }, transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('shop:join', shop.id);
      loadQueue(true);
      loadStats();
    });
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('job:new', (newJob: PrintJobCard) => {
      setJobs((prev) => {
        if (prev.some((j) => j.id === newJob.id)) return prev;
        return [newJob, ...prev];
      });
      // Immediately switch preview to the new customer print (PDF or JPG/PNG)
      if (!shopEditorSessionRef.current && !isPrintingActionRef.current) {
        setQueueFilter('ALL');
        setSelectedJobId(newJob.id);
      }
      announcePrintRequest(newJob.tokenNumber, newJob.paymentMethod);
      loadStats();
    });
    socket.on('job:status', (payload: { jobId: string; status: string }) => {
      if (['COMPLETED', 'REJECTED', 'EXPIRED'].includes(payload.status)) {
        const remaining = jobsRef.current.filter((j) => j.id !== payload.jobId);
        jobsRef.current = remaining;
        setJobs(remaining);
        setSelectedJobId((curr) => (curr === payload.jobId ? remaining[0]?.id ?? null : curr));
        loadStats();
      } else {
        setJobs((prev) => {
          const next = prev.map((j) =>
            j.id === payload.jobId ? { ...j, status: payload.status as any } : j
          );
          jobsRef.current = next;
          return next;
        });
      }
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, [shop?.id]);

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
    if (!selectedJobId) {
      setPreviewBlobUrl(null);
      setPreviewMime(null);
      setPreviewError(null);
      setLoadingPreview(false);
      pdfDocRef.current = null;
      setShopEditorState(undefined);
      return;
    }

    let active = true;
    const outerController = new AbortController();
    setLoadingPreview(true);
    setPreviewError(null);
    setPreviewBlobUrl(null);
    setPreviewMime(null);
    setPdfPage(1);
    setPdfTotalPages(1);
    setRotation(0);
    setZoomLevel(1);
    pdfDocRef.current = null;
    setShopEditorState(undefined);

    const waitMs = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        const t = setTimeout(resolve, ms);
        outerController.signal.addEventListener('abort', () => {
          clearTimeout(t);
          reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
      });

    const fetchValidBlob = async (url: string, headers: Record<string, string> = {}): Promise<Blob> => {
      const timeoutCtrl = new AbortController();
      const onOuterAbort = () => timeoutCtrl.abort();
      outerController.signal.addEventListener('abort', onOuterAbort, { once: true });
      const timeoutId = setTimeout(() => timeoutCtrl.abort(), 15000);
      try {
        const response = await fetch(url, {
          headers,
          credentials: url.startsWith('/api/') ? 'include' : 'same-origin',
          cache: 'no-store',
          signal: timeoutCtrl.signal,
        });
        if (!response.ok) {
          throw new Error(`Storage HTTP ${response.status}`);
        }
        const blob = await response.blob();
        if (!blob || blob.size === 0) {
          throw new Error('Empty file received');
        }
        const bt = (blob.type || '').toLowerCase();
        if (bt.includes('application/json') || bt.includes('text/html')) {
          throw new Error('Invalid file payload received');
        }
        return blob;
      } finally {
        clearTimeout(timeoutId);
        outerController.signal.removeEventListener('abort', onOuterAbort);
      }
    };

    const loadPreview = async () => {
      const meta = await apiFetch<{ previewUrl: string; mimeType: string; fileName: string; pageCount: number }>(
        `/jobs/${selectedJobId}/preview-url`
      );
      if (!active) return;

      let previewTarget = meta.previewUrl;
      if (previewTarget.startsWith('http://localhost') || previewTarget.startsWith('http://127.0.0.1')) {
        try {
          const parsed = new URL(previewTarget);
          previewTarget = parsed.pathname + parsed.search;
        } catch {
          // keep original URL
        }
      }

      const authToken = localStorage.getItem('printcart_token');
      const authHeaders: Record<string, string> = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const proxyUrl = `/api/jobs/${selectedJobId}/file?t=${Date.now()}`;

      let blob: Blob | null = null;
      let lastErr: any = null;

      // Attempt 1 & 2: Direct preview URL, then Attempt 3 & 4: Authenticated backend stream fallback
      const attempts: Array<{ url: string; headers?: Record<string, string>; delay?: number }> = [
        { url: previewTarget },
        { url: previewTarget, delay: 350 },
        { url: proxyUrl, headers: authHeaders, delay: 250 },
        { url: proxyUrl, headers: authHeaders, delay: 700 },
      ];

      for (const attempt of attempts) {
        if (!active || outerController.signal.aborted) return;
        if (attempt.delay) await waitMs(attempt.delay);
        try {
          blob = await fetchValidBlob(attempt.url, attempt.headers);
          break;
        } catch (err: any) {
          if (outerController.signal.aborted) return;
          lastErr = err;
        }
      }

      if (!blob) {
        throw lastErr || new Error('Could not load document preview');
      }
      if (!active) return;

      let effectiveMime = (meta.mimeType || blob.type || '').toLowerCase();
      if (effectiveMime === 'image/jpg') effectiveMime = 'image/jpeg';
      const lowerName = (meta.fileName || '').toLowerCase();
      const isPdf = effectiveMime.includes('pdf') || lowerName.endsWith('.pdf');
      if (isPdf) effectiveMime = 'application/pdf';

      const normalizedBlob =
        effectiveMime && blob.type !== effectiveMime ? blob.slice(0, blob.size, effectiveMime) : blob;
      const blobUrl = URL.createObjectURL(normalizedBlob);

      if (isPdf) {
        const arrayBuffer = await normalizedBlob.arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        if (!active) {
          URL.revokeObjectURL(blobUrl);
          return;
        }
        pdfDocRef.current = doc;
        setPdfTotalPages(doc.numPages);
        setPreviewBlobUrl(blobUrl);
        setPreviewMime('application/pdf');
        setPdfDocVersion((v) => v + 1);
      } else {
        // Pre-verify image decode so JPG/PNG never flashes or sticks on broken state
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Image format could not be decoded'));
          img.src = blobUrl;
        });
        if (!active) {
          URL.revokeObjectURL(blobUrl);
          return;
        }
        pdfDocRef.current = null;
        setPreviewBlobUrl(blobUrl);
        setPreviewMime(effectiveMime || 'image/jpeg');
      }
    };

    loadPreview()
      .catch((err: any) => {
        if (!active || err?.name === 'AbortError') return;
        console.warn('Preview error:', err);
        setPreviewBlobUrl(null);
        setPreviewMime(null);
        setPreviewError(err?.message || 'Document preview could not be loaded');
      })
      .finally(() => {
        if (active) setLoadingPreview(false);
      });

    return () => {
      active = false;
      outerController.abort();
    };
  }, [selectedJobId, previewRetryTick]);

  const renderPdfPage = async (doc: any, pageNum: number, zoom: number, rot: number) => {
    if (!doc || !canvasRef.current) return;
    try {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore previous cancellation
        }
        renderTaskRef.current = null;
      }
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: zoom * 1.3, rotation: rot });
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      const task = page.render({ canvasContext: context, viewport });
      renderTaskRef.current = task;
      await task.promise;
      if (renderTaskRef.current === task) {
        renderTaskRef.current = null;
      }
    } catch (e: any) {
      if (e?.name !== 'RenderingCancelledException') {
        console.warn('PDF render error:', e);
      }
    }
  };

  useEffect(() => {
    if (!loadingPreview && previewMime === 'application/pdf' && pdfDocRef.current && canvasRef.current) {
      void renderPdfPage(pdfDocRef.current, pdfPage, zoomLevel, rotation);
    }
  }, [pdfDocVersion, loadingPreview, previewMime, pdfPage, zoomLevel, rotation]);

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

  const handleDownloadDocument = () => {
    if (!previewBlobUrl || !selectedJob) return;
    const a = document.createElement('a');
    a.href = previewBlobUrl;

    const ext = previewMime === 'application/pdf'
      ? '.pdf'
      : previewMime === 'image/png'
      ? '.png'
      : '.jpg';

    let baseName = selectedJob.fileName || (selectedJob.jobType === 'ID_CARD' ? 'ID_Card_Merged.pdf' : 'document');
    if (!baseName.toLowerCase().endsWith(ext)) {
      baseName += ext;
    }
    const tokenPrefix = `Token_${selectedJob.tokenNumber}_`;
    const finalDownloadName = baseName.startsWith('Token_') ? baseName : `${tokenPrefix}${baseName}`;

    a.download = finalDownloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenShopEditor = async () => {
    if (!selectedJob || !previewBlobUrl || isPreparingEdit) return;
    try {
      setIsPreparingEdit(true);
      let sourceFile: File;

      if (origPreviewFileRef.current?.jobId === selectedJob.id && !shopEditorState && previewMime === 'application/pdf') {
        sourceFile = origPreviewFileRef.current.file;
      } else if (origPreviewFileRef.current?.jobId === selectedJob.id && previewMime !== 'application/pdf') {
        sourceFile = origPreviewFileRef.current.file;
      } else if (previewMime === 'application/pdf' && pdfDocRef.current) {
        // Render active PDF page at crisp high resolution (~2.6x) so shopkeeper can crop & clean it too
        const page = await pdfDocRef.current.getPage(pdfPage);
        const viewport = page.getViewport({ scale: 2.6, rotation: 0 });
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = viewport.width;
        tmpCanvas.height = viewport.height;
        const ctx = tmpCanvas.getContext('2d')!;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
        await page.render({ canvasContext: ctx, viewport }).promise;

        const jpgBlob = await new Promise<Blob>((resolve, reject) => {
          tmpCanvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas encode failed'))), 'image/jpeg', 0.94);
        });
        const cleanBase = (selectedJob.fileName || 'document').replace(/\.[^.]+$/, '');
        sourceFile = new File([jpgBlob], `${cleanBase}_p${pdfPage}.jpg`, { type: 'image/jpeg' });
        origPreviewFileRef.current = { jobId: selectedJob.id, file: sourceFile };
      } else {
        const blob = await fetch(previewBlobUrl).then((r) => r.blob());
        const fileName = selectedJob.fileName || 'customer_document.jpg';
        sourceFile = new File([blob], fileName, { type: blob.type || previewMime || 'image/jpeg' });
        origPreviewFileRef.current = { jobId: selectedJob.id, file: sourceFile };
      }

      const rotTurns = Math.round((((rotation % 360) + 360) % 360) / 90) % 4;
      const initial = shopEditorState
        ? shopEditorState
        : rotTurns !== 0
        ? { rotation90: rotTurns, cropMode: 'box' as const, preset: 'original' as const }
        : { preset: 'original' as const };

      setShopEditorSession({
        file: sourceFile,
        mode: selectedJob.jobType === 'ID_CARD' ? 'id_card' : 'normal',
        initialState: initial,
      });
    } catch (err) {
      console.error('Shop editor open error:', err);
      alert('Could not open editor for this document.');
    } finally {
      setIsPreparingEdit(false);
    }
  };

  const handleShopEditorApply = (result: {
    file: File;
    dataUrl: string;
    editorState: EditorState;
  }) => {
    const newBlobUrl = URL.createObjectURL(result.file);
    pdfDocRef.current = null;
    setPreviewBlobUrl(newBlobUrl);
    setPreviewMime('image/jpeg');
    setRotation(0);
    setZoomLevel(1);
    setShopEditorState(result.editorState);
    setShopEditorSession(null);
  };

  const handleApprovePrint = async () => {
    if (!selectedJobId || !previewBlobUrl) return;
    try {
      setIsPrintingAction(true);
      const currentMime = previewMime;
      const currentRot = rotation;
      await apiFetch(`/jobs/${selectedJobId}/printing`, { method: 'POST' });
      await printDocumentViaFrame(printFrameRef.current, previewBlobUrl, currentMime, currentRot);
      await completeAndWipe(selectedJobId, previewBlobUrl, currentMime, currentRot);
    } catch (err: any) {
      alert(err.message || 'Print action failed');
    } finally {
      setIsPrintingAction(false);
    }
  };

  const completeAndWipe = async (
    jobId: string,
    currentBlobUrl: string,
    currentMime: string | null = previewMime,
    currentRot = rotation
  ) => {
    const targetJob = jobs.find((j) => j.id === jobId);
    const tokenNum = targetJob?.tokenNumber || 0;
    await apiFetch(`/jobs/${jobId}/complete`, { method: 'POST' });
    setReprintUndo({
      tokenNumber: tokenNum,
      blobUrl: currentBlobUrl,
      mimeType: currentMime,
      rotation: currentRot,
      secondsLeft: 30,
    });
    const remaining = jobsRef.current.filter((j) => j.id !== jobId);
    jobsRef.current = remaining;
    setJobs(remaining);
    setSelectedJobId((curr) => (curr === jobId ? remaining[0]?.id ?? null : curr));
    loadStats();
  };

  const handleReprintFromRAM = () => {
    if (!reprintUndo) return;
    void printDocumentViaFrame(
      printFrameRef.current,
      reprintUndo.blobUrl,
      reprintUndo.mimeType,
      reprintUndo.rotation
    );
  };

  const handleReject = async (reason: string) => {
    if (!selectedJobId) return;
    const targetJobId = selectedJobId;
    try {
      setIsRejecting(true);
      await apiFetch(`/jobs/${targetJobId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
      setShowRejectMenu(false);
      setCustomRejectReason('');
      const remaining = jobsRef.current.filter((j) => j.id !== targetJobId);
      jobsRef.current = remaining;
      setJobs(remaining);
      setSelectedJobId((curr) => (curr === targetJobId ? remaining[0]?.id ?? null : curr));
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
      if (shopEditorSession || showQrModal || showRejectMenu) return;
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
  }, [jobs, selectedJobId, queueFilter, previewBlobUrl, isPrintingAction, shopEditorSession, showQrModal, showRejectMenu]);

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  const formatTimeLeft = (expiresAt: string) => {
    const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now());
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="h-screen flex bg-slate-900 text-slate-100 overflow-hidden font-sans">
      <iframe
        ref={printFrameRef}
        className="fixed -left-[9999px] top-0 w-[210mm] h-[297mm] opacity-0 pointer-events-none border-0"
        title="print-frame"
      />

      {/* Sidebar */}
      <Sidebar
        shop={shop}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={async () => { await logout(); navigate('/login'); }}
        onUpgrade={() => setShowUpgradeModal(true)}
        isInstalled={isInstalled}
        onInstallApp={handleInstallApp}
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
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) unlockVoiceAudio();
              }}
              className={`p-2 rounded-lg border transition ${soundEnabled ? 'bg-blue-950 text-blue-400 border-blue-800' : 'bg-slate-900 text-slate-500 border-slate-800'}`}
              title={soundEnabled ? 'Hindi Voice Alerts ON' : 'Voice Alerts MUTED'}
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

            {/* Install Desktop PWA Software */}
            {!isInstalled && (
              <button
                type="button"
                onClick={handleInstallApp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-xs"
                title="Install PrintCart Counter Software on this Computer"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {isInstallable ? 'Install PC App' : 'Get Desktop App'}
                </span>
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
                      <div className="mt-2 flex items-center justify-between gap-1.5 text-[11px] text-slate-400">
                        <span className="truncate min-w-0 flex-1 font-mono text-slate-500">{job.fileName || (isIdCard ? 'ID_Card_Merged.pdf' : 'document')}</span>
                        <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                            job.paymentMethod === 'UPI_PAID'
                              ? 'bg-emerald-950 text-emerald-300'
                              : 'bg-amber-950/70 text-amber-300'
                          }`}>
                            {job.paymentMethod === 'UPI_PAID' ? 'UPI ✓' : 'Counter'}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                            isIdCard ? 'bg-teal-950 text-teal-300' : isColor ? 'bg-amber-950 text-amber-300' : 'bg-blue-950 text-blue-300'
                          }`}>
                            {isIdCard ? 'ID CARD' : job.colorMode}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold whitespace-nowrap">{job.pageCount}p×{job.copies}c</span>
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
                <div className="min-h-12 py-1.5 bg-slate-950/80 border-b border-slate-800 px-3 sm:px-4 flex flex-wrap items-center justify-between gap-2 shrink-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                    <span className="text-base sm:text-lg font-black font-mono text-blue-400 shrink-0 whitespace-nowrap">Token #{selectedJob.tokenNumber}</span>
                    <span className="text-xs text-slate-400 hidden xl:inline truncate max-w-[120px]">• {selectedJob.customerName || 'Walk-in'}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold shrink-0 whitespace-nowrap">
                      {selectedJob.colorMode} • {selectedJob.sides} • {selectedJob.copies}×
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded font-bold shrink-0 whitespace-nowrap ${
                      selectedJob.paymentMethod === 'UPI_PAID'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-800/70'
                    }`}>
                      {selectedJob.paymentMethod === 'UPI_PAID' ? 'UPI Paid ✓' : 'Pay Counter'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 shrink-0 ml-auto">
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
                    <span className="text-xs font-mono text-slate-400 w-10 text-center hidden sm:inline-block">{Math.round(zoomLevel * 100)}%</span>
                    <button onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
                    <button onClick={() => setRotation((r) => (r + 90) % 360)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg ml-1" title="Rotate 90°"><RotateCw className="w-4 h-4" /></button>
                    <button
                      onClick={handleOpenShopEditor}
                      disabled={!previewBlobUrl || isPreparingEdit}
                      className="px-2.5 py-1.5 bg-sky-600/20 hover:bg-sky-600/35 text-sky-300 border border-sky-500/40 rounded-lg ml-1 disabled:opacity-30 transition flex items-center gap-1.5 text-xs font-bold"
                      title="Crop, straighten & clean document before printing"
                    >
                      {isPreparingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crop className="w-3.5 h-3.5" />}
                      <span className="hidden md:inline">{shopEditorState ? 'Edited ✓' : 'Edit'}</span>
                    </button>
                    <button onClick={handleDownloadDocument} disabled={!previewBlobUrl} className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg ml-1 disabled:opacity-30 transition" title="Download Document (Save to PC)"><Download className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Preview body */}
                <div className="flex-1 min-h-0 overflow-auto p-4 flex items-center justify-center bg-slate-900/50 relative">
                  {loadingPreview ? (
                    <div className="text-center text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                      <span className="text-xs font-medium">Loading instant preview...</span>
                    </div>
                  ) : previewError ? (
                    <div className="text-center space-y-3 max-w-xs px-4">
                      <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                      <p className="text-xs text-slate-300 font-semibold">{previewError}</p>
                      <button
                        type="button"
                        onClick={() => setPreviewRetryTick((t) => t + 1)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retry Preview</span>
                      </button>
                    </div>
                  ) : previewMime === 'application/pdf' ? (
                    <canvas ref={canvasRef} className="shadow-2xl rounded-sm max-w-full max-h-full" />
                  ) : previewBlobUrl ? (
                    <img
                      key={`${selectedJob.id}-${previewBlobUrl}`}
                      src={previewBlobUrl}
                      alt="Document Preview"
                      onError={() => setPreviewError('Image preview failed to decode.')}
                      style={{ transform: `scale(${zoomLevel}) rotate(${rotation}deg)`, transition: 'transform 0.15s ease-out' }}
                      className="max-h-full max-w-full object-contain shadow-2xl rounded"
                    />
                  ) : (
                    <div className="text-center space-y-2 text-slate-500">
                      <span className="text-xs block">Preview unavailable</span>
                      <button
                        type="button"
                        onClick={() => setPreviewRetryTick((t) => t + 1)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                      >
                        <RefreshCw className="w-3 h-3" /> Reload
                      </button>
                    </div>
                  )}
                </div>

                {/* Action bar */}
                <div className="min-h-16 py-2.5 bg-slate-950 border-t border-slate-800 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2 shrink-0 relative">
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

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <button
                      type="button"
                      disabled={!previewBlobUrl || isPreparingEdit}
                      onClick={handleOpenShopEditor}
                      className="px-4 py-2.5 bg-sky-950/90 hover:bg-sky-900 hover:text-white text-sky-300 border border-sky-700/80 font-bold rounded-xl text-sm transition flex items-center gap-2 shadow-sm disabled:opacity-40"
                      title="Crop, straighten, remove shadows & enhance document before printing"
                    >
                      {isPreparingEdit ? (
                        <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                      ) : (
                        <Crop className="w-4 h-4 text-sky-400" />
                      )}
                      <span>{shopEditorState ? 'Edit Again ✓' : 'Edit / Crop'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={!previewBlobUrl}
                      onClick={handleDownloadDocument}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-200 border border-slate-700 font-bold rounded-xl text-sm transition flex items-center gap-2 shadow-sm disabled:opacity-40"
                      title="Save copy of this customer document to computer"
                    >
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>Download</span>
                    </button>
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

      {/* ── COUNTER POSTER & QR STUDIO MODAL ── */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-md">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span>Shop Counter Poster & QR Studio</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                      Active
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {shop?.shopName} • <span className="text-blue-400 font-mono">printcart.in/s/{shop?.slug}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal 2-Column Split: Poster Preview (Left) + Customizer & Downloads (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Live Rendered Poster Preview */}
              <div className="lg:col-span-6 flex flex-col items-center bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
                <div className="flex items-center justify-between w-full mb-3 text-[11px] font-bold text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Live Standee Preview
                  </span>
                  <span className="text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80">
                    A5 Tabletop Scanner Size
                  </span>
                </div>

                <div className="relative w-full max-w-[340px] aspect-[1/1.414] bg-white rounded-xl shadow-2xl border-4 border-slate-800 overflow-hidden flex items-center justify-center">
                  {isGeneratingPoster ? (
                    <div className="text-center space-y-2 p-6">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                      <p className="text-xs font-bold text-slate-600">Generating Standee with "P" Logo...</p>
                    </div>
                  ) : posterPreviewUrl ? (
                    <img
                      src={posterPreviewUrl}
                      alt="PrintCart Official Standee"
                      className="w-full h-full object-contain select-none"
                    />
                  ) : (
                    <div className="text-slate-400 text-xs">Generating preview...</div>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 mt-3 text-center">
                  💡 Scanner size <strong className="text-white">bada</strong> kar diya gaya hai aur QR ke center mein <strong className="text-white">"P" symbol</strong> embedded hai.
                </p>
              </div>

              {/* Right Column: Quote Selector & Download Actions */}
              <div className="lg:col-span-6 space-y-5">
                {/* 1. Quote Selection */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    1. Choose Standee Slogan / Quote:
                  </label>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {POSTER_QUOTES.map((q) => {
                      const isSelected = selectedQuote.id === q.id;
                      return (
                        <button
                          key={q.id}
                          onClick={() => setSelectedQuote(q)}
                          className={`w-full text-left p-3 rounded-xl border transition flex items-start justify-between gap-2.5 ${
                            isSelected
                              ? 'bg-slate-800/90 border-blue-500 shadow-sm ring-1 ring-blue-500/30'
                              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                          }`}
                        >
                          <div className="min-w-0">
                            <span
                              className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md inline-block mb-1"
                              style={{
                                color: q.primaryColor,
                                backgroundColor: isSelected ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.8)',
                              }}
                            >
                              {q.badge}
                            </span>
                            <p className={`text-xs font-bold leading-snug ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                              {q.headline}
                            </p>
                          </div>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Paper Size for PDF */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    2. Print Format (Default: A5 Standee):
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'A5', label: 'A5 Standee (Tabletop Scanner - Best)' },
                      { id: 'A4', label: 'A4 Poster (Wall / Door Print)' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPosterPaperSize(p.id as 'A4' | 'A5')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center ${
                          posterPaperSize === p.id
                            ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Download Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <button
                    disabled={downloadingFormat !== 'none' || isGeneratingPoster}
                    onClick={handleDownloadPosterPng}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:opacity-95 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition"
                  >
                    {downloadingFormat === 'png' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating High-Res Standee PNG...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Download Standee Image (PNG)</span>
                      </>
                    )}
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      disabled={downloadingFormat !== 'none' || isGeneratingPoster}
                      onClick={handleDownloadPosterPdf}
                      className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition border border-slate-700"
                    >
                      {downloadingFormat === 'pdf' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                      ) : (
                        <Printer className="w-3.5 h-3.5 text-blue-400" />
                      )}
                      <span>Download {posterPaperSize} PDF</span>
                    </button>

                    <Link
                      to="/dashboard/standee"
                      onClick={() => setShowQrModal(false)}
                      className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition border border-slate-700"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Full Studio ↗</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Desktop App / PWA Install Guide Modal (when browser hides one-click native prompt) */}
      {showInstallModal && (
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-100 relative">
            <button
              type="button"
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Install PrintCart on Your Computer
                </h3>
                <p className="text-xs text-slate-400">
                  Desktop shortcut & separate Counter window (Chrome / Edge)
                </p>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs text-slate-300 leading-relaxed">
              <p className="font-bold text-indigo-300">2-Second Install Steps (Windows / Mac):</p>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>
                  Browser ke top-right URL bar me <strong>Install Icon (Monitor/Download)</strong> par click karein.
                </li>
                <li>
                  Ya Browser Menu (<strong>⋮</strong> / <strong>⋯</strong>) kholein &rarr;{' '}
                  <strong>Cast, save, and share</strong> (ya <strong>Apps</strong>) &rarr;{' '}
                  <strong>Install PrintCart...</strong> par click karein.
                </li>
                <li>
                  App install hote hi Desktop & Taskbar par direct software icon ban jayega.
                </li>
              </ol>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
              >
                Samajh Gaya ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-Counter Shopkeeper Document Editor Modal */}
      {shopEditorSession && (
        <DocumentEditorModal
          file={shopEditorSession.file}
          mode={shopEditorSession.mode}
          lang="en"
          initialState={shopEditorSession.initialState}
          onCancel={() => setShopEditorSession(null)}
          onApply={handleShopEditorApply}
        />
      )}
    </div>
  );
};
