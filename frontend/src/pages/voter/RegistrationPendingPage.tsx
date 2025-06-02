// frontend/src/pages/voter/RegistrationPendingPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export default function RegistrationPendingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-100 via-teal-50 to-cyan-100 px-4 py-12 text-center">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 md:p-10 space-y-6 border border-slate-200">
        <div className="text-7xl mb-4">⏳</div>
        <h1 className="text-3xl font-bold text-slate-800">Registration Submitted!</h1>
        <p className="text-slate-600 text-base">
          Thank you for registering. Your application has been successfully submitted
          and is now **pending review by an administrator**.
        </p>
        <p className="text-sm text-slate-500 mt-2">
          You will typically be notified via your registered contact details once your registration status is updated.
        </p>
        <div className="mt-10">
          <Link to="/">
            <Button className="w-full py-3 text-lg bg-sky-600 hover:bg-sky-700 text-white">
              Return to Welcome Page
            </Button>
          </Link>
        </div>
      </div>
      <footer className="mt-10 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Secure eVoting System. All rights reserved.</p>
      </footer>
    </div>
  );
}