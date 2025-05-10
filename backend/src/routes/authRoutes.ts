import express from 'express'
import {
  loginAdmin,
  loginOfficer,
  sendOtp,
  verifyOtpCode
} from '../controllers/authController'

const router = express.Router()

router.post('/admin/login', loginAdmin)
router.post('/officer/login', loginOfficer)
router.post('/voter/send-otp', sendOtp)
router.post('/voter/verify-otp', verifyOtpCode)

export default router
