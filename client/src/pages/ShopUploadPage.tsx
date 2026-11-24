import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { PDFDocument, rgb } from 'pdf-lib';
import {
  Printer,
  ShieldCheck,
  UploadCloud,
  FileText,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCw,
  Sparkles,
  Camera,
  Layers,
  ArrowRight,
  Clock,
  Trash2,
  Loader2,
  ChevronRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { Shop } from '../types';

interface JobInitResponse {
  jobId: string;
  tokenNumber: number;
  uploadUrl: string;
  objectKey: string;
  estimatedPrice: number;
  expiresAt: string;
}

interface JobStatusData {
  id: string;
  tokenNumber: number;
  customerName?: string;
  jobType: 'NORMAL' | 'ID_CARD';
  pageCount: number;
  copies: number;
  colorMode: 'BW' | 'COLOR';
  sides: 'SINGLE' | 'DOUBLE';
  estimatedPrice: number;
  status: 'UPLOADING' | 'PENDING' | 'REVIEWING' | 'PRINTING' | 'COMPLETED' | 'REJECTED' | 'EXPIRED';
  rejectReason?: string;
  createdAt: string;
  expiresAt: string;
  shop: {
    id: string;
    shopName: string;
    upiId?: string | null;
  };
}

export const ShopUploadPage: React.FC = () => {
  const { shopSlug } = useParams<{ shopSlug: string }>();

  // Language state (en / hi)
  const [lang, setLang] = useState<'en' | 'hi'>('hi');

  // Shop metadata
  const [shop, setShop] = useState<(Shop & { isExpired?: boolean }) | null>(null);
  const [loadingShop, setLoadingShop] = useState(true);
  const [shopError, setShopError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'NORMAL' | 'ID_CARD'>('NORMAL');

  // --- Normal Print State ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(1);
  const [colorMode, setColorMode] = useState<'BW' | 'COLOR'>('BW');
  const [copies, setCopies] = useState<number>(1);
  const [sides, setSides] = useState<'SINGLE' | 'DOUBLE'>('SINGLE');
  const [customerName, setCustomerName] = useState<string>('');

  // --- ID Card State ---
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [autoBrighten, setAutoBrighten] = useState<boolean>(true);
  const [idCopies, setIdCopies] = useState<number>(1);

  // --- Uploading & Live Tracking State ---
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [activeJob, setActiveJob] = useState<JobStatusData | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Translations
  const t = {
    en: {
      privacyPill: '100% Private • Auto-deletes immediately after print',
      shopClosed: 'Shop Counter is Currently Closed',
      shopClosedDesc: 'The shopkeeper has temporarily paused online uploads. Please check back shortly.',
      shopExpired: 'Shop Offline',
      shopExpiredDesc: 'This print shop subscription is currently inactive.',
      tabNormal: 'Normal Print',
      tabId: 'ID Card Mode',
      uploadLabel: 'Tap to select document (PDF / JPG / PNG)',
      uploadSub: 'Max 15MB • Aadhaar, PAN, Resume, Admit Card',
      pagesDetected: 'pages detected',
      colorMode: 'Color Mode',
      bw: 'Black & White',
      color: 'Color Print',
      copies: 'Number of Copies',
      sides: 'Print Sides',
      single: 'Single Side',
      double: 'Front & Back (Duplex)',
      customerName: 'Your Name (Optional)',
      estTotal: 'Estimated Bill:',
      sendToCounter: 'Send to Counter →',
      idTitle: 'Front & Back ID Card Merge',
      idDesc: 'Take photo of Front and Back side. We merge both onto a single A4 sheet automatically.',
      frontSide: 'Front Side (Front Photo)',
      backSide: 'Back Side (Back Photo)',
      tapToCapture: 'Tap to capture / upload',
      autoBrighten: 'Auto-Brighten & Contrast (Recommended for Aadhaar/PAN)',
      a4Preview: 'Live A4 Print Preview',
      tokenTitle: 'Token Number',
      statusStep1: 'File Sent to Counter',
      statusStep2: 'Shopkeeper Reviewing...',
      statusStep3: 'Printing in Progress 🖨️',
      statusStep4: 'Printed & Permanently Deleted 🔒',
      rejectedTitle: 'Print Rejected by Shopkeeper',
      uploadAgain: 'Upload Again',
      payUpi: 'Pay via UPI App',
      uploadAnother: 'Print Another Document',
    },
    hi: {
      privacyPill: '🔒 100% प्राइवेट • प्रिंट होते ही सर्वर से तुरंत डिलीट',
      shopClosed: 'दुकान का काउंटर अभी बंद है',
      shopClosedDesc: 'दुकानदार ने अभी ऑनलाइन अपलोड कुछ समय के लिए रोका है। कृपया थोड़ी देर बाद प्रयास करें।',
      shopExpired: 'दुकान ऑफलाइन है',
      shopExpiredDesc: 'इस प्रिंट शॉप का सब्सक्रिप्शन अभी एक्टिव नहीं है।',
      tabNormal: 'नॉर्मल प्रिंट',
      tabId: 'ID कार्ड मोड (Aadhaar/PAN)',
      uploadLabel: 'डॉक्यूमेंट चुनें या यहाँ ड्रॉप करें (PDF / JPG / PNG)',
      uploadSub: 'अधिकतम 15MB • आधार, पैन, एडमिट कार्ड, रिज्यूमे',
      pagesDetected: 'पेज मिले',
      colorMode: 'प्रिंट कलर चुनें',
      bw: 'ब्लैक & व्हाइट (B&W)',
      color: 'कलर प्रिंट',
      copies: 'कितनी कॉपी चाहिए',
      sides: 'प्रिंट साइड्स',
      single: 'एक तरफ (Single Side)',
      double: 'आगे-पीछे (दोनों तरफ)',
      customerName: 'आपका नाम (वैकल्पिक)',
      estTotal: 'अनुमानित बिल:',
      sendToCounter: 'काउंटर पर भेजें →',
      idTitle: 'ID कार्ड आगे और पीछे ऑटो-मर्ज',
      idDesc: 'आगे और पीछे की फोटो लें। सिस्टम अपने आप दोनों को एक ही A4 पेज पर सेट कर देगा।',
      frontSide: 'आगे की साइड (Front Side)',
      backSide: 'पीछे की साइड (Back Side)',
      tapToCapture: 'कैमरा या गैलरी से फोटो लें',
      autoBrighten: 'फोटो साफ और ब्राइट करें (Auto-Brighten)',
      a4Preview: 'A4 शीट पर ऐसा दिखेगा',
      tokenTitle: 'टोकन नंबर',
      statusStep1: 'फाइल काउंटर पर पहुँच गई ✓',
      statusStep2: 'दुकानदार चेक कर रहे हैं...',
      statusStep3: 'प्रिंट हो रहा है 🖨️',
      statusStep4: 'प्रिंट हो गया और सर्वर से हमेशा के लिए डिलीट 🔒',
      rejectedTitle: 'दुकानदार ने प्रिंट रिजेक्ट कर दिया',
      uploadAgain: 'दोबारा अपलोड करें',
      payUpi: 'UPI से पेमेंट करें (PhonePe / GPay)',
      uploadAnother: 'कोई और फाइल प्रिंट करें',
    },
  }[lang];

  // Fetch Public Shop Info
  useEffect(() => {
    if (!shopSlug) return;
    setLoadingShop(true);
    apiFetch<{ shop: Shop & { isExpired?: boolean } }>(`/public/shops/${shopSlug}`)
      .then((res) => {
        setShop(res.shop);
        setShopError(null);
      })
      .catch((err) => {
        setShopError(err.message || 'Shop not found');
      })
      .finally(() => {
        setLoadingShop(false);
      });
  }, [shopSlug]);

  // Connect Socket.io when job is active
  useEffect(() => {
    if (!activeJob) return;

    const newSocket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      newSocket.emit('job:join', activeJob.id);
    });

    newSocket.on('job:status', (payload: { jobId: string; status: any; rejectReason?: string }) => {
      if (payload.jobId === activeJob.id) {
        setActiveJob((prev) => (prev ? { ...prev, status: payload.status, rejectReason: payload.rejectReason } : null));
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [activeJob?.id]);

  // Detect PDF Page Count
  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    if (file.type === 'application/pdf') {
      try {
        const buffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(buffer);
        setPageCount(pdf.getPageCount());
      } catch (err) {
        console.warn('Could not read PDF pages:', err);
        setPageCount(1);
      }
    } else {
      setPageCount(1);
    }
  };

  // Preprocess Image (Auto-Brighten & Contrast)
  const processImageToDataUrl = async (file: File, brighten: boolean): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;

        if (brighten) {
          // Increase contrast and brightness slightly for photo docs
          ctx.filter = 'brightness(1.08) contrast(1.15)';
        }
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.src = objectUrl;
    });
  };

  // Handle ID Card Front Image
  const handleFrontImage = async (file: File) => {
    setFrontImage(file);
    const dataUrl = await processImageToDataUrl(file, autoBrighten);
    setFrontPreview(dataUrl);
  };

  // Handle ID Card Back Image
  const handleBackImage = async (file: File) => {
    setBackImage(file);
    const dataUrl = await processImageToDataUrl(file, autoBrighten);
    setBackPreview(dataUrl);
  };

  // Calculate live estimate
  const calculateTotal = (): number => {
    if (!shop) return 0;
    if (activeTab === 'ID_CARD') {
      return (shop.idCardRate || 10) * idCopies;
    }
    const rate = colorMode === 'COLOR' ? shop.colorRate : shop.bwRate;
    return rate * pageCount * copies;
  };

  // Submit Normal Print Job
  const handleNormalSubmit = async () => {
    if (!selectedFile || !shop) return;

    try {
      setIsUploading(true);
      setUploadProgress('Preparing upload...');

      // 1. Init Job on server
      const initRes = await apiFetch<JobInitResponse>(`/public/shops/${shop.slug}/jobs/init`, {
        method: 'POST',
        body: JSON.stringify({
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
          fileSizeBytes: selectedFile.size,
          jobType: 'NORMAL',
          pageCount,
          copies,
          colorMode,
          sides,
          customerName: customerName.trim() || 'Walk-in',
        }),
      });

      // 2. Direct upload to Presigned PUT URL
      setUploadProgress('Uploading file to secure buffer...');
      const uploadRes = await fetch(initRes.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': selectedFile.type,
        },
        body: selectedFile,
      });

      if (!uploadRes.ok) {
        throw new Error('Upload to storage failed');
      }

      // 3. Confirm upload
      setUploadProgress('Notifying shopkeeper counter...');
      await apiFetch(`/public/jobs/${initRes.jobId}/confirm`, {
        method: 'POST',
      });

      // 4. Fetch full job status for tracking
      const fullJob = await apiFetch<{ job: JobStatusData }>(`/public/jobs/${initRes.jobId}`);
      setActiveJob(fullJob.job);
    } catch (err: any) {
      alert(err.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  // Submit ID Card Merged Job
  const handleIdCardSubmit = async () => {
    if (!frontImage || !backImage || !shop) {
      alert('Please select both Front and Back photos of the ID card.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress('Merging Front & Back onto A4 PDF...');

      // 1. Create crisp A4 PDF using pdf-lib in browser
      const pdfDoc = await PDFDocument.create();
      // Standard A4: 595.28 x 841.89 points
      const page = pdfDoc.addPage([595.28, 841.89]);
      const { width, height } = page.getSize();

      // Convert images to bytes
      const frontDataUrl = await processImageToDataUrl(frontImage, autoBrighten);
      const backDataUrl = await processImageToDataUrl(backImage, autoBrighten);

      const frontBytes = await fetch(frontDataUrl).then((r) => r.arrayBuffer());
      const backBytes = await fetch(backDataUrl).then((r) => r.arrayBuffer());

      const frontPdfImg = await pdfDoc.embedJpg(frontBytes);
      const backPdfImg = await pdfDoc.embedJpg(backBytes);

      // Card dimensions on A4: ~85.6mm x 54mm scaled to ~320pt x 202pt
      const cardW = 320;
      const cardH = 202;
      const centerX = (width - cardW) / 2;

      // Position Front Card (Upper Center)
      const frontY = height - 120 - cardH;
      page.drawImage(frontPdfImg, {
        x: centerX,
        y: frontY,
        width: cardW,
        height: cardH,
      });

      // Draw subtle cut guideline border around front
      page.drawRectangle({
        x: centerX,
        y: frontY,
        width: cardW,
        height: cardH,
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 0.5,
      });

      // Position Back Card (Lower Center with spacing)
      const backY = frontY - cardH - 50;
      page.drawImage(backPdfImg, {
        x: centerX,
        y: backY,
        width: cardW,
        height: cardH,
      });

      // Draw subtle cut guideline border around back
      page.drawRectangle({
        x: centerX,
        y: backY,
        width: cardW,
        height: cardH,
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 0.5,
      });

      const pdfBytes = await pdfDoc.save();
      const mergedPdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

      // 2. Initialize ID_CARD job on server
      setUploadProgress('Sending to shop counter...');
      const initRes = await apiFetch<JobInitResponse>(`/public/shops/${shop.slug}/jobs/init`, {
        method: 'POST',
        body: JSON.stringify({
          fileName: `ID_Card_Merged_${Date.now()}.pdf`,
          mimeType: 'application/pdf',
          fileSizeBytes: mergedPdfBlob.size,
          jobType: 'ID_CARD',
          pageCount: 1,
          copies: idCopies,
          colorMode: 'COLOR',
          sides: 'SINGLE',
          customerName: customerName.trim() || 'Walk-in ID Card',
        }),
      });

      // 3. Upload merged PDF to presigned URL
      const uploadRes = await fetch(initRes.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/pdf',
        },
        body: mergedPdfBlob,
      });

      if (!uploadRes.ok) {
        throw new Error('Upload to storage failed');
      }

      // 4. Confirm upload
      await apiFetch(`/public/jobs/${initRes.jobId}/confirm`, {
        method: 'POST',
      });

      // 5. Track live job
      const fullJob = await apiFetch<{ job: JobStatusData }>(`/public/jobs/${initRes.jobId}`);
      setActiveJob(fullJob.job);
    } catch (err: any) {
      alert(err.message || 'ID Card merge failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  if (loadingShop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (shopError || !shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <XCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Shop Not Found</h2>
          <p className="text-sm text-slate-500">
            The link you scanned does not exist or may have been typed incorrectly.
          </p>
          <Link to="/" className="inline-block text-sm font-bold text-blue-600 hover:underline">
            Go to PrintCart Home
          </Link>
        </div>
      </div>
    );
  }

  // Shop Closed or Expired State
  if (!shop.isCounterOpen || shop.isExpired) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900 p-4">
        <div className="max-w-md w-full mx-auto my-auto bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-5 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              {shop.shopName}
            </span>
            <h2 className="text-2xl font-black text-slate-950">
              {shop.isExpired ? t.shopExpired : t.shopClosed}
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {shop.isExpired ? t.shopExpiredDesc : t.shopClosedDesc}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Status</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 pb-2">
          printcart.in • 100% Zero-Storage Privacy
        </p>
      </div>
    );
  }

  // =========================================================================
  // VIEW: LIVE TOKEN STATUS TRACKER (After successful upload)
  // =========================================================================
  if (activeJob) {
    const isPending = activeJob.status === 'PENDING';
    const isReviewing = activeJob.status === 'REVIEWING';
    const isPrinting = activeJob.status === 'PRINTING';
    const isCompleted = activeJob.status === 'COMPLETED';
    const isRejected = activeJob.status === 'REJECTED';
    const isExpired = activeJob.status === 'EXPIRED';

    // Step index (1-4)
    let stepIndex = 1;
    if (isReviewing) stepIndex = 2;
    if (isPrinting) stepIndex = 3;
    if (isCompleted) stepIndex = 4;

    const upiLink =
      activeJob.shop.upiId && activeJob.estimatedPrice > 0
        ? `upi://pay?pa=${encodeURIComponent(activeJob.shop.upiId)}&pn=${encodeURIComponent(
            activeJob.shop.shopName
          )}&am=${activeJob.estimatedPrice}&cu=INR&tn=PrintCart%20Token%20${activeJob.tokenNumber}`
        : null;

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6">
        <div className="max-w-md w-full mx-auto space-y-4">
          {/* Shop Header */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-xs">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 text-sm">{shop.shopName}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-[11px] text-slate-400 font-mono">/s/{shop.slug}</p>
            </div>
            <button
              onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
              className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              {lang === 'en' ? 'हिंदी' : 'English'}
            </button>
          </div>

          {/* Token Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xl text-center space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500"></div>

            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400 block mb-1">
                {t.tokenTitle}
              </span>
              <div className="text-5xl sm:text-6xl font-black text-blue-600 font-mono tracking-tight">
                #{activeJob.tokenNumber}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {activeJob.customerName && activeJob.customerName !== 'Walk-in'
                  ? `For: ${activeJob.customerName} • `
                  : ''}
                {activeJob.pageCount} page(s) • {activeJob.copies} copy
              </p>
            </div>

            {/* Price Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 text-slate-900 font-black text-lg">
              <span className="text-xs font-semibold text-slate-500">Total:</span>
              <span>₹{activeJob.estimatedPrice}</span>
            </div>

            {/* REJECTED STATE */}
            {isRejected ? (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-left space-y-2">
                <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                  <XCircle className="w-5 h-5" />
                  <span>{t.rejectedTitle}</span>
                </div>
                <p className="text-xs text-red-600">
                  <strong>Reason:</strong> {activeJob.rejectReason || 'File unclear or format error'}
                </p>
                <button
                  onClick={() => setActiveJob(null)}
                  className="w-full mt-2 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition"
                >
                  {t.uploadAgain}
                </button>
              </div>
            ) : isExpired ? (
              <div className="p-4 rounded-2xl bg-slate-100 text-slate-600 text-xs">
                Time expired. File removed from queue.
              </div>
            ) : (
              /* LIVE 4-STEP TRACKER */
              <div className="pt-2 text-left space-y-3">
                {[
                  { title: t.statusStep1, active: stepIndex >= 1, done: stepIndex > 1 },
                  { title: t.statusStep2, active: stepIndex >= 2, done: stepIndex > 2 },
                  { title: t.statusStep3, active: stepIndex >= 3, done: stepIndex > 3 },
                  { title: t.statusStep4, active: stepIndex >= 4, done: stepIndex === 4 },
                ].map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                        step.done
                          ? 'bg-emerald-600 text-white'
                          : step.active
                          ? 'bg-blue-600 text-white animate-pulse'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {step.done ? '✓' : idx + 1}
                    </div>
                    <div className="pt-1">
                      <p
                        className={`text-xs font-bold ${
                          step.active ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {step.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Optional 1-Tap UPI Payment */}
            {upiLink && !isRejected && (
              <div className="pt-2">
                <a
                  href={upiLink}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-sm"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>
                    {t.payUpi} (₹{activeJob.estimatedPrice})
                  </span>
                </a>
              </div>
            )}

            {/* Upload another */}
            <div className="pt-1">
              <button
                onClick={() => {
                  setActiveJob(null);
                  setSelectedFile(null);
                  setFrontImage(null);
                  setBackImage(null);
                }}
                className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
              >
                + {t.uploadAnother}
              </button>
            </div>
          </div>

          {/* Privacy Footnote */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center gap-2 text-[11px] text-emerald-800 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{t.privacyPill}</span>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 pt-4">
          printcart.in • Bharat's QR-to-Print Platform
        </p>
      </div>
    );
  }

  // =========================================================================
  // VIEW: MAIN CUSTOMER UPLOAD SCREEN
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between pb-28 text-slate-900">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h1 className="font-black text-slate-900 text-sm leading-tight">{shop.shopName}</h1>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              </div>
              <p className="text-[11px] text-slate-500">{shop.city || 'Verified Print Shop'}</p>
            </div>
          </div>

          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            className="px-2.5 py-1 text-xs font-extrabold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
          >
            {lang === 'en' ? 'हिंदी' : 'English'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md w-full mx-auto p-4 space-y-4">
        {/* Green Privacy Pill */}
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-center">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{t.privacyPill}</span>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-200 p-1 rounded-2xl grid grid-cols-2 gap-1 text-xs font-extrabold">
          <button
            type="button"
            onClick={() => setActiveTab('NORMAL')}
            className={`py-2.5 rounded-xl transition ${
              activeTab === 'NORMAL'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📄 {t.tabNormal}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ID_CARD')}
            className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1 ${
              activeTab === 'ID_CARD'
                ? 'bg-white text-teal-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
            <span>{t.tabId}</span>
          </button>
        </div>

        {/* ---------------- TAB 1: NORMAL PRINT MODE ---------------- */}
        {activeTab === 'NORMAL' && (
          <div className="space-y-4">
            {/* Upload Drag/Tap Box */}
            <div className="relative">
              <input
                type="file"
                accept=".pdf,image/jpeg,image/png,image/jpg"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div
                className={`border-2 border-dashed rounded-3xl p-6 text-center transition ${
                  selectedFile
                    ? 'border-blue-500 bg-blue-50/40'
                    : 'border-slate-300 hover:border-blue-400 bg-white'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                {selectedFile ? (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900 truncate max-w-[280px] mx-auto">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs font-semibold text-blue-700">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {pageCount} {t.pagesDetected}
                    </p>
                    <p className="text-[11px] text-slate-400">Tap to replace document</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900">{t.uploadLabel}</p>
                    <p className="text-xs text-slate-500">{t.uploadSub}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Print Options */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-sm">
              {/* Color Mode Chips */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  {t.colorMode}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setColorMode('BW')}
                    className={`py-3 px-3 rounded-2xl border text-left transition ${
                      colorMode === 'BW'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-950 font-extrabold ring-2 ring-blue-500/20'
                        : 'border-slate-200 text-slate-700 font-semibold'
                    }`}
                  >
                    <div className="text-xs">{t.bw}</div>
                    <div className="text-sm font-black text-slate-900 mt-0.5">₹{shop.bwRate}/pg</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setColorMode('COLOR')}
                    className={`py-3 px-3 rounded-2xl border text-left transition ${
                      colorMode === 'COLOR'
                        ? 'border-amber-500 bg-amber-50/50 text-amber-950 font-extrabold ring-2 ring-amber-500/20'
                        : 'border-slate-200 text-slate-700 font-semibold'
                    }`}
                  >
                    <div className="text-xs">{t.color}</div>
                    <div className="text-sm font-black text-amber-700 mt-0.5">₹{shop.colorRate}/pg</div>
                  </button>
                </div>
              </div>

              {/* Copies Stepper */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t.copies}
                </span>
                <div className="flex items-center gap-3 bg-slate-100 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setCopies(Math.max(1, copies - 1))}
                    className="w-8 h-8 rounded-lg bg-white font-bold text-slate-800 shadow-xs flex items-center justify-center text-lg active:scale-95 transition"
                  >
                    -
                  </button>
                  <span className="font-extrabold text-sm w-6 text-center tabular-nums">
                    {copies}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCopies(copies + 1)}
                    className="w-8 h-8 rounded-lg bg-white font-bold text-slate-800 shadow-xs flex items-center justify-center text-lg active:scale-95 transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Sides (Single vs Duplex) */}
              <div className="border-t border-slate-100 pt-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  {t.sides}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSides('SINGLE')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                      sides === 'SINGLE'
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {t.single}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSides('DOUBLE')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                      sides === 'DOUBLE'
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {t.double}
                  </button>
                </div>
              </div>

              {/* Customer Name */}
              <div className="border-t border-slate-100 pt-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  {t.customerName}
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul, Pooja"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* ---------------- TAB 2: ID CARD MERGE MODE ---------------- */}
        {activeTab === 'ID_CARD' && (
          <div className="space-y-4">
            <div className="bg-teal-50 border border-teal-200 rounded-3xl p-4 text-teal-950 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-sm text-teal-900">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>{t.idTitle}</span>
              </div>
              <p className="text-xs text-teal-800 leading-relaxed">{t.idDesc}</p>
            </div>

            {/* Two Photo Boxes: Front & Back */}
            <div className="grid grid-cols-2 gap-3">
              {/* Front Box */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFrontImage(e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div
                  className={`border-2 border-dashed rounded-2xl p-4 text-center aspect-[4/3] flex flex-col items-center justify-center transition overflow-hidden ${
                    frontPreview
                      ? 'border-teal-500 bg-teal-50/20'
                      : 'border-slate-300 hover:border-teal-400 bg-white'
                  }`}
                >
                  {frontPreview ? (
                    <img
                      src={frontPreview}
                      alt="Front Side"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <>
                      <Camera className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs font-bold text-slate-800">{t.frontSide}</span>
                      <span className="text-[10px] text-slate-400">{t.tapToCapture}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Back Box */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleBackImage(e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div
                  className={`border-2 border-dashed rounded-2xl p-4 text-center aspect-[4/3] flex flex-col items-center justify-center transition overflow-hidden ${
                    backPreview
                      ? 'border-teal-500 bg-teal-50/20'
                      : 'border-slate-300 hover:border-teal-400 bg-white'
                  }`}
                >
                  {backPreview ? (
                    <img
                      src={backPreview}
                      alt="Back Side"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <>
                      <Camera className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs font-bold text-slate-800">{t.backSide}</span>
                      <span className="text-[10px] text-slate-400">{t.tapToCapture}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Auto Brighten Toggle */}
            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 pr-2">{t.autoBrighten}</span>
              <input
                type="checkbox"
                checked={autoBrighten}
                onChange={(e) => setAutoBrighten(e.target.checked)}
                className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
              />
            </div>

            {/* ID Card Copies Stepper */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  {t.copies}
                </span>
                <span className="text-[11px] text-slate-400">₹{shop.idCardRate || 10}/card</span>
              </div>
              <div className="flex items-center gap-3 bg-slate-100 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setIdCopies(Math.max(1, idCopies - 1))}
                  className="w-8 h-8 rounded-lg bg-white font-bold text-slate-800 shadow-xs flex items-center justify-center text-lg active:scale-95 transition"
                >
                  -
                </button>
                <span className="font-extrabold text-sm w-6 text-center tabular-nums">
                  {idCopies}
                </span>
                <button
                  type="button"
                  onClick={() => setIdCopies(idCopies + 1)}
                  className="w-8 h-8 rounded-lg bg-white font-bold text-slate-800 shadow-xs flex items-center justify-center text-lg active:scale-95 transition"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              {t.estTotal}
            </span>
            <span className="text-2xl font-black text-slate-950 tabular-nums">
              ₹{calculateTotal()}
            </span>
          </div>

          <button
            type="button"
            disabled={
              isUploading ||
              (activeTab === 'NORMAL' && !selectedFile) ||
              (activeTab === 'ID_CARD' && (!frontImage || !backImage))
            }
            onClick={activeTab === 'NORMAL' ? handleNormalSubmit : handleIdCardSubmit}
            className="flex-1 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-extrabold rounded-2xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 text-sm transition"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="truncate">{uploadProgress || 'Uploading...'}</span>
              </>
            ) : (
              <>
                <span>{t.sendToCounter}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};
