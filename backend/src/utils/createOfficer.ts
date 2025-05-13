import dotenv from 'dotenv'
dotenv.config()

import mongoose from 'mongoose'
import { Officer } from '../models/Officer'
import bcrypt from 'bcryptjs'

if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI is not defined in .env file')
  process.exit(1)
}

const createOfficer = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGO_URI!)

    const hashed = await bcrypt.hash('password', 10)

    const officer = new Officer({
      officerId: 'officer123',
      name: 'Test Officer',         // ✅ Add name
      email: 'officer@test.com',    // ✅ Add email
      password: hashed,
    })

    await officer.save()
    console.log('✅ Officer created successfully:', officer)
  } catch (error) {
    console.error('❌ Error creating officer:', error)
  } finally {
    await mongoose.disconnect()
    process.exit()
  }
}

createOfficer()
