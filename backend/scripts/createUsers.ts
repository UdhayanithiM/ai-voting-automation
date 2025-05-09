import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { Admin } from '../src/models/Admin'
import { Officer } from '../src/models/Officer'

dotenv.config() // ✅ Load .env

async function createUsers() {
  try {
    const mongoUri = process.env.MONGO_URI
    if (!mongoUri) {
      throw new Error('❌ MONGO_URI not found in .env')
    }

    await mongoose.connect(mongoUri)

    const hashedPassword = await bcrypt.hash('password', 10)

    await Admin.deleteMany({})
    await Officer.deleteMany({})

    await Admin.create({
      email: 'admin@example.com',
      password: hashedPassword,
    })

    await Officer.create({
      email: 'officer@example.com',
      password: hashedPassword,
    })

    console.log('✅ Admin and Officer created successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Failed to create users:', error)
    process.exit(1)
  }
}

createUsers()
