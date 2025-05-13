import dotenv from 'dotenv'
dotenv.config()

import mongoose from 'mongoose'
import { Admin } from '../models/Admin'
import bcrypt from 'bcryptjs'

if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI is not defined in .env file')
  process.exit(1)
}

const createAdmin = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGO_URI!)

    const hashedPassword = await bcrypt.hash('admin123', 10)

    const admin = new Admin({
      email: 'admin@evoting.com',
      password: hashedPassword,
    })

    await admin.save()
    console.log('✅ Admin created successfully:', admin)
  } catch (error) {
    console.error('❌ Error creating admin:', error)
  } finally {
    await mongoose.disconnect()
    process.exit()
  }
}

createAdmin()
