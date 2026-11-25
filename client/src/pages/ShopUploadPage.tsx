import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { PDFDocument, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import {
  Printer,
  ShieldCheck,
  UploadCloud,
  FileText,
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
  Crop,
  Banknote,
  Smartphone,
  Volume2,
  X,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { Shop } from '../types';
import { DocumentEditorModal } from '../components/DocumentEditorModal';
import { EditorState, loadFileToCanvas, exportCanvasToFile } from '../lib/imageProcessor';
import { unlockVoiceAudio, notifyCustomerPrintApproved } from '../lib/voiceAlert';
import { calcTieredPrintTotal, hasTieredExtraRate } from '../utils/pricing';

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
  paymentMethod?: 'COUNTER' | 'UPI_PAID' | string;
  status: 'UPLOADING' | 'PENDING' | 'REVIEWING' | 'PRINTING' | 'COMPLETED' | 'REJECTED' | 'EXPIRED';
  rejectReason?: string;
  createdAt: string;
  expiresAt: string;
  shop: {
    id: string;
    shopName: string;
    upiId?: string | null;
    customQrUrl?: string | null;
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
  const [normalRawFile, setNormalRawFile] = useState<File | null>(null);
  const [normalPreviewUrl, setNormalPreviewUrl] = useState<string | null>(null);
  const [normalEditorState, setNormalEditorState] = useState<EditorState | undefined>(undefined);
  const [pageCount, setPageCount] = useState<number>(1);
  const [colorMode, setColorMode] = useState<'BW' | 'COLOR'>('BW');
  const [copies, setCopies] = useState<number>(1);
  const [sides, setSides] = useState<'SINGLE' | 'DOUBLE'>('SINGLE');
  const [customerName, setCustomerName] = useState<string>('');

  // --- ID Card State ---
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [frontRawFile, setFrontRawFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [frontEditorState, setFrontEditorState] = useState<EditorState | undefined>(undefined);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [backRawFile, setBackRawFile] = useState<File | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [backEditorState, setBackEditorState] = useState<EditorState | undefined>(undefined);
  const [autoBrighten, setAutoBrighten] = useState<boolean>(true);
  const [idCopies, setIdCopies] = useState<number>(1);

  // --- In-Browser Document / Image Editor Modal State ---
  const [editorSession, setEditorSession] = useState<{
    target: 'normal' | 'front' | 'back';
    file: File;
    mode: 'normal' | 'id_card';
    initialState?: Partial<EditorState>;
    isReEdit: boolean;
  } | null>(null);

  // --- Pre-Request Payment & Tracking State ---
  const [paymentChoice, setPaymentChoice] = useState<'COUNTER' | 'UPI'>('COUNTER');
  const [pendingUpiConfirm, setPendingUpiConfirm] = useState<{
    jobId: string;
    tokenNumber: number;
    amount: number;
    upiLink: string | null;
    upiQrDataUrl: string;
    customQrUrl: string | null;
  } | null>(null);
  const [showOriginalCustomQr, setShowOriginalCustomQr] = useState(false);
  const [confirmingUpi, setConfirmingUpi] = useState(false);

  // --- Uploading & Live Tracking State ---
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [activeJob, setActiveJob] = useState<JobStatusData | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const langRef = useRef(lang);
  langRef.current = lang;
  const announcedStatusRef = useRef<Record<string, boolean>>({});

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
      cropEnhance: 'Crop & Enhance',
      replaceFile: 'Change File',
      editedReady: 'Cropped & Enhanced ✓',
      rawReady: 'Ready for Print',
      payOptionTitle: 'Choose Payment Method',
      payCounterTitle: 'Pay at Counter',
      payCounterSub: 'Cash / Scan Counter QR',
      payUpiNowTitle: 'Pay Now via UPI',
      payUpiNowSub: 'GPay • PhonePe • Paytm',
      payAndSend: 'Pay & Send Request →',
      paidUpiBadge: 'Paid Online via UPI ✓',
      payCounterBadge: 'Pay at Counter',
      printingVoiceBanner: 'Print approved! Your document is printing now. Collect at counter.',
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
      cropEnhance: 'क्रॉप और साफ करें',
      replaceFile: 'फाइल बदलें',
      editedReady: 'क्रॉप और साफ हो गई ✓',
      rawReady: 'प्रिंट के लिए तैयार',
      payOptionTitle: 'पेमेंट का तरीका चुनें',
      payCounterTitle: 'काउंटर पर पे करें',
      payCounterSub: 'नकद कैश या काउंटर QR',
      payUpiNowTitle: 'अभी UPI से पे करें',
      payUpiNowSub: 'GPay • PhonePe • Paytm',
      payAndSend: 'UPI पे करें और प्रिंट भेजें →',
      paidUpiBadge: 'UPI पेमेंट हो चुकी है ✓',
      payCounterBadge: 'काउंटर पर पेमेंट करें',
      printingVoiceBanner: 'प्रिंट अप्रूव हो गया! आपका प्रिंट निकल रहा है, कृपया काउंटर से लें।',
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
        if (payload.status === 'PRINTING' && !announcedStatusRef.current[`${payload.jobId}:PRINTING`]) {
          announcedStatusRef.current[`${payload.jobId}:PRINTING`] = true;
          notifyCustomerPrintApproved(langRef.current, activeJob.tokenNumber, 'PRINTING');
        } else if (
          payload.status === 'COMPLETED' &&
          !announcedStatusRef.current[`${payload.jobId}:PRINTING`] &&
          !announcedStatusRef.current[`${payload.jobId}:COMPLETED`]
        ) {
          announcedStatusRef.current[`${payload.jobId}:COMPLETED`] = true;
          notifyCustomerPrintApproved(langRef.current, activeJob.tokenNumber, 'COMPLETED');
        }
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [activeJob?.id]);

  const isImageFile = (file: File) =>
    file.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(file.name);

  // Detect PDF Page Count OR launch Document Editor for images
  const handleFileChange = async (file: File) => {
    if (isImageFile(file)) {
      setNormalRawFile(file);
      setEditorSession({
        target: 'normal',
        file,
        mode: 'normal',
        isReEdit: false,
      });
      return;
    }

    setSelectedFile(file);
    setNormalRawFile(null);
    setNormalPreviewUrl(null);
    setNormalEditorState(undefined);
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

  // Preprocess Image (Auto-Brighten & Contrast fallback when editor skipped)
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

  // Handle ID Card Front Image -> Opens Document Editor
  const handleFrontImage = async (file: File) => {
    setFrontRawFile(file);
    setEditorSession({
      target: 'front',
      file,
      mode: 'id_card',
      isReEdit: false,
    });
  };

  // Handle ID Card Back Image -> Opens Document Editor
  const handleBackImage = async (file: File) => {
    setBackRawFile(file);
    setEditorSession({
      target: 'back',
      file,
      mode: 'id_card',
      isReEdit: false,
    });
  };

  const handleEditorApply = (result: { file: File; dataUrl: string; editorState: EditorState }) => {
    if (!editorSession) return;
    if (editorSession.target === 'normal') {
      setSelectedFile(result.file);
      setNormalPreviewUrl(result.dataUrl);
      setNormalEditorState(result.editorState);
      setPageCount(1);
    } else if (editorSession.target === 'front') {
      setFrontImage(result.file);
      setFrontPreview(result.dataUrl);
      setFrontEditorState(result.editorState);
    } else if (editorSession.target === 'back') {
      setBackImage(result.file);
      setBackPreview(result.dataUrl);
      setBackEditorState(result.editorState);
    }
    setEditorSession(null);
  };

  const handleEditorSkip = async () => {
    if (!editorSession) return;
    const raw = editorSession.file;
    try {
      const needsJpegConvert = raw.type === 'image/webp' || raw.size > 14 * 1024 * 1024;
      if (editorSession.target === 'normal') {
        const canvas = await loadFileToCanvas(raw, needsJpegConvert ? 2200 : 1200);
        if (needsJpegConvert) {
          const converted = await exportCanvasToFile(canvas, raw.name, 0.92);
          setSelectedFile(converted.file);
          setNormalPreviewUrl(converted.dataUrl);
        } else {
          setSelectedFile(raw);
          setNormalPreviewUrl(canvas.toDataURL('image/jpeg', 0.85));
        }
        setNormalEditorState(undefined);
        setPageCount(1);
      } else if (editorSession.target === 'front') {
        setFrontImage(raw);
        setFrontEditorState(undefined);
        const dataUrl = await processImageToDataUrl(raw, autoBrighten);
        setFrontPreview(dataUrl);
      } else if (editorSession.target === 'back') {
        setBackImage(raw);
        setBackEditorState(undefined);
        const dataUrl = await processImageToDataUrl(raw, autoBrighten);
        setBackPreview(dataUrl);
      }
    } catch {
      if (editorSession.target === 'normal') {
        setSelectedFile(raw);
        setPageCount(1);
      }
    } finally {
      setEditorSession(null);
    }
  };

  // Calculate live estimate (tiered: 1st page + after-1st-page rate if set)
  const calculateTotal = (): number => {
    if (!shop) return 0;
    if (activeTab === 'ID_CARD') {
      return Math.round((shop.idCardRate || 10) * idCopies * 100) / 100;
    }
    if (colorMode === 'COLOR') {
      return calcTieredPrintTotal(pageCount * copies, shop.colorRate, shop.colorExtraRate);
    }
    return calcTieredPrintTotal(pageCount * copies, shop.bwRate, shop.bwExtraRate);
  };

  const hasOnlineUpi = Boolean(shop?.upiId || shop?.customQrUrl);

  const confirmAndTrackJob = async (jobId: string, method: 'COUNTER' | 'UPI_PAID') => {
    await apiFetch(`/public/jobs/${jobId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod: method }),
    });
    const fullJob = await apiFetch<{ job: JobStatusData }>(`/public/jobs/${jobId}`);
    setActiveJob(fullJob.job);
  };

  const finalizeOrPromptPayment = async (initRes: JobInitResponse) => {
    const wantsUpi = paymentChoice === 'UPI' && hasOnlineUpi && initRes.estimatedPrice > 0;
    if (!wantsUpi) {
      setUploadProgress('Notifying shopkeeper counter...');
      await confirmAndTrackJob(initRes.jobId, 'COUNTER');
      return;
    }

    // Hold job silently before notifying shopkeeper until user finishes UPI payment step
    let upiLink: string | null = null;
    let upiQrDataUrl = shop!.customQrUrl || '';

    if (shop!.upiId) {
      upiLink = `upi://pay?pa=${encodeURIComponent(shop!.upiId!)}&pn=${encodeURIComponent(
        shop!.shopName
      )}&am=${initRes.estimatedPrice}&cu=INR&tn=${encodeURIComponent(`PrintCart Token ${initRes.tokenNumber}`)}`;
      upiQrDataUrl = await QRCode.toDataURL(upiLink, { width: 240, margin: 1 });
    }

    setShowOriginalCustomQr(!shop!.upiId && Boolean(shop!.customQrUrl));
    setPendingUpiConfirm({
      jobId: initRes.jobId,
      tokenNumber: initRes.tokenNumber,
      amount: initRes.estimatedPrice,
      upiLink,
      upiQrDataUrl,
      customQrUrl: shop!.customQrUrl || null,
    });
  };

  const handleUpiConfirmChoice = async (method: 'UPI_PAID' | 'COUNTER') => {
    if (!pendingUpiConfirm || confirmingUpi) return;
    unlockVoiceAudio();
    try {
      setConfirmingUpi(true);
      await confirmAndTrackJob(pendingUpiConfirm.jobId, method);
      setPendingUpiConfirm(null);
    } catch (err: any) {
      alert(err.message || 'Could not confirm request. Please try again.');
    } finally {
      setConfirmingUpi(false);
    }
  };

  // Submit Normal Print Job
  const handleNormalSubmit = async () => {
    if (!selectedFile || !shop) return;
    unlockVoiceAudio();

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
          paymentMethod: paymentChoice === 'UPI' && hasOnlineUpi ? 'UPI_PAID' : 'COUNTER',
        }),
      });

      // 2. Direct upload to Presigned PUT URL (safely normalize if localhost was returned on production)
      setUploadProgress('Uploading file to secure buffer...');
      let uploadTarget = initRes.uploadUrl;
      if (uploadTarget.startsWith('http://localhost') || uploadTarget.startsWith('http://127.0.0.1')) {
        try {
          const parsed = new URL(uploadTarget);
          uploadTarget = parsed.pathname + parsed.search;
        } catch {
          // fallback to raw url
        }
      }

      const uploadRes = await fetch(uploadTarget, {
        method: 'PUT',
        headers: {
          'Content-Type': selectedFile.type,
        },
        body: selectedFile,
      });

      if (!uploadRes.ok) {
        throw new Error('Upload to storage failed');
      }

      // 3. Either confirm immediately (Counter Pay) or open Pre-Request UPI Payment Step
      await finalizeOrPromptPayment(initRes);
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
    unlockVoiceAudio();

    try {
      setIsUploading(true);
      setUploadProgress('Merging Front & Back onto A4 PDF...');

      // 1. Create crisp A4 PDF using pdf-lib in browser
      const pdfDoc = await PDFDocument.create();
      // Standard A4: 595.28 x 841.89 points
      const page = pdfDoc.addPage([595.28, 841.89]);
      const { width, height } = page.getSize();

      // Convert images to bytes (skip double-brighten if already enhanced via DocumentEditorModal)
      const frontDataUrl =
        frontEditorState && frontPreview
          ? frontPreview
          : await processImageToDataUrl(frontImage, autoBrighten);
      const backDataUrl =
        backEditorState && backPreview
          ? backPreview
          : await processImageToDataUrl(backImage, autoBrighten);

      const frontBytes = await fetch(frontDataUrl).then((r) => r.arrayBuffer());
      const backBytes = await fetch(backDataUrl).then((r) => r.arrayBuffer());

      const frontPdfImg = await pdfDoc.embedJpg(frontBytes);
      const backPdfImg = await pdfDoc.embedJpg(backBytes);

      // Card dimensions on A4: ~85.6mm x 54mm scaled to ~320pt x 202pt
      const cardW = 320;
      const cardH = 202;
      const centerX = (width - cardW) / 2;

      const drawFittedImage = (
        imgObj: typeof frontPdfImg,
        slotX: number,
        slotY: number,
        slotW: number,
        slotH: number
      ) => {
        const imgRatio = imgObj.width / imgObj.height;
        const slotRatio = slotW / slotH;
        let drawW = slotW;
        let drawH = slotH;
        if (Math.abs(imgRatio - slotRatio) > 0.08) {
          if (imgRatio > slotRatio) {
            drawH = slotW / imgRatio;
          } else {
            drawW = slotH * imgRatio;
          }
        }
        const dx = slotX + (slotW - drawW) / 2;
        const dy = slotY + (slotH - drawH) / 2;
        page.drawImage(imgObj, { x: dx, y: dy, width: drawW, height: drawH });
      };

      // Position Front Card (Upper Center)
      const frontY = height - 120 - cardH;
      drawFittedImage(frontPdfImg, centerX, frontY, cardW, cardH);

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
      drawFittedImage(backPdfImg, centerX, backY, cardW, cardH);

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
      setUploadProgress('Preparing print request...');
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
          paymentMethod: paymentChoice === 'UPI' && hasOnlineUpi ? 'UPI_PAID' : 'COUNTER',
        }),
      });

      // 3. Upload merged PDF to presigned URL (safely normalize if localhost was returned on production)
      let idUploadTarget = initRes.uploadUrl;
      if (idUploadTarget.startsWith('http://localhost') || idUploadTarget.startsWith('http://127.0.0.1')) {
        try {
          const parsed = new URL(idUploadTarget);
          idUploadTarget = parsed.pathname + parsed.search;
        } catch {
          // fallback to raw url
        }
      }

      const uploadRes = await fetch(idUploadTarget, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/pdf',
        },
        body: mergedPdfBlob,
      });

      if (!uploadRes.ok) {
        throw new Error('Upload to storage failed');
      }

      // 4. Confirm immediately (Counter Pay) or open Pre-Request UPI Payment Step
      await finalizeOrPromptPayment(initRes);
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

            {/* Price & Payment Status Badge */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 text-slate-900 font-black text-lg">
                <span className="text-xs font-semibold text-slate-500">Total:</span>
                <span>₹{activeJob.estimatedPrice}</span>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-extrabold border ${
                  activeJob.paymentMethod === 'UPI_PAID'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {activeJob.paymentMethod === 'UPI_PAID' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t.paidUpiBadge}</span>
                  </>
                ) : (
                  <>
                    <Banknote className="w-3.5 h-3.5" />
                    <span>{t.payCounterBadge}</span>
                  </>
                )}
              </span>
            </div>

            {/* Print Approval Live Voice Banner */}
            {(isPrinting || isCompleted) && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-sky-50 border border-emerald-200 flex items-center justify-between gap-2 text-left">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 animate-bounce">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-extrabold text-emerald-900 leading-snug">
                    {t.printingVoiceBanner}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => notifyCustomerPrintApproved(lang, activeJob.tokenNumber, 'PRINTING')}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-emerald-200 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 shrink-0"
                  title="Replay voice"
                >
                  🔊
                </button>
              </div>
            )}

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

            {/* Upload another */}
            <div className="pt-1">
              <button
                onClick={() => {
                  setActiveJob(null);
                  setSelectedFile(null);
                  setNormalRawFile(null);
                  setNormalPreviewUrl(null);
                  setNormalEditorState(undefined);
                  setFrontImage(null);
                  setFrontRawFile(null);
                  setFrontPreview(null);
                  setFrontEditorState(undefined);
                  setBackImage(null);
                  setBackRawFile(null);
                  setBackPreview(null);
                  setBackEditorState(undefined);
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
            <div>
              <input
                id="normal-print-file"
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                    e.target.value = '';
                  }
                }}
                className="sr-only"
              />

              {selectedFile ? (
                <div className="border-2 border-blue-500 bg-white rounded-3xl p-4 shadow-xs space-y-3">
                  {normalPreviewUrl ? (
                    <div className="relative bg-slate-100 rounded-2xl p-2 flex items-center justify-center border border-slate-200 overflow-hidden">
                      <img
                        src={normalPreviewUrl}
                        alt="Document preview"
                        className="max-h-52 w-auto object-contain rounded-xl shadow-xs"
                      />
                      <span className="absolute top-2.5 right-2.5 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-sm">
                        {normalEditorState ? t.editedReady : t.rawReady}
                      </span>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}

                  <div className="text-center space-y-0.5">
                    <p className="text-sm font-bold text-slate-900 truncate max-w-[280px] mx-auto">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs font-semibold text-blue-700">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {pageCount} {t.pagesDetected}
                    </p>
                  </div>

                  <div className={`grid ${normalRawFile ? 'grid-cols-2' : 'grid-cols-1'} gap-2 pt-1`}>
                    {normalRawFile && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditorSession({
                            target: 'normal',
                            file: normalRawFile,
                            mode: 'normal',
                            initialState: normalEditorState,
                            isReEdit: true,
                          })
                        }
                        className="py-2.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <Crop className="w-3.5 h-3.5" />
                        <span>{t.cropEnhance}</span>
                      </button>
                    )}
                    <label
                      htmlFor="normal-print-file"
                      className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{t.replaceFile}</span>
                    </label>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="normal-print-file"
                  className="w-full border-2 border-dashed border-slate-300 hover:border-blue-400 bg-white rounded-3xl p-6 text-center transition block cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900">{t.uploadLabel}</p>
                    <p className="text-xs text-slate-500">{t.uploadSub}</p>
                  </div>
                </label>
              )}
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
                    <div className="text-sm font-black text-slate-900 mt-0.5">
                      {hasTieredExtraRate(shop.bwRate, shop.bwExtraRate) ? (
                        <>
                          ₹{shop.bwRate} <span className="text-[11px] font-bold text-slate-500">1st</span>
                          <span className="block text-[11px] font-bold text-blue-700">
                            ₹{shop.bwExtraRate}/pg after
                          </span>
                        </>
                      ) : (
                        <>₹{shop.bwRate}/pg</>
                      )}
                    </div>
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
                    <div className="text-sm font-black text-amber-700 mt-0.5">
                      {hasTieredExtraRate(shop.colorRate, shop.colorExtraRate) ? (
                        <>
                          ₹{shop.colorRate} <span className="text-[11px] font-bold text-slate-500">1st</span>
                          <span className="block text-[11px] font-bold text-amber-800">
                            ₹{shop.colorExtraRate}/pg after
                          </span>
                        </>
                      ) : (
                        <>₹{shop.colorRate}/pg</>
                      )}
                    </div>
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
              <div className="space-y-1.5">
                <input
                  id="id-front-file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFrontImage(e.target.files[0]);
                      e.target.value = '';
                    }
                  }}
                  className="sr-only"
                />
                <label
                  htmlFor="id-front-file"
                  className={`border-2 border-dashed rounded-2xl p-2 text-center aspect-[4/3] flex flex-col items-center justify-center transition overflow-hidden cursor-pointer ${
                    frontPreview
                      ? 'border-teal-500 bg-white'
                      : 'border-slate-300 hover:border-teal-400 bg-white p-4'
                  }`}
                >
                  {frontPreview ? (
                    <img
                      src={frontPreview}
                      alt="Front Side"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <>
                      <Camera className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs font-bold text-slate-800">{t.frontSide}</span>
                      <span className="text-[10px] text-slate-400">{t.tapToCapture}</span>
                    </>
                  )}
                </label>
                {frontPreview && frontRawFile && (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setEditorSession({
                          target: 'front',
                          file: frontRawFile,
                          mode: 'id_card',
                          initialState: frontEditorState,
                          isReEdit: true,
                        })
                      }
                      className="flex-1 py-1.5 px-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[11px] font-bold flex items-center justify-center gap-1 transition"
                    >
                      <Crop className="w-3 h-3" />
                      <span>{t.cropEnhance}</span>
                    </button>
                    <label
                      htmlFor="id-front-file"
                      className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-bold flex items-center justify-center transition cursor-pointer"
                      title={t.replaceFile}
                    >
                      <RefreshCw className="w-3 h-3" />
                    </label>
                  </div>
                )}
              </div>

              {/* Back Box */}
              <div className="space-y-1.5">
                <input
                  id="id-back-file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleBackImage(e.target.files[0]);
                      e.target.value = '';
                    }
                  }}
                  className="sr-only"
                />
                <label
                  htmlFor="id-back-file"
                  className={`border-2 border-dashed rounded-2xl p-2 text-center aspect-[4/3] flex flex-col items-center justify-center transition overflow-hidden cursor-pointer ${
                    backPreview
                      ? 'border-teal-500 bg-white'
                      : 'border-slate-300 hover:border-teal-400 bg-white p-4'
                  }`}
                >
                  {backPreview ? (
                    <img
                      src={backPreview}
                      alt="Back Side"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <>
                      <Camera className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs font-bold text-slate-800">{t.backSide}</span>
                      <span className="text-[10px] text-slate-400">{t.tapToCapture}</span>
                    </>
                  )}
                </label>
                {backPreview && backRawFile && (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setEditorSession({
                          target: 'back',
                          file: backRawFile,
                          mode: 'id_card',
                          initialState: backEditorState,
                          isReEdit: true,
                        })
                      }
                      className="flex-1 py-1.5 px-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[11px] font-bold flex items-center justify-center gap-1 transition"
                    >
                      <Crop className="w-3 h-3" />
                      <span>{t.cropEnhance}</span>
                    </button>
                    <label
                      htmlFor="id-back-file"
                      className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-bold flex items-center justify-center transition cursor-pointer"
                      title={t.replaceFile}
                    >
                      <RefreshCw className="w-3 h-3" />
                    </label>
                  </div>
                )}
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

        {/* Pre-Request Payment Method Selector (Shown before sending request to counter) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-2.5 shadow-sm">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            {t.payOptionTitle}
          </span>
          <div className={`grid ${hasOnlineUpi ? 'grid-cols-2' : 'grid-cols-1'} gap-2.5`}>
            <button
              type="button"
              onClick={() => setPaymentChoice('COUNTER')}
              className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 ${
                paymentChoice === 'COUNTER' || !hasOnlineUpi
                  ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Banknote className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-900 leading-tight">
                  {t.payCounterTitle}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                  {t.payCounterSub}
                </p>
              </div>
            </button>

            {hasOnlineUpi && (
              <button
                type="button"
                onClick={() => setPaymentChoice('UPI')}
                className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 ${
                  paymentChoice === 'UPI'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-slate-900 leading-tight">
                    {t.payUpiNowTitle}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                    {t.payUpiNowSub}
                  </p>
                </div>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              {t.estTotal}
            </span>
            <span className="text-2xl font-black text-slate-950 tabular-nums leading-none">
              ₹{calculateTotal()}
            </span>
            {activeTab === 'NORMAL' &&
              pageCount * copies > 1 &&
              hasTieredExtraRate(
                colorMode === 'COLOR' ? shop.colorRate : shop.bwRate,
                colorMode === 'COLOR' ? shop.colorExtraRate : shop.bwExtraRate
              ) && (
                <span className="block text-[10px] font-bold text-emerald-700 mt-0.5">
                  1×₹{colorMode === 'COLOR' ? shop.colorRate : shop.bwRate} + {pageCount * copies - 1}×₹
                  {colorMode === 'COLOR' ? shop.colorExtraRate : shop.bwExtraRate}
                </span>
              )}
          </div>

          <button
            type="button"
            disabled={
              isUploading ||
              (activeTab === 'NORMAL' && !selectedFile) ||
              (activeTab === 'ID_CARD' && (!frontImage || !backImage))
            }
            onClick={activeTab === 'NORMAL' ? handleNormalSubmit : handleIdCardSubmit}
            className={`flex-1 py-3.5 px-4 disabled:opacity-40 text-white font-extrabold rounded-2xl shadow-md flex items-center justify-center gap-2 text-sm transition ${
              paymentChoice === 'UPI' && hasOnlineUpi
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25'
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="truncate">{uploadProgress || 'Uploading...'}</span>
              </>
            ) : (
              <>
                <span>
                  {paymentChoice === 'UPI' && hasOnlineUpi ? t.payAndSend : t.sendToCounter}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </footer>

      {/* Pre-Request UPI Payment Modal (Only notifies shopkeeper after payment confirmation!) */}
      {pendingUpiConfirm && (
        <div className="fixed inset-0 z-[65] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 text-center relative animate-in fade-in zoom-in-95">
            <button
              type="button"
              disabled={confirmingUpi}
              onClick={() => setPendingUpiConfirm(null)}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Token #{pendingUpiConfirm.tokenNumber} Ready
              </span>
              <h3 className="text-lg font-black text-slate-950 mt-2">
                {lang === 'en' ? `Pay ₹${pendingUpiConfirm.amount} via UPI` : `UPI से ₹${pendingUpiConfirm.amount} पेमेंट करें`}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {shop.shopName}
                {shop.upiId && (
                  <>
                    {' '}
                    • <span className="font-mono text-slate-700">{shop.upiId}</span>
                  </>
                )}
              </p>
            </div>

            {pendingUpiConfirm.upiLink && pendingUpiConfirm.customQrUrl && (
              <div className="bg-slate-100 p-1 rounded-xl grid grid-cols-2 gap-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setShowOriginalCustomQr(false)}
                  className={`py-1.5 rounded-lg transition ${
                    !showOriginalCustomQr ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  {lang === 'en' ? 'Exact-Amount QR' : 'ऑटो-अमाउंट QR'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowOriginalCustomQr(true)}
                  className={`py-1.5 rounded-lg transition ${
                    showOriginalCustomQr ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  {lang === 'en' ? 'Shop Custom QR' : 'शॉप कस्टम QR'}
                </button>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 inline-block mx-auto">
              <img
                src={
                  showOriginalCustomQr && pendingUpiConfirm.customQrUrl
                    ? pendingUpiConfirm.customQrUrl
                    : pendingUpiConfirm.upiQrDataUrl
                }
                alt="Shop UPI QR"
                className="w-44 h-44 mx-auto rounded-lg object-contain bg-white"
              />
              <p className="text-[10px] font-semibold text-slate-500 mt-1.5">
                {showOriginalCustomQr
                  ? lang === 'en'
                    ? `Scan with any UPI app and enter ₹${pendingUpiConfirm.amount}`
                    : `किसी भी UPI ऐप से स्कैन करके ₹${pendingUpiConfirm.amount} भेजें`
                  : lang === 'en'
                  ? 'Scan with any UPI app or tap button below'
                  : 'किसी भी UPI ऐप से स्कैन करें या नीचे बटन दबाएँ'}
              </p>
            </div>

            <div className="space-y-2">
              {pendingUpiConfirm.upiLink && (
                <a
                  href={pendingUpiConfirm.upiLink}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>{lang === 'en' ? `Open GPay / PhonePe (₹${pendingUpiConfirm.amount})` : `GPay / PhonePe खोलें (₹${pendingUpiConfirm.amount})`}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
              )}

              <button
                type="button"
                disabled={confirmingUpi}
                onClick={() => handleUpiConfirmChoice('UPI_PAID')}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition disabled:opacity-50"
              >
                {confirmingUpi ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{lang === 'en' ? 'Sending Request...' : 'रिक्वेस्ट भेज रहे हैं...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{lang === 'en' ? 'Payment Done — Send Print Request ✓' : 'पेमेंट हो गई — प्रिंट रिक्वेस्ट भेजें ✓'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={confirmingUpi}
                onClick={() => handleUpiConfirmChoice('COUNTER')}
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
              >
                {lang === 'en' ? 'Unable to pay online? Pay at Counter →' : 'ऑनलाइन नहीं हुआ? काउंटर पर कैश दें →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-Browser Document / Image Editor Modal (Option 1 + Option 2) */}
      {editorSession && (
        <DocumentEditorModal
          file={editorSession.file}
          mode={editorSession.mode}
          lang={lang}
          initialState={editorSession.initialState}
          onCancel={() => setEditorSession(null)}
          onSkip={editorSession.isReEdit ? undefined : handleEditorSkip}
          onApply={handleEditorApply}
        />
      )}
    </div>
  );
};
