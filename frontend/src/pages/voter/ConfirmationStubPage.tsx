// src/pages/voter/ConfirmationStubPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export default function ConfirmationStubPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 px-4 py-12 text-center">
      <div className="w-full max-w-md bg-white shadow-xl rounded-xl p-8 md:p-10 space-y-6">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold text-gray-800">Vote Confirmed!</h1>
        <p className="text-gray-600">
          Thank you for participating. Your vote has been successfully recorded (stubbed).
        </p>
        <p className="text-sm text-gray-500 mt-4">
          Your session has been cleared for security.
        </p>
        <div className="mt-8 space-y-4">
          <Link to="/voter-id-entry">
            <Button className="w-full py-3 text-lg bg-indigo-600 hover:bg-indigo-700">
              Start New Voting Session
            </Button>
          </Link>
          <Link to="/" className="block mt-4 text-indigo-600 hover:text-indigo-800">
            Go to Welcome Page
          </Link>
        </div>
      </div>
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Secure eVoting System. All rights reserved.</p>
      </footer>
    </div>
  );
}