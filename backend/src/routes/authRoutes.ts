import express from 'express'
import { loginAdmin, loginOfficer } from '../controllers/authController'

const router = express.Router()

// Admin login route
router.post('/admin/login', loginAdmin)

// Officer login route
router.post('/officer/login', loginOfficer)

export default router
