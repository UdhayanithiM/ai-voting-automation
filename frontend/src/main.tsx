import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Voter Screens
import App from './App'
import Login from '@/pages/Login'
import VerifyOtp from '@/pages/VerifyOtp'
import VoterDetails from '@/pages/VoterDetails'
import PreviewDetails from '@/pages/PreviewDetails'
import SelfieCapture from '@/pages/SelfieCapture'
import Confirmation from '@/pages/Confirmation'
import VotePage from '@/pages/VotePage'
import VoteStatus from '@/pages/VoteStatus'


// Admin Screens
import AdminLogin from '@/pages/admin/AdminLogin'
import AdminLayout from '@/pages/admin/AdminLayout'
import AdminDashboard from '@/pages/admin/AdminDashboard'

// Admin Protected Route
import ProtectedAdminRoute from '@/pages/admin/ProtectedAdminRoute'
import { ProtectedVoteRoute } from '@/routes/ProtectedVoteRoute'
import { ProtectedVoteStatus } from '@/routes/ProtectedVoteStatus'
// Global styles
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>

        {/* Voter Routes */}
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/voter-details" element={<VoterDetails />} />
        <Route path="/preview-details" element={<PreviewDetails />} />
        <Route path="/selfie-capture" element={<SelfieCapture />} />
        <Route path="/confirmation" element={<Confirmation />} />
        
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
          {/* You can add more nested admin routes here */}
        </Route>

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)