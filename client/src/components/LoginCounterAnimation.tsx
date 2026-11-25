import React, { useState, useEffect } from 'react';
import {
  Printer,
  Volume2,
  ShieldCheck,
  CheckCircle2,
  ScanLine,
  Sparkles,
  IndianRupee,
  Trash2,
  Lock,
  FileText,
} from 'lucide-react';

const STAGES = [
  {
    id: 0,
    badge: 'Live Queue + Hindi Voice',
    token: '#104',
    title: 'Instant Counter Sync',
    subtitle: 'Customer scan karte hi voice alert ke saath live print queue me file aati hai.',
  },
  {
    id: 1,
    badge: 'Auto-Align + Direct UPI',
    token: '#105',
    title: 'Smart Crop & Pre-Paid UPI',
    subtitle: 'ID cards aur documents auto-straighten hokar direct shop UPI verify ke saath aate hain.',
  },
  {
    id: 2,
    badge: 'Zero-Storage Privacy',
    token: '#106',
    title: '1-Click Print & Wipe',
    subtitle: 'Print approve hote hi temporary buffer auto-delete — 0 KB server par bachta hai.',
  },
] as const;

export const LoginCounterAnimation: React.FC = () => {
  const [stage, setStage] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStage((prev) => (prev + 1) % STAGES.length);
    }, 3400);
    return () => clearInterval(timer);
  }, []);

  const current = STAGES[stage];

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-gradient-to-br from-slate-950 via-[#0f172a] to-[#08222a] text-white p-6 lg:p-8 overflow-hidden select-none">
      {/* Drifting Mesh Aura Blobs */}
      <div className="pointer-events-none absolute -top-20 -left-16 w-64 h-64 rounded-full bg-indigo-500/25 blur-3xl lca-blob-a" />
      <div className="pointer-events-none absolute -bottom-20 -right-12 w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl lca-blob-b" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(rgba(148,163,184,0.45) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Top Brand Telemetry Header */}
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-[11px] font-bold text-slate-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SMART COUNTER • LIVE</span>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-[11px] font-mono font-bold text-indigo-200">
            <span>Token</span>
            <span className="text-emerald-300 transition-all duration-300">{current.token}</span>
          </div>
        </div>

        <div>
          <h3 className="text-2xl lg:text-[28px] font-black tracking-tight leading-[1.12]">
            Fast. Private.{' '}
            <span className="bg-gradient-to-r from-cyan-300 via-emerald-300 to-indigo-300 bg-clip-text text-transparent">
              Zero-Storage.
            </span>
          </h3>
          <p className="mt-1.5 text-xs text-slate-300/80 leading-relaxed">
            India&apos;s smart photocopy counter dashboard — real-time queue, Hindi voice alerts & instant privacy wipe.
          </p>
        </div>
      </div>

      {/* Center Animated Stage Console */}
      <div className="relative z-10 my-5 rounded-2xl bg-slate-900/85 border border-slate-700/70 shadow-2xl shadow-black/40 p-4 backdrop-blur-md">
        {/* Mini Console Chrome */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
            <span className="ml-2 text-[10px] font-mono text-slate-400">{current.badge}</span>
          </div>
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
        </div>

        {/* Dynamic Scene Viewport */}
        <div className="relative h-44 flex items-center justify-center overflow-hidden rounded-xl bg-slate-950/75 border border-slate-800/80 px-3">
          {/* SCENE 0: Encrypted Queue Arrival + Hindi Voice Wave */}
          {stage === 0 && (
            <div key="scene-0" className="w-full space-y-3 lca-scene-enter">
              {/* Animated incoming queue packet */}
              <div className="flex items-center justify-between bg-gradient-to-r from-indigo-950/90 to-slate-900 border border-indigo-500/40 rounded-xl p-2.5 shadow-lg">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0 relative">
                    <FileText className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 lca-ping-dot" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-white truncate">
                      #104 • Aadhaar_Scan.pdf
                    </p>
                    <p className="text-[10px] text-cyan-300 font-semibold">
                      1 Sheet • Color Merge • Encrypted
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30 shrink-0">
                  NEW
                </span>
              </div>

              {/* Voice Synthesizer Equalizer Strip */}
              <div className="flex items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                    <Volume2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-bold text-amber-200 truncate">
                    &ldquo;प्रिंट रिक्वेस्ट आ गई!&rdquo;
                  </span>
                </div>

                {/* Live Equalizer Bars */}
                <div className="flex items-end gap-1 h-5 shrink-0" aria-hidden="true">
                  <span className="w-1 bg-cyan-400 rounded-full lca-eq-1" />
                  <span className="w-1 bg-indigo-400 rounded-full lca-eq-2" />
                  <span className="w-1 bg-emerald-400 rounded-full lca-eq-3" />
                  <span className="w-1 bg-amber-400 rounded-full lca-eq-2" />
                  <span className="w-1 bg-cyan-400 rounded-full lca-eq-4" />
                </div>
              </div>
            </div>
          )}

          {/* SCENE 1: Smart A4 Auto-Align & Instant UPI Verified */}
          {stage === 1 && (
            <div key="scene-1" className="w-full flex items-center justify-between gap-3 lca-scene-enter px-1">
              {/* Animated Calibrating Document Sheet */}
              <div className="relative w-28 h-36 rounded-lg bg-white text-slate-800 p-2 shadow-xl flex flex-col justify-between shrink-0 lca-doc-straighten">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                    A4 FIT
                  </span>
                  <ScanLine className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-9 rounded border border-indigo-200 bg-indigo-50/70 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-indigo-700">FRONT CARD</span>
                  </div>
                  <div className="h-9 rounded border border-teal-200 bg-teal-50/70 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-teal-700">BACK CARD</span>
                  </div>
                </div>
                {/* Animated Laser Calibration Scan Bar */}
                <div className="pointer-events-none absolute left-1 right-1 h-0.5 bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 shadow-[0_0_8px_#34d399] lca-crop-scan" />
              </div>

              {/* Right Side Pre-Paid UPI Verification Card */}
              <div className="flex-1 space-y-2 min-w-0">
                <div className="rounded-xl bg-emerald-950/70 border border-emerald-500/40 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                      <IndianRupee className="w-3 h-3" /> UPI VERIFIED
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 lca-pop-check" />
                  </div>
                  <p className="text-lg font-black text-white leading-none tabular-nums">₹15 Paid</p>
                  <p className="text-[10px] text-emerald-200/75 truncate">
                    Zero Commission • Direct Bank
                  </p>
                </div>

                {/* Progress Bar Sweep */}
                <div className="rounded-lg bg-slate-900 border border-slate-800 p-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-300 mb-1">
                    <span>Auto-Enhance</span>
                    <span className="text-cyan-300">Ready</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full lca-fill-width" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCENE 2: 1-Click Print Output + Zero-Storage Privacy Shred */}
          {stage === 2 && (
            <div key="scene-2" className="w-full space-y-3 lca-scene-enter">
              <div className="flex items-center justify-between gap-3">
                {/* Animated Output Printer Graphic */}
                <div className="relative w-24 h-24 flex flex-col items-center justify-end shrink-0">
                  {/* Emerging Crisp Printed Sheet */}
                  <div className="w-14 h-12 bg-white rounded-t-md border border-slate-200 shadow-md flex flex-col items-center justify-center p-1 mb-[-6px] z-0 lca-paper-eject">
                    <div className="w-full h-1 bg-indigo-500/40 rounded mb-1" />
                    <div className="w-4/5 h-1 bg-slate-300 rounded mb-1" />
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  {/* Printer Body */}
                  <div className="relative z-10 w-20 h-11 rounded-xl bg-gradient-to-b from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-between px-2.5 shadow-lg">
                    <Printer className="w-4 h-4 text-cyan-300" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                </div>

                {/* Right Privacy Buffer Wipe Status */}
                <div className="flex-1 rounded-xl bg-slate-900/95 border border-cyan-500/35 p-3 space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-cyan-300 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Zero-Storage Rule
                    </span>
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Temp Buffer</span>
                      <span className="font-mono font-bold text-emerald-300">0 KB • WIPED ✓</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 lca-shred-clear" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Customer documents purged right after print completion.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Active Stage Caption */}
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
              <span>{current.title}</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{current.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Bottom Interactive Stage Selector Pills */}
      <div className="relative z-10 space-y-3">
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 0, label: '1. Alert' },
            { id: 1, label: '2. Align' },
            { id: 2, label: '3. Wipe' },
          ].map((item) => {
            const active = stage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setStage(item.id)}
                className={`relative overflow-hidden py-1.5 px-2 rounded-lg text-[11px] font-bold border transition text-center ${
                  active
                    ? 'bg-indigo-600/30 border-cyan-400/60 text-white shadow-xs'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{item.label}</span>
                {active && (
                  <span
                    key={`prog-${stage}`}
                    className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-emerald-400 lca-stage-bar"
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-0.5">
          <span>🔒 End-to-End Encrypted Counter</span>
          <span className="text-emerald-400/90 font-semibold">printcart.in</span>
        </div>
      </div>

      {/* Bespoke Smooth CSS Keyframes for Login Console Animation */}
      <style>{`
        @keyframes lcaBlobFloatA {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(22px, 16px) scale(1.1); }
        }
        @keyframes lcaBlobFloatB {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, -18px) scale(1.12); }
        }
        .lca-blob-a { animation: lcaBlobFloatA 8s ease-in-out infinite; }
        .lca-blob-b { animation: lcaBlobFloatB 9s ease-in-out infinite; }

        @keyframes lcaSceneEnter {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .lca-scene-enter { animation: lcaSceneEnter 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes lcaEqPulse {
          0%, 100% { height: 4px; }
          50% { height: 18px; }
        }
        .lca-eq-1 { animation: lcaEqPulse 0.65s ease-in-out infinite; }
        .lca-eq-2 { animation: lcaEqPulse 0.52s ease-in-out infinite 0.12s; }
        .lca-eq-3 { animation: lcaEqPulse 0.72s ease-in-out infinite 0.24s; }
        .lca-eq-4 { animation: lcaEqPulse 0.58s ease-in-out infinite 0.18s; }

        @keyframes lcaPingDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.45); opacity: 0.55; }
        }
        .lca-ping-dot { animation: lcaPingDot 1.3s ease-in-out infinite; }

        @keyframes lcaDocStraighten {
          0% { transform: rotate(-6deg) scale(0.95); }
          45%, 100% { transform: rotate(0deg) scale(1); }
        }
        .lca-doc-straighten { animation: lcaDocStraighten 2.4s cubic-bezier(0.22, 1, 0.36, 1) infinite alternate; }

        @keyframes lcaCropScan {
          0% { top: 10%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 88%; opacity: 0; }
        }
        .lca-crop-scan { animation: lcaCropScan 1.9s ease-in-out infinite; }

        @keyframes lcaFillWidth {
          from { width: 20%; }
          to { width: 100%; }
        }
        .lca-fill-width { animation: lcaFillWidth 1.2s ease-out forwards; }

        @keyframes lcaPopCheck {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .lca-pop-check { animation: lcaPopCheck 0.5s ease-out 0.2s both; }

        @keyframes lcaPaperEject {
          0% { transform: translateY(16px); opacity: 0.4; }
          60%, 100% { transform: translateY(-4px); opacity: 1; }
        }
        .lca-paper-eject { animation: lcaPaperEject 1.8s ease-out infinite alternate; }

        @keyframes lcaShredClear {
          0% { width: 100%; opacity: 1; }
          65% { width: 12%; opacity: 0.8; }
          100% { width: 0%; opacity: 0.3; }
        }
        .lca-shred-clear { animation: lcaShredClear 2.4s ease-in-out infinite; }

        @keyframes lcaStageBar {
          from { width: 0%; }
          to { width: 100%; }
        }
        .lca-stage-bar { animation: lcaStageBar 3.4s linear forwards; }

        @media (prefers-reduced-motion: reduce) {
          .lca-blob-a, .lca-blob-b, .lca-eq-1, .lca-eq-2, .lca-eq-3, .lca-eq-4,
          .lca-doc-straighten, .lca-crop-scan, .lca-paper-eject, .lca-shred-clear {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};
