import React from 'react';
import { Mail, Phone, MapPin, Clock, Building, MessageSquare } from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { legalConfig } from '../../config/legal';

export const ContactPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="border-b border-slate-200 pb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-3">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>Support & Helpdesk</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950">
            Contact Us
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            We are here to assist local print shop owners and CSC Kendras across India.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Details Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Official Communication Channels
            </h2>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">Customer Support Email</span>
                  <a href={`mailto:${legalConfig.supportEmail}`} className="font-semibold text-blue-600 hover:underline">
                    {legalConfig.supportEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">Helpline & WhatsApp Support</span>
                  <span className="font-semibold text-slate-900">{legalConfig.supportPhone}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">Operating Hours</span>
                  <span className="font-semibold text-slate-900">{legalConfig.supportHours}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">Registered Operating Entity</span>
                  <span className="font-semibold text-slate-900">{legalConfig.legalEntity}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Postal / Corporate Address Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-500" />
                <span>Office Address</span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {legalConfig.businessAddress}
              </p>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <strong className="text-slate-900 block">Merchant KYC Note:</strong>
                <p>
                  Official inquiries regarding PhonePe PG integrations, compliance audits, and shop onboarding can be directed to {legalConfig.supportEmail}.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-xs text-slate-400">
              {legalConfig.domain} • Serving Indian Print Shops
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
