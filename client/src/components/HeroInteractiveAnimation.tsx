import React, { useState, useEffect } from 'react';
import { QrCode, ShieldCheck, Printer, Lock, CheckCircle2 } from 'lucide-react';

export const HeroInteractiveAnimation: React.FC = () => {
  // Sync state for step indicator: 1 = Scan, 2 = Stream/Privacy, 3 = Print
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    // 8-second smooth cycle
    const cycle = () => {
      setActiveStep(1);
      const t2 = setTimeout(() => setActiveStep(2), 2400); // at 30%
      const t3 = setTimeout(() => setActiveStep(3), 5000); // at 62%
      return () => {
        clearTimeout(t2);
        clearTimeout(t3);
      };
    };

    const cleanup = cycle();
    const interval = setInterval(cycle, 8000);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="w-full max-w-[520px] lg:max-w-[550px] flex flex-col items-center">
      {/* ── Main Canvas (Aspect 4:3 matching /hero-image.png exactly 1800x1350) ── */}
      <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 bg-white select-none group">
        {/* Soft Ambient Pastel Glow */}
        <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-200/50 via-blue-200/35 to-emerald-200/45 rounded-3xl blur-3xl -z-10" />

        {/* Base 3D Isometric Render */}
        <img
          src="/hero-image.png"
          alt="PrintCart Smart Counter Setup"
          className="w-full h-full object-cover select-none pointer-events-none"
        />

        {/* ── SVG LAYER: Pixel-Exact 1:1 Vector Overlay (viewBox 0 0 1800 1350) ── */}
        <svg
          viewBox="0 0 1800 1350"
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Red Laser Glow Filter */}
            <filter id="redLaserGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Glowing Stream Filter */}
            <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="14" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Stream Rail Gradient */}
            <linearGradient id="streamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="45%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            {/* Red Laser Projection Fan (Phone Camera 465,540 -> Standee QR) */}
            <linearGradient id="laserFanRed" x1="465" y1="540" x2="720" y2="760" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ff0033" stopOpacity="0.75" />
              <stop offset="35%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0.08" />
            </linearGradient>

            {/* Red Laser Beam Gradient with Hot Core */}
            <linearGradient id="laserBeamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.1" />
              <stop offset="15%" stopColor="#ff0033" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="85%" stopColor="#ff0033" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
            </linearGradient>

            {/* Path definition for animateMotion */}
            <path
              id="streamMotionPath"
              d="M 387 657 C 558 378, 864 342, 1026 414 C 1152 468, 1251 567, 1305 693"
              fill="none"
            />

            {/* EXACT Standee QR ClipPath: TL(695,682) TR(815,744) BR(780,891) BL(660,829) */}
            <clipPath id="standeeQRClip">
              <polygon points="695,682 815,744 780,891 660,829" />
            </clipPath>

            {/* EXACT Phone Screen QR ClipPath: TL(359,533) TR(465,484) BR(439,617) BL(358,663) */}
            <clipPath id="phoneQRClip">
              <polygon points="359,533 465,484 439,617 358,663" />
            </clipPath>
          </defs>

          {/* ── STAGE 1: Phone-to-Standee Red Laser Projection Fan ── */}
          <polygon
            points="465,540 695,682 660,829"
            fill="url(#laserFanRed)"
            className="laser-fan-pulse"
          />

          {/* ── STAGE 1: Standee QR Laser Scanner (100% Locked Inside QR Quadrilateral) ── */}
          <g clipPath="url(#standeeQRClip)">
            {/* Ambient Ruby Laser Wash */}
            <polygon
              points="695,682 815,744 780,891 660,829"
              fill="rgba(239, 68, 68, 0.22)"
              className="laser-fill-sweep"
            />
            {/* Red Laser Sweeping Line (Top Edge 695,682 -> 815,744 translates to Bottom Edge) */}
            <g className="laser-beam-sweep">
              <line
                x1="680"
                y1="675"
                x2="830"
                y2="752"
                stroke="#ff0033"
                strokeWidth="20"
                filter="url(#redLaserGlow)"
                opacity="0.8"
              />
              <line
                x1="680"
                y1="675"
                x2="830"
                y2="752"
                stroke="url(#laserBeamGrad)"
                strokeWidth="6"
              />
            </g>
          </g>

          {/* Standee QR Reticle Border (Exact boundary hug) */}
          <polygon
            points="695,682 815,744 780,891 660,829"
            fill="none"
            stroke="#ff0033"
            strokeWidth="5"
            strokeDasharray="30 18"
            filter="url(#redLaserGlow)"
            className="laser-reticle-pulse"
          />

          {/* ── STAGE 1: Phone Screen QR Scanning Reticle ── */}
          <g clipPath="url(#phoneQRClip)">
            <polygon
              points="359,533 465,484 439,617 358,663"
              fill="rgba(239, 68, 68, 0.18)"
              className="laser-fill-sweep"
            />
            <g className="laser-beam-phone-sweep">
              <line
                x1="350"
                y1="525"
                x2="475"
                y2="475"
                stroke="#ff0033"
                strokeWidth="12"
                filter="url(#redLaserGlow)"
                opacity="0.8"
              />
              <line
                x1="350"
                y1="525"
                x2="475"
                y2="475"
                stroke="#ffffff"
                strokeWidth="3.5"
              />
            </g>
          </g>
          <polygon
            points="359,533 465,484 439,617 358,663"
            fill="none"
            stroke="#ff0033"
            strokeWidth="3.5"
            filter="url(#redLaserGlow)"
            className="laser-reticle-pulse"
          />

          {/* ── STAGE 2: Glowing Stream Rail ── */}
          <path
            d="M 387 657 C 558 378, 864 342, 1026 414 C 1152 468, 1251 567, 1305 693"
            fill="none"
            stroke="url(#streamGrad)"
            strokeWidth="8"
            strokeDasharray="20 14"
            className="animate-stream-flow opacity-90"
          />

          {/* Ambient wide glow along path */}
          <path
            d="M 387 657 C 558 378, 864 342, 1026 414 C 1152 468, 1251 567, 1305 693"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="28"
            filter="url(#softGlow)"
            className="opacity-40 animate-pulse"
          />

          {/* ── Native SVG AnimateMotion: Gliding File Packet ── */}
          <g className="traveling-file-group">
            <animateMotion
              dur="8s"
              repeatCount="indefinite"
              rotate="auto"
              keyTimes="0;0.30;0.35;0.48;0.60;0.64;1"
              keyPoints="0;0;0.05;0.52;0.98;1;1"
              calcMode="spline"
              keySplines="0.4 0 0.2 1; 0.4 0 0.2 1; 0.25 0.1 0.25 1; 0.25 0.1 0.25 1; 0.4 0 0.2 1; 0.4 0 0.2 1"
            >
              <mpath href="#streamMotionPath" />
            </animateMotion>

            <circle r="30" fill="url(#streamGrad)" opacity="0.35" filter="url(#softGlow)" />
            <circle r="18" fill="#00f0ff" opacity="0.85" />
            <circle r="9" fill="#ffffff" />
          </g>
        </svg>

        {/* Scan Success Badge (Pops right above the Standee at 2.1s) */}
        <div
          className="absolute z-30 pointer-events-none"
          style={{
            left: '41%',
            top: '46%',
            transform: 'translate(-50%, -100%)',
            animation: 'scanSuccessBadge 8s cubic-bezier(0.16, 1, 0.3, 1) infinite',
            willChange: 'transform, opacity',
          }}
        >
          <div className="bg-slate-900/95 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-full border border-red-500/80 shadow-2xl flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-red-400">QR Laser Scanned ✓</span>
          </div>
        </div>

        {/* ── STAGE 2: Flying Floating Document Card (2.4s - 4.8s) ── */}
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            animation: 'floatingDocMotion 8s cubic-bezier(0.35, 0, 0.25, 1) infinite',
            willChange: 'transform, opacity',
          }}
        >
          <div className="relative -translate-x-1/2 -translate-y-1/2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-cyan-400 to-emerald-400 p-0.5 shadow-[0_0_24px_rgba(6,182,212,0.9)] flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-white">
                <span className="text-sm">📄</span>
              </div>
            </div>
            <div className="absolute inset-0 rounded-2xl bg-cyan-400/40 animate-ping" />
          </div>
        </div>

        {/* Privacy Shield Energy Ripple at Apex (x: 57%, y: 28%) */}
        <div
          className="absolute z-20 pointer-events-none rounded-full"
          style={{
            left: '54.5%',
            top: '25%',
            width: '7%',
            height: '9%',
            animation: 'shieldFlash 8s cubic-bezier(0.16, 1, 0.3, 1) infinite',
            willChange: 'transform, opacity',
          }}
        >
          <div className="w-full h-full rounded-full border-2 border-emerald-400 shadow-[0_0_30px_#10b981] animate-ping opacity-85" />
        </div>

        {/* Floating Zero-Storage Badge at Apex */}
        <div
          className="absolute z-30 pointer-events-none"
          style={{
            left: '49%',
            top: '18%',
            animation: 'zeroStorageBadge 8s cubic-bezier(0.16, 1, 0.3, 1) infinite',
            willChange: 'transform, opacity',
          }}
        >
          <div className="bg-emerald-600 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full shadow-2xl border border-emerald-300 flex items-center gap-1.5 whitespace-nowrap">
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
            <span>Zero-Storage • 100% Encrypted</span>
          </div>
        </div>

        {/* ── STAGE 3: Printer Processing & Active Feed LED (4.8s - 5.8s) ── */}
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            left: '69%',
            top: '45%',
            animation: 'printerVibrate 8s ease-in-out infinite',
            willChange: 'transform, opacity',
          }}
        >
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/95 border border-emerald-400/80 shadow-2xl text-[11px] text-emerald-400 font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>FEEDING & PRINTING...</span>
          </div>
        </div>

        {/* ── STAGE 4: PROMINENT PAPER SLIDING OUT OF PRINTER (5.2s - 7.6s) ── */}
        <div
          className="absolute z-30 pointer-events-none"
          style={{
            left: '57%',
            top: '60%',
            width: '18.5%',
            animation: 'paperSlideOutProminent 8s cubic-bezier(0.16, 1, 0.3, 1) infinite',
            willChange: 'transform, opacity',
          }}
        >
          {/* Realistic A4 Document Sheet with shadow and clean details */}
          <div className="bg-white rounded-xl shadow-[0_20px_50px_rgba(15,23,42,0.35)] border-2 border-indigo-200/90 p-2.5 space-y-2 transform -rotate-12 backdrop-blur-xs">
            {/* Sheet Header */}
            <div className="flex items-center justify-between border-b border-indigo-100 pb-1">
              <span className="text-[9px] font-mono font-extrabold text-indigo-700 truncate max-w-[100px]">
                ID_Card_Merged.pdf
              </span>
              <span className="text-[7px] text-emerald-700 font-extrabold bg-emerald-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <CheckCircle2 className="w-2 h-2" /> Printed
              </span>
            </div>

            {/* Document Lines */}
            <div className="space-y-1">
              <div className="h-1 bg-slate-400 rounded-full w-full" />
              <div className="h-1 bg-slate-300 rounded-full w-5/6" />
              <div className="h-1 bg-slate-300 rounded-full w-4/6" />
            </div>

            {/* ID Card Front & Back Merged Preview Boxes */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <div className="h-6 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-300 rounded-lg flex flex-col items-center justify-center text-[7px] font-bold text-indigo-700 shadow-xs">
                <span>Front Side</span>
                <span className="text-[5px] text-indigo-400">Aadhaar / PAN</span>
              </div>
              <div className="h-6 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-300 rounded-lg flex flex-col items-center justify-center text-[7px] font-bold text-indigo-700 shadow-xs">
                <span>Back Side</span>
                <span className="text-[5px] text-indigo-400">A4 Centered</span>
              </div>
            </div>

            {/* PrintCart Watermark Footer */}
            <div className="pt-0.5 flex items-center justify-between text-[6px] font-mono text-slate-400 border-t border-slate-100">
              <span>PrintCart Zero-Storage</span>
              <span className="text-emerald-600 font-bold">100% Crisp 300DPI</span>
            </div>
          </div>
        </div>

        {/* Completed & Auto-Wiped Toast (5.8s - 7.6s) */}
        <div
          className="absolute z-40 pointer-events-none"
          style={{
            left: '46%',
            bottom: '8%',
            animation: 'printSuccessToast 8s cubic-bezier(0.16, 1, 0.3, 1) infinite',
            willChange: 'transform, opacity',
          }}
        >
          <div className="bg-slate-950/95 backdrop-blur-md text-white text-[12px] font-bold px-4 py-2 rounded-full shadow-2xl border border-emerald-400/90 flex items-center gap-2 whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400">Token #14 Paper Printed ✓</span>
            <span className="text-slate-400 text-[11px]">| Server Auto-Deleted</span>
          </div>
        </div>
      </div>

      {/* ── Real-Time Interactive Step Bar (Synchronized with 8s Loop) ── */}
      <div className="mt-4 w-full bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-slate-200/90 shadow-sm flex items-center justify-between gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold">
        {/* Step 1 Pill */}
        <div
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-500 ${
            activeStep === 1
              ? 'bg-red-50 text-red-800 border border-red-300 shadow-sm scale-105'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <QrCode className="w-4 h-4 text-red-600" />
          <span>1. Red Laser QR Scan</span>
        </div>

        <span className="text-slate-300">→</span>

        {/* Step 2 Pill */}
        <div
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-500 ${
            activeStep === 2
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-sm scale-105'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Lock className="w-4 h-4 text-emerald-600" />
          <span>2. Transfer</span>
        </div>

        <span className="text-slate-300">→</span>

        {/* Step 3 Pill */}
        <div
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-500 ${
            activeStep === 3
              ? 'bg-indigo-50 text-indigo-800 border border-indigo-300 shadow-sm scale-105'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Printer className="w-4 h-4 text-indigo-600" />
          <span>3. Paper Print Out</span>
        </div>
      </div>

      {/* ── Ultra-Smooth 60fps Keyframe Animations ── */}
      <style>{`
        /* Step 1: Laser Fan Pulse (Phone Camera -> Standee QR) */
        @keyframes laserFanPulse {
          0%, 3% { opacity: 0; }
          6%, 22% { opacity: 0.65; }
          26%, 100% { opacity: 0; }
        }
        .laser-fan-pulse {
          animation: laserFanPulse 8s ease-in-out infinite;
        }

        /* Step 1: Standee QR Reticle Border */
        @keyframes laserReticlePulse {
          0%, 2% { opacity: 0; }
          5%, 23% { opacity: 1; }
          26%, 100% { opacity: 0; }
        }
        .laser-reticle-pulse {
          animation: laserReticlePulse 8s ease-in-out infinite;
        }

        /* Step 1: Standee Laser Ambient Fill */
        @keyframes laserFillSweep {
          0%, 3% { opacity: 0; }
          6%, 22% { opacity: 1; }
          25%, 100% { opacity: 0; }
        }
        .laser-fill-sweep {
          animation: laserFillSweep 8s ease-in-out infinite;
        }

        /* Step 1: Standee Laser Sweeping Line (dx: -35px, dy: +147px) */
        @keyframes standeeLaserSweep {
          0%, 3% {
            transform: translate(0px, 0px);
            opacity: 0;
          }
          4% {
            transform: translate(0px, 0px);
            opacity: 1;
          }
          14% {
            transform: translate(-35px, 147px);
            opacity: 1;
          }
          21% {
            transform: translate(0px, 0px);
            opacity: 1;
          }
          24% {
            transform: translate(-35px, 147px);
            opacity: 0.85;
          }
          26%, 100% {
            transform: translate(-35px, 147px);
            opacity: 0;
          }
        }
        .laser-beam-sweep {
          animation: standeeLaserSweep 8s cubic-bezier(0.45, 0, 0.55, 1) infinite;
          will-change: transform, opacity;
        }

        /* Step 1: Phone QR Laser Sweeping Line (dy: +130px) */
        @keyframes phoneLaserSweep {
          0%, 3% { transform: translate(0px, 0px); opacity: 0; }
          5% { transform: translate(0px, 0px); opacity: 1; }
          14% { transform: translate(-1px, 130px); opacity: 1; }
          21% { transform: translate(0px, 0px); opacity: 1; }
          24% { transform: translate(-1px, 130px); opacity: 0.85; }
          26%, 100% { transform: translate(-1px, 130px); opacity: 0; }
        }
        .laser-beam-phone-sweep {
          animation: phoneLaserSweep 8s cubic-bezier(0.45, 0, 0.55, 1) infinite;
          will-change: transform, opacity;
        }

        /* Step 1: Scan Success Badge (Pops at 2.1s) */
        @keyframes scanSuccessBadge {
          0%, 18% { opacity: 0; transform: translate(-50%, -85%) scale(0.9); }
          21%, 29% { opacity: 1; transform: translate(-50%, -100%) scale(1); }
          32%, 100% { opacity: 0; transform: translate(-50%, -115%) scale(0.92); }
        }

        /* Step 2: Smooth Floating Document Along Arc (2.4s - 4.8s) */
        @keyframes floatingDocMotion {
          0%, 25% {
            left: 21%;
            top: 48%;
            opacity: 0;
            transform: translate3d(0, 0, 0) scale(0.6);
          }
          28% {
            left: 23%;
            top: 45%;
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
          36% {
            left: 41%;
            top: 31%;
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1.1);
          }
          43% {
            left: 57%;
            top: 29%;
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1.2);
          }
          52% {
            left: 71%;
            top: 47%;
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(0.95);
          }
          56%, 100% {
            left: 72%;
            top: 51%;
            opacity: 0;
            transform: translate3d(0, 0, 0) scale(0.4);
          }
        }

        .traveling-file-group {
          animation: streamPacketOpacity 8s ease-in-out infinite;
        }

        @keyframes streamPacketOpacity {
          0%, 26% { opacity: 0; }
          30%, 58% { opacity: 1; }
          62%, 100% { opacity: 0; }
        }

        @keyframes shieldFlash {
          0%, 36% { opacity: 0; transform: scale(0.85); }
          40%, 46% { opacity: 1; transform: scale(1.35); }
          50%, 100% { opacity: 0; transform: scale(1); }
        }

        @keyframes zeroStorageBadge {
          0%, 37% { opacity: 0; transform: translateY(8px) scale(0.9); }
          40%, 49% { opacity: 1; transform: translateY(0px) scale(1); }
          52%, 100% { opacity: 0; transform: translateY(-6px) scale(0.92); }
        }

        /* Step 3: Printer Vibration & Status (4.8s - 5.8s) */
        @keyframes printerVibrate {
          0%, 49% { opacity: 0; transform: translateY(6px); }
          51% { opacity: 1; transform: translateY(0px); }
          53%, 57%, 61% { opacity: 1; transform: translateY(-1px) translateX(0.8px); }
          55%, 59% { opacity: 1; transform: translateY(1px) translateX(-0.8px); }
          63% { opacity: 1; transform: translateY(0); }
          67%, 100% { opacity: 0; transform: translateY(0); }
        }

        /* Step 4: Paper Slide Out (5.2s - 7.6s) - Clearly Emerging from Printer Mouth */
        @keyframes paperSlideOutProminent {
          0%, 52% {
            opacity: 0;
            transform: translate3d(24px, -36px, 0) rotate(-14deg) scale(0.5);
          }
          56% {
            opacity: 1;
            transform: translate3d(10px, -15px, 0) rotate(-13deg) scale(0.75);
          }
          64% {
            opacity: 1;
            transform: translate3d(-14px, 20px, 0) rotate(-12deg) scale(1);
          }
          72%, 92% {
            opacity: 1;
            transform: translate3d(-20px, 30px, 0) rotate(-12deg) scale(1.04);
          }
          96%, 100% {
            opacity: 0;
            transform: translate3d(-20px, 36px, 0) rotate(-12deg) scale(0.95);
          }
        }

        @keyframes printSuccessToast {
          0%, 64% { opacity: 0; transform: translateY(12px) scale(0.9); }
          68%, 93% { opacity: 1; transform: translateY(0px) scale(1); }
          97%, 100% { opacity: 0; transform: translateY(-8px) scale(0.92); }
        }

        @keyframes stream-flow {
          0% { stroke-dashoffset: 40; }
          100% { stroke-dashoffset: 0; }
        }

        .animate-stream-flow {
          animation: stream-flow 1.2s linear infinite;
        }
      `}</style>
    </div>
  );
};
