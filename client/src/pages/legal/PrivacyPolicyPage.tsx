import React from 'react';
import { ShieldCheck, Lock, Trash2, Clock } from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { legalConfig } from '../../config/legal';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="border-b border-slate-200 pb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Zero-Storage Architecture</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Last Updated: {legalConfig.lastUpdated} • {legalConfig.domain}
          </p>
        </div>

        {/* Highlights banner */}
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 space-y-2">
          <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Our Core Commitment to Indian Citizens & Shop Customers</span>
          </h3>
          <p className="text-xs text-emerald-900 leading-relaxed">
            {legalConfig.brandName} is built on a <strong>Strict Zero-Storage Privacy Policy</strong>. Customer documents (Aadhaar, PAN, marksheets, admit cards, personal photographs) are <strong>never permanently retained</strong> on our servers. Files are automatically and permanently deleted immediately upon printing or rejection.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 text-sm text-slate-700 leading-relaxed shadow-xs">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">1. Information We Collect</h2>
            <p>
              <strong>For Shopkeepers:</strong> We collect shop name, owner phone number, city, shop slug, and optional shop UPI ID for routing customer payments.
            </p>
            <p>
              <strong>For Customers (Print Uploaders):</strong> Customers do NOT create accounts or log in. We only collect ephemeral file data (MIME type, size, page count) and an optional walk-in name needed to identify the print job at the counter.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">2. Ephemeral Storage & Immediate Auto-Deletion</h2>
            <p>
              Files uploaded by customers are stored in temporary, presigned cloud storage buffers strictly for the duration needed by the shopkeeper to print:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><strong>Upon Print or Reject:</strong> The file is permanently and irreversibly deleted from our servers via S3 object deletion commands within 1 second.</li>
              <li><strong>15-Minute TTL Fallback:</strong> If a job remains unprinted or abandoned, an automated server cron job deletes the file after 15 minutes.</li>
              <li><strong>Zero Permanent Copies:</strong> We do not maintain backups, copies, or secondary caches of customer files.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">3. Payment Information</h2>
            <p>
              All payments for shopkeeper subscriptions (such as the ₹499 Launch Pass) are processed directly by RBI-licensed payment gateways including <strong>PhonePe</strong>. {legalConfig.brandName} does not store credit/debit card numbers or UPI MPINs.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">4. Contact Grievance Officer</h2>
            <p className="text-xs text-slate-600">
              For any privacy inquiries or grievance redressal, please contact:
              <br />
              <strong>{legalConfig.legalEntity}</strong>
              <br />
              Email: <a href={`mailto:${legalConfig.supportEmail}`} className="text-blue-600 underline">{legalConfig.supportEmail}</a>
              <br />
              Address: {legalConfig.businessAddress}
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};
