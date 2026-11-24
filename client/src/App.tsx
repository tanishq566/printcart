import React from 'react';
import { Routes, Route, Link, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';
import { ShopUploadPage } from './pages/ShopUploadPage';
import { DashboardPage } from './pages/DashboardPage';
import { StandeePage } from './pages/StandeePage';
import { PaymentStatusPage } from './pages/PaymentStatusPage';
import { PrivacyPolicyPage } from './pages/legal/PrivacyPolicyPage';
import { TermsPage } from './pages/legal/TermsPage';
import { RefundPage } from './pages/legal/RefundPage';
import { ContactPage } from './pages/legal/ContactPage';
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Phase 2: Public & Onboarding */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Phase 2: Settings & Admin */}
        <Route path="/dashboard/settings" element={<SettingsPage />} />
        <Route path="/admin" element={<AdminPage />} />

        {/* Phase 3: Customer Mobile Flow & ID Card Mode */}
        <Route path="/s/:shopSlug" element={<ShopUploadPage />} />

        {/* Phase 4: Shopkeeper Live Counter Dashboard */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Phase 5: QR Standee Generator */}
        <Route path="/dashboard/standee" element={<StandeePage />} />

        {/* Phase 5: PhonePe Payment Status Callback */}
        <Route path="/payment/status/:merchantOrderId" element={<PaymentStatusPage />} />

        {/* Mandatory KYC Legal Policies */}
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/refund" element={<RefundPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
    </AuthProvider>
  );
}
