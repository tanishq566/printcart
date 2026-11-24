import React from 'react';
import { RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { legalConfig } from '../../config/legal';

export const RefundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="border-b border-slate-200 pb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-3">
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span>Customer Satisfaction</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950">
            Refund & Cancellation Policy
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Last Updated: {legalConfig.lastUpdated} • {legalConfig.domain}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 text-sm text-slate-700 leading-relaxed shadow-xs">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">1. Digital SaaS Service Policy</h2>
            <p>
              {legalConfig.brandName} is a cloud software service. To ensure full confidence, we provide a <strong>3-Day Full-Featured Free Trial</strong> with zero payment upfront so every print shop can thoroughly test all counter features prior to purchasing the ₹499 Launch Pass.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">2. Refund Eligibility (7-Day Guarantee)</h2>
            <p>
              We honor refund requests within <strong>7 calendar days</strong> of paying the ₹499 Launch Pass under the following conditions:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><strong>Duplicate Transaction:</strong> You were billed twice due to a network or payment gateway timeout.</li>
              <li><strong>Unresolved Technical Failure:</strong> If our platform fails to deliver core service (QR customer uploads or counter preview) and our technical team is unable to resolve the issue within 48 business hours.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">3. Non-Refundable Cases</h2>
            <p className="text-xs">
              Refunds are not granted in cases of shopkeeper change of mind after extensive operational usage, local printer hardware incompatibility, or account suspension resulting from Terms violation.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">4. Refund Processing Timelines</h2>
            <p>
              Approved refunds are credited back to the original source payment method (Bank Account / UPI / Card via PhonePe) within <strong>5 to 7 business days</strong> as per banking network standards.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">5. How to Initiate a Refund Request</h2>
            <p className="text-xs">
              Email our support desk at <a href={`mailto:${legalConfig.supportEmail}`} className="text-blue-600 underline font-bold">{legalConfig.supportEmail}</a> with your registered shop phone number and transaction Order ID.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};
