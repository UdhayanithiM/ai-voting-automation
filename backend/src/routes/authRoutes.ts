import express from 'express'
import { loginAdmin } from '../controllers/authController'

const router = express.Router()

router.post('/admin/login', loginAdmin)
router.post('/officer/login', loginAdmin) // For officer login, you can create a separate controller if needed

export default router
