import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Global Styles
import './index.css'

// Voter Screens
import Welcome from '@/pages/Welcome'
import Login from '@/pages/Login'
import VerifyOtp from '@/pages/VerifyOtp'
import VoterDetails from '@/pages/VoterDetails'
import PreviewDetails from '@/pages/PreviewDetails'
import SelfieCapture from '@/pages/SelfieCapture'
import Confirmation from '@/pages/Confirmation'
import VotePage from '@/pages/VotePage'
import VoteStatus from '@/pages/VoteStatus'
import Feedback from '@/pages/Feedback'

// Admin Screens
import AdminLogin from '@/pages/admin/AdminLogin'
import AdminLayout from '@/pages/admin/AdminLayout'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import VoterTable from '@/pages/admin/VoterTable'
import ResultsLogs from '@/pages/admin/ResultsLogs'
import RegisterOfficer from '@/pages/admin/RegisterOfficer'
import ProtectedAdminRoute from '@/pages/admin/ProtectedAdminRoute'

// Officer Screens
import OfficerLogin from '@/pages/OfficerLogin'
import OfficerDashboard from '@/pages/officer/OfficerDashboard'
import QueueManagement from '@/pages/officer/QueueManagement'
import ProtectedOfficerRoute from '@/pages/officer/ProtectedOfficerRoute'
import VerifyVoter from '@/pages/officer/VerifyVoter'
import OfficerReports from '@/pages/officer/OfficerReports'

// Protected Routes (Voter)
import { ProtectedVoteRoute } from '@/routes/ProtectedVoteRoute'
import { ProtectedVoteStatus } from '@/routes/ProtectedVoteStatus'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Voter Routes */}
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/voter-details" element={<VoterDetails />} />
        <Route path="/preview-details" element={<PreviewDetails />} />
        <Route path="/selfie-capture" element={<SelfieCapture />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route
          path="/vote"
          element={
            <ProtectedVoteRoute>
              <VotePage />
            </ProtectedVoteRoute>
          }
        />
        <Route
          path="/votestatus"
          element={
            <ProtectedVoteStatus>
              <VoteStatus />
            </ProtectedVoteStatus>
          }
        />

        {/* Officer Routes */}
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

        {/* Admin Routes */}
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
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
