// utils/createOfficer.ts
import mongoose from 'mongoose'
import { Officer } from '../models/Officer'
import bcrypt from 'bcryptjs'

const createOfficer = async () => {
  await mongoose.connect(process.env.MONGO_URI!)

  const hashed = await bcrypt.hash('password', 10)
  const officer = new Officer({
    officerId: 'officer123',
    password: hashed,
  })

  await officer.save()
  console.log('Officer created:', officer)
  process.exit()
}

createOfficer()
