import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode,
  Printer,
  ShieldCheck,
  Zap,
  Smartphone,
  CreditCard,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Volume2,
  Trash2,
  Layers,
  Clock,
  ChevronDown,
  UploadCloud,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ScrollReveal } from '../components/ScrollReveal';
import { HeroInteractiveAnimation } from '../components/HeroInteractiveAnimation';

/* ─── RotatingSlogan ─────────────────────────────────────────────── */
interface RotatingSloganProps {
  texts: string[];
  className?: string;
}

const RotatingSlogan: React.FC<RotatingSloganProps> = ({ texts, className = '' }) => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % texts.length);
        setVisible(true);
      }, 350);
    }, 3000);
    return () => clearInterval(interval);
  }, [texts.length]);

  return (
    <span
      className={`inline-block transition-all duration-350 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
      } ${className}`}
      style={{ transition: 'opacity 0.35s ease, transform 0.35s ease' }}
    >
      {texts[index]}
    </span>
  );
};

/* ─── Main Landing Page ───────────────────────────────────────────── */
const ROTATING_SLOGANS = [
  'Print Straight to Counter',
  'Auto ID Card A4 Merge',
  '100% Zero-Storage Privacy',
];

const FEATURES = [
  {
    icon: <Layers className="w-6 h-6" />,
    gradient: 'from-indigo-500 to-blue-500',
    title: 'Auto ID Card Front+Back A4 Merger',
    desc: 'Customer Aadhaar ya PAN card ki dono side ki photo lega, aur PrintCart use automatically single A4 portrait sheet par center-align karke ready-to-print bana dega.',
  },
  {
    icon: <Volume2 className="w-6 h-6" />,
    gradient: 'from-blue-500 to-cyan-500',
    title: 'Real-Time Web Audio Beep Alerts',
    desc: 'Counter par baithe shopkeeper ko bar-bar tab check karne ki zaroorat nahi. Jaise hi customer file bhejega, dashboard me loud chime bajegi.',
  },
  {
    icon: <Trash2 className="w-6 h-6" />,
    gradient: 'from-emerald-500 to-teal-500',
    title: 'Strict 15-Minute TTL Auto-Cleanup',
    desc: 'Print hone par turant delete, aur agar koi customer upload karke chala gaya toh 15 minute ke andar server cron job sabhi files wipe kar deta hai.',
  },
  {
    icon: <QrCode className="w-6 h-6" />,
    gradient: 'from-amber-500 to-orange-500',
    title: 'Printable A4 QR Standee Generator',
    desc: '1-click me apni dukan ke naam aur UPI ke sath high-res A4/A5 PDF standee download karein aur laminate karke counter par lagayein.',
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    gradient: 'from-purple-500 to-indigo-500',
    title: 'Instant UPI Payment Deep-Link',
    desc: 'Aapka UPI ID configure hote hi customer status screen par exact bill amount ka UPI Pay button dikhega jo seedha aapke account me jayega.',
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    gradient: 'from-slate-700 to-slate-900',
    title: 'Bilingual Support (Hindi + English)',
    desc: 'Customer upload screen me 1-tap Hindi/English switch hai, jisse gaon aur sheher ke sabhi log asani se documents print kar sakein.',
  },
];

const PRICING_FEATURES = [
  'Branded Shop URL (printcart.in/s/your-shop)',
  'Auto ID Card Front+Back A4 Merger',
  '100% Zero-Storage & Instant Auto-Delete',
  'Real-Time Live Counter Dashboard (Chrome PWA)',
  'Audio Beep Notification Chime on new uploads',
  'Download Ready-to-Print A4 QR Standee PDF',
  'Integrated UPI Payment button for customers',
  '3-Day Free Trial included upfront',
];

export const LandingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Kya iske liye computer me koi software ya driver install karna padega?',
      a: 'Nahi! PrintCart 100% web aur PWA-based hai. Aap apne kisi bhi computer, laptop ya tablet ke Google Chrome browser me direct chala sakte hain. Kisi .exe ya desktop software ki zaroorat nahi hai.',
    },
    {
      q: 'Aadhaar / PAN card documents ki privacy kaise safe rehti hai?',
      a: 'Hamara strict Zero-Storage Privacy rule hai. Jaise hi aap dukan par "Approve & Print" ya "Reject" button dabate hain, document server se turant permanently delete ho jata hai. Agar koi customer print nahi karwata, toh 15-minute TTL cron job use automatically wipe out kar deta hai.',
    },
    {
      q: 'ID Card Front & Back mode kaise kaam karta hai?',
      a: 'Customer apne phone camera se Aadhaar ya PAN card ke aage aur peeche ki photo leta hai. Hamara system browser ke andar hi dono photos ko ek single A4 sheet par center align karke clean PDF bana deta hai — dukan wale ko Photoshop ya Paint me crop karne ki bilkul zaroorat nahi!',
    },
    {
      q: 'Customer se paise kaise milenge?',
      a: 'Aap Settings me apna Shop UPI ID (jaise GPay, PhonePe, Paytm) daal sakte hain. Jab customer document upload karega, toh screen par estimated bill aur 1-tap UPI deep-link button dikhega jo seedha aapke bank account me payment transfer karega.',
    },
    {
      q: '₹499 Launch Offer ke baad koi monthly fee hai?',
      a: 'Nahi! Yeh hamara limited-time Launch Offer hai — sirf ₹499 me full lifetime access milta hai. Sath hi har nayi dukan ke liye 3 din ka full-featured Free Trial turant shuru ho jata hai.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBFD] text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden font-sans">
      <Navbar />

      {/* ── HERO SECTION ────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24 border-b border-slate-200/80">
        {/* Soft Warm Pastel Radial Glows */}
        <div
          className="absolute inset-0 pointer-events-none -z-10"
          style={{
            background: `
              radial-gradient(ellipse 50% 45% at 20% 25%, rgba(99, 102, 241, 0.08) 0%, transparent 60%),
              radial-gradient(ellipse 45% 40% at 80% 30%, rgba(59, 130, 246, 0.08) 0%, transparent 60%),
              radial-gradient(ellipse 40% 35% at 50% 85%, rgba(16, 185, 129, 0.06) 0%, transparent 60%)
            `,
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column Copy */}
            <ScrollReveal direction="up" delay={50} className="lg:col-span-6 xl:col-span-6 space-y-6 text-center lg:text-left">
              {/* Privacy Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-slate-100 text-xs sm:text-sm font-semibold shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>🔒 PRIVACY BY DESIGN • Files permanently deleted right after print</span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-[#0F172A] leading-[1.12]">
                From Customer's Phone
                <span className="block mt-2 min-h-[1.25em]">
                  <RotatingSlogan
                    texts={ROTATING_SLOGANS}
                    className="bg-gradient-to-r from-indigo-600 via-blue-600 to-emerald-500 bg-clip-text text-transparent"
                  />
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                No WhatsApp • No Pendrive • No Number Sharing — Sirf ₹499 Launch Offer.
                Customer scan karega, instant upload karega aur aapke counter par 1-click print!
              </p>

              {/* Compact 4-Icon Mini Flow Row */}
              <div className="flex items-center justify-center lg:justify-start gap-1 sm:gap-2 text-xs font-bold text-slate-700 pt-1 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 shadow-xs">
                  <QrCode className="w-4 h-4 text-indigo-600" />
                  <span>Scan QR</span>
                </div>
                <span className="text-slate-400">→</span>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 shadow-xs">
                  <UploadCloud className="w-4 h-4 text-blue-600" />
                  <span>Upload File</span>
                </div>
                <span className="text-slate-400">→</span>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 shadow-xs">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Pay UPI</span>
                </div>
                <span className="text-slate-400">→</span>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 shadow-xs">
                  <Printer className="w-4 h-4 text-purple-600" />
                  <span>1-Click Print</span>
                </div>
              </div>

              {/* Primary & Secondary CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-3">
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition hover:-translate-y-0.5"
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 60%, #059669 100%)',
                  }}
                >
                  <span>Start 3-Day Free Trial</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/s/demo-shop"
                  target="_blank"
                  className="w-full sm:w-auto px-6 py-4 text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs flex items-center justify-center gap-2 transition"
                >
                  <Smartphone className="w-5 h-5 text-indigo-600" />
                  <span>Test Live Demo</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>

              <p className="text-xs text-slate-500 font-medium">
                No credit card required • 2-minute instant shop setup • Free Ready-to-print A4 Standee
              </p>
            </ScrollReveal>

            {/* Right Column Interactive Animated Sequence */}
            <ScrollReveal direction="scale" delay={150} className="lg:col-span-6 xl:col-span-6 w-full flex justify-center">
              <HeroInteractiveAnimation />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── 4-STEP WALKTHROUGH ──────────────────────────────────── */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              Super Simple Workflow
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 mt-3">
              Customer se Counter tak 4 Aasan Steps
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: 1,
                title: 'Scan Counter QR',
                desc: 'Customer counter par laga QR code scan karega. Zero app install, zero registration.',
                color: 'from-indigo-600 to-blue-600',
              },
              {
                step: 2,
                title: 'Upload or ID Merge',
                desc: 'PDF document upload kare ya Aadhaar/PAN ki front+back photo le. Auto A4 page calculation.',
                color: 'from-blue-600 to-cyan-600',
              },
              {
                step: 3,
                title: '1-Click Approve & Print',
                desc: 'Shopkeeper dashboard par audio chime bajegi. Preview dekhe aur 1-click me direct print kare.',
                color: 'from-emerald-600 to-teal-600',
              },
              {
                step: 4,
                title: 'Instant Auto-Delete',
                desc: 'Print hote hi document Cloudflare R2 se permanently delete. Customer ko privacy confirmation.',
                color: 'from-rose-600 to-pink-600',
              },
            ].map(({ step, title, desc, color }, idx) => (
              <ScrollReveal key={step} direction="up" delay={idx * 100}>
                <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/90 hover:bg-white hover:shadow-lg transition-all space-y-3 group h-full">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} text-white font-extrabold flex items-center justify-center text-base shadow-sm`}
                  >
                    {step}
                  </div>
                  <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition">{title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON: WHATSAPP VS PRINTCART ───────────────────── */}
      <section className="py-16 bg-[#FAFBFD] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950">
              Photocopy Dukan par{' '}
              <span className="bg-gradient-to-r from-rose-600 to-red-500 bg-clip-text text-transparent">
                WhatsApp kyu fail hai?
              </span>
            </h2>
            <p className="mt-3 text-slate-600 text-base">
              Har roz 50+ anjaan logo ko apna personal WhatsApp number dena band karein.
            </p>
          </ScrollReveal>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Old WhatsApp Way */}
            <ScrollReveal direction="left" delay={100}>
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-red-200 shadow-sm space-y-4 h-full">
                <div className="flex items-center gap-2 text-red-700 font-bold text-lg">
                  <XCircle className="w-6 h-6 text-red-500" />
                  <span>Purana WhatsApp Tareeka</span>
                </div>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✗</span>
                    <span>Customer aapka personal number save karta hai. Spam calls aur status leaks.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✗</span>
                    <span>Chat me customer ke sensitive documents hamesha pade rehte hain — Privacy Risk!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✗</span>
                    <span>Aadhaar front aur back alag-alag aate hain. Photoshop/Paint me cut-paste me 5 min waste.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✗</span>
                    <span>Bheed me pata nahi chalta kisne kab bheja, kitne print hue aur kitne paise bante hain.</span>
                  </li>
                </ul>
              </div>
            </ScrollReveal>

            {/* Modern PrintCart Way */}
            <ScrollReveal direction="right" delay={150}>
              <div
                className="relative p-6 sm:p-8 rounded-2xl bg-white space-y-4 h-full shadow-xl"
                style={{
                  background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #10b981, #0d9488) border-box',
                  border: '2px solid transparent',
                  boxShadow: '0 12px 40px rgba(16, 185, 129, 0.12)',
                }}
              >
                <div className="absolute -top-3.5 right-6">
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-[11px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                    ⚡ 10X FAST & PROFESSIONAL
                  </span>
                </div>
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-lg">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <span>Naya PrintCart Tareeka</span>
                </div>
                <ul className="space-y-3 text-sm text-slate-800 font-medium">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><strong>Zero Number Sharing:</strong> Customer sirf counter standee QR scan karta hai.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><strong>100% Zero-Storage:</strong> Print ya Reject hote hi file server se turant wipe out.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><strong>Auto ID Card A4 Merger:</strong> Front aur Back snap kare, system khud A4 par set karega!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><strong>Live Counter Queue:</strong> Token number, auto price calculation, aur Web Audio chime.</span>
                  </li>
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ───────────────────────────────────────── */}
      <section id="features" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              Power Packed Features
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 mt-3">
              Har Photocopy & Cyber Cafe ke liye Zaruri Suvidhaayein
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <ScrollReveal key={i} direction="up" delay={i * 80}>
                <div className="bg-[#FAFBFD] p-7 rounded-2xl border border-slate-200 shadow-xs space-y-3 group hover:-translate-y-1.5 hover:shadow-xl hover:bg-white transition-all duration-200 h-full">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} text-white flex items-center justify-center shadow-md`}
                  >
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition">{f.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING SECTION ─────────────────────────────────────── */}
      <section id="pricing" className="py-20 bg-[#FAFBFD] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Limited Time Launch Deal
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 mt-3">
              Sirf{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-emerald-500 bg-clip-text text-transparent">
                ₹499
              </span>{' '}
              me Apni Dukan ko Digital Banayein
            </h2>
            <p className="mt-3 text-slate-600 text-base">
              Pehle 3 din poori suvidha bilkul FREE istemal karein. Pasand aaye toh sirf ₹499 me lifetime activate karein.
            </p>
          </ScrollReveal>

          <ScrollReveal direction="scale" delay={150}>
            <div className="max-w-lg mx-auto relative">
              {/* Premium Gradient Border Card */}
              <div
                className="rounded-3xl p-0.5 shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #2563eb, #10b981)' }}
              >
                <div className="bg-white rounded-[22px] p-8 sm:p-10 relative">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md">
                      Special Launch Offer
                    </span>
                  </div>

                  <div className="text-center space-y-2 pt-2">
                    <h3 className="text-2xl font-bold text-slate-900">PrintCart Lifetime Pass</h3>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <span className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-indigo-600 via-blue-600 to-emerald-500 bg-clip-text text-transparent">
                        ₹499
                      </span>
                      <div className="text-left">
                        <span className="text-sm line-through text-slate-400 block font-semibold">₹1,999</span>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Save 75%</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">One-time payment • No monthly hidden fees</p>
                  </div>

                  <div className="mt-8 space-y-3.5 border-t border-slate-100 pt-6">
                    {PRICING_FEATURES.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-sm text-slate-700">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8">
                    <Link
                      to="/register"
                      className="w-full py-4 px-6 text-white font-bold text-base rounded-xl flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 60%, #10b981 100%)',
                        boxShadow: '0 8px 30px rgba(79, 70, 229, 0.35)',
                      }}
                    >
                      <span>Start 3-Day Free Trial Now</span>
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                    <p className="text-center text-xs text-slate-400 mt-3">Account creation takes only 2 minutes</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── FAQ ACCORDION ───────────────────────────────────────── */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950">
              Aksar Pooche Jaane Wale Sawal (FAQ)
            </h2>
          </ScrollReveal>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <ScrollReveal key={idx} direction="up" delay={idx * 50}>
                <div className="bg-[#FAFBFD] rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full px-6 py-4 text-left font-bold text-slate-900 flex items-center justify-between gap-4 hover:bg-slate-50 transition"
                  >
                    <span className="text-base">{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform shrink-0 ${
                        openFaq === idx ? 'rotate-180 text-indigo-600' : ''
                      }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="px-6 pb-4 pt-1 text-sm text-slate-600 border-t border-slate-100 bg-white leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA BANNER ────────────────────────────────────── */}
      <section
        className="py-16 text-white text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #312e81 0%, #1e40af 50%, #065f46 100%)' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 relative z-10">
          <h2 className="text-2xl sm:text-4xl font-extrabold">
            Apni Dukan ko Aaj hi Modern & Private Banayein
          </h2>
          <p className="text-indigo-100 text-sm sm:text-base max-w-2xl mx-auto">
            3-Day Free Trial ke sath turant shuru karein. Koi software install nahi, seedha Google Chrome me chalega.
          </p>
          <div className="pt-2">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-900 hover:bg-slate-50 font-extrabold rounded-xl shadow-xl transition hover:-translate-y-0.5"
            >
              <span>Start Free Trial Now</span>
              <ArrowRight className="w-5 h-5 text-indigo-600" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
