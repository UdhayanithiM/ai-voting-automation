// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import './index.css';

// --- Voter Flow Pages ---
import Welcome from '@/pages/Welcome';
import VoterIdEntryPage from '@/pages/VoterIdEntryPage';
import VerifyOtpPage from '@/pages/VerifyOtp';
import VotePage from '@/pages/VotePage';
import VoteStatusPage from '@/pages/VoteStatus';
import Confirmation from '@/pages/Confirmation';
import Feedback from '@/pages/Feedback';
import PreviewDetails from '@/pages/PreviewDetails';
import SelfieCapture from '@/pages/SelfieCapture';
import VoterDetails from '@/pages/VoterDetails';
import FaceVerificationStubPage from '@/pages/voter/FaceVerificationStubPage';
import QueueDisplayStubPage from '@/pages/voter/QueueDisplayStubPage';
import VotingPageStub from '@/pages/voter/VotingPageStub';
import ConfirmationStubPage from '@/pages/voter/ConfirmationStubPage';

// --- Admin Flow Pages ---
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import VoterTable from '@/pages/admin/VoterTable';
import ResultsLogs from '@/pages/admin/ResultsLogs';
import RegisterOfficer from '@/pages/admin/RegisterOfficer';
import ProtectedAdminRoute from '@/pages/admin/ProtectedAdminRoute';

// --- Officer Flow Pages ---
import OfficerLogin from '@/pages/OfficerLogin';
import OfficerDashboard from '@/pages/officer/OfficerDashboard';
import QueueManagement from '@/pages/officer/QueueManagement';
import ProtectedOfficerRoute from '@/pages/officer/ProtectedOfficerRoute';
import VerifyVoter from '@/pages/officer/VerifyVoter';
import OfficerReports from '@/pages/officer/OfficerReports';

// --- Voter Protected Route ---
import ProtectedVoterAuthRoute from '@/routes/ProtectedVoterAuthRoute';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* --- Public Welcome Page --- */}
        <Route path="/" element={<Welcome />} />

        {/* --- Voter Flow (MVP) --- */}
        <Route path="/voter-id-entry" element={<VoterIdEntryPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />

        <Route
          path="/face-verification-stub"
          element={
            <ProtectedVoterAuthRoute tokenType="otpTokenRequired">
              <FaceVerificationStubPage />
            </ProtectedVoterAuthRoute>
          }
        />
        <Route
          path="/queue-display-stub"
          element={
            <ProtectedVoterAuthRoute tokenType="votingTokenRequired">
              <QueueDisplayStubPage />
            </ProtectedVoterAuthRoute>
          }
        />
        <Route
          path="/voting-page-stub"
          element={
            <ProtectedVoterAuthRoute tokenType="votingTokenRequired">
              <VotingPageStub />
            </ProtectedVoterAuthRoute>
          }
        />
        <Route path="/confirmation-stub" element={<ConfirmationStubPage />} />

        <Route
          path="/vote"
          element={
            <ProtectedVoterAuthRoute>
              <VotePage />
            </ProtectedVoterAuthRoute>
          }
        />
        <Route
          path="/votestatus"
          element={
            <ProtectedVoterAuthRoute>
              <VoteStatusPage />
            </ProtectedVoterAuthRoute>
          }
        />

        {/* --- Optional Voter Pages --- */}
        <Route path="/voter-details" element={<VoterDetails />} />
        <Route path="/preview-details" element={<PreviewDetails />} />
        <Route path="/selfie-capture" element={<SelfieCapture />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="/feedback" element={<Feedback />} />

        {/* --- Officer Pages --- */}
        <Route path="/officer/login" element={<OfficerLogin />} />
        <Route
          path="/officer/dashboard"
          element={
            <ProtectedOfficerRoute>
              <OfficerDashboard />
            </ProtectedOfficerRoute>
          }
        />
        <Route
          path="/officer/verify"
          element={
            <ProtectedOfficerRoute>
              <VerifyVoter />
            </ProtectedOfficerRoute>
          }
        />
        <Route
          path="/officer/queue"
          element={
            <ProtectedOfficerRoute>
              <QueueManagement />
            </ProtectedOfficerRoute>
          }
        />
        <Route
          path="/officer/reports"
          element={
            <ProtectedOfficerRoute>
              <OfficerReports />
            </ProtectedOfficerRoute>
          }
        />

        {/* --- Admin Pages --- */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route
            path="dashboard"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="dashboard/voters"
            element={
              <ProtectedAdminRoute>
                <VoterTable />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="dashboard/results"
            element={
              <ProtectedAdminRoute>
                <ResultsLogs />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="register-officer"
            element={
              <ProtectedAdminRoute>
                <RegisterOfficer />
              </ProtectedAdminRoute>
            }
          />
        </Route>

        {/* Optional: 404 Not Found */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
