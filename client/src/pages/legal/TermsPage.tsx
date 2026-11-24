import React from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { legalConfig } from '../../config/legal';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="border-b border-slate-200 pb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-3">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Service Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950">
            Terms & Conditions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Last Updated: {legalConfig.lastUpdated} • {legalConfig.domain}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 text-sm text-slate-700 leading-relaxed shadow-xs">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">1. Acceptance of Terms</h2>
            <p>
              By registering as a shopkeeper, accessing our dashboard, or using the QR customer upload portals on <strong>{legalConfig.domain}</strong>, you agree to comply with and be bound by these Terms and Conditions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">2. Service Description & Free Trial</h2>
            <p>
              {legalConfig.brandName} provides multi-tenant QR-to-print SaaS enabling photocopy shops, cyber cafes, and CSC kendras to receive digital documents from walk-in customers without sharing WhatsApp phone numbers.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><strong>3-Day Free Trial:</strong> Every newly registered shop receives full, unrestricted access to the Counter Dashboard, ID card merger, and Standee generator for 3 calendar days.</li>
              <li><strong>₹499 Launch Pass:</strong> Shopkeepers can upgrade to the permanent Launch Offer via PhonePe Payment Gateway.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">3. Shopkeeper Responsibilities</h2>
            <p>
              Shopkeepers are responsible for safeguarding their login credentials and ensuring printed physical copies are handed over exclusively to the authorized customer.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">4. Prohibited Content</h2>
            <p>
              Users are strictly prohibited from uploading fraudulent identification, counterfeit currency documents, hate speech, or content infringing intellectual property rights. We reserve the right to suspend any shop involved in malicious activity.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">5. Limitation of Liability</h2>
            <p>
              {legalConfig.brandName} is not responsible for physical printer hardware malfunctions, ink quality, or offline shopkeeper disputes.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};
