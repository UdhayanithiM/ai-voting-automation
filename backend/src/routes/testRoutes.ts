// In your backend, create a temporary route to reset password
// server/routes/testRoutes.ts
import express from 'express';
import bcrypt from 'bcryptjs';
import { Officer } from '../models/Officer';

const router = express.Router();

// TEMPORARY ROUTE FOR DEVELOPMENT ONLY - REMOVE IN PRODUCTION
router.post('/reset-officer-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    const officer = await Officer.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { new: true }
    );
    
    if (!officer) {
      return res.status(404).json({ message: 'Officer not found' });
    }
    
    res.json({ 
      message: 'Password reset successful',
      officer: {
        email: officer.email,
        name: officer.name
      }
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
})
// Add to your testRoutes.ts
router.post('/create-test-officer', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const officer = await Officer.create({
      name,
      email,
      password: hashedPassword
    });
    
    res.status(201).json({
      message: 'Test officer created',
      officer: {
        id: officer._id,
        name: officer.name,
        email: officer.email
      }
    });
  } catch (error) {
    console.error('Create officer error:', error);
    res.status(500).json({ message: 'Error creating officer' });
  }
});

export default router;