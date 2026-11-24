import React from 'react';
import { Link } from 'react-router-dom';
import { Printer, Shield, Lock, Zap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Printer className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Print<span className="text-blue-500">Cart</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Bharat's premier QR-to-Print micro-SaaS platform for photocopy shops, cyber cafes, photo studios, and CSC / Jan Seva Kendras. Say goodbye to WhatsApp number sharing.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-slate-800 text-emerald-400 border border-emerald-500/20">
                <Lock className="w-3.5 h-3.5" />
                100% Zero-Storage Privacy
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-slate-800 text-blue-400 border border-blue-500/20">
                <Zap className="w-3.5 h-3.5" />
                Instant 15-Min TTL Cleanup
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/register" className="hover:text-white transition">
                  Shop Registration
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition">
                  Shopkeeper Login
                </Link>
              </li>
              <li>
                <Link to="/s/demo-shop" target="_blank" className="hover:text-white transition">
                  Live Customer Demo
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition">
                  Counter Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & KYC */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Trust & Legal
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/refund" className="hover:text-white transition">
                  Refund & Cancellation
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>© 2026 PrintCart (printcart.in). All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/privacy" className="hover:underline">Privacy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:underline">Terms</Link>
            <span>•</span>
            <Link to="/refund" className="hover:underline">Refunds</Link>
            <span>•</span>
            <Link to="/contact" className="hover:underline">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
