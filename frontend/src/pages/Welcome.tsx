// frontend/src/pages/Welcome.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.svg';
import { Button } from '@/components/ui/Button';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-sky-100 to-cyan-100 p-6 selection:bg-sky-200">
      <div className="w-full max-w-md text-center">
        <header className="mb-10 animate-fadeInUp">
          <img
            src={logo}
            alt="eVoting System Logo"
            className="h-20 w-auto mx-auto mb-6 drop-shadow-lg"
          />
          <h1 className="text-4xl font-bold text-sky-700 sm:text-5xl">
            Welcome to Secure eVoting
          </h1>
          <p className="text-slate-600 mt-4 text-lg leading-relaxed">
            Your voice, your vote. Simplified and secured for a modern democracy.
          </p>
        </header>

        <main className="bg-white shadow-2xl rounded-xl p-8 space-y-6 border border-slate-200 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-1.5">For Voters</h2>
            <p className="text-sm text-gray-500 mb-5">
              Access the portal to cast your vote or register if you're a new voter.
            </p>
            <Button
              className="w-full py-3.5 text-base font-medium bg-sky-600 hover:bg-sky-700 focus:ring-sky-500 text-white shadow-md hover:shadow-lg transition-all"
              onClick={() => navigate('/voter-id-entry')}
            >
              Voter Login (To Vote)
            </Button>
            <Button
              variant="outline"
              className="w-full py-3.5 text-base font-medium mt-3 border-sky-500 text-sky-600 hover:bg-sky-50 focus:ring-sky-500 shadow-sm hover:shadow-md transition-all"
              onClick={() => navigate('/self-registration/details')}
            >
              New Voter Registration
            </Button>
          </div>

          <hr className="my-8 border-slate-200" />

          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-1.5">For Officials</h2>
            <p className="text-sm text-gray-500 mb-5">
              Access respective dashboards for election management and operations.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="w-full py-3 text-sm font-medium border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400 focus:ring-slate-400 shadow-sm hover:shadow-md transition-all"
                onClick={() => navigate('/officer/login')}
              >
                Officer Login
              </Button>
              <Button
                variant="outline"
                className="w-full py-3 text-sm font-medium border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400 focus:ring-slate-400 shadow-sm hover:shadow-md transition-all"
                onClick={() => navigate('/admin/login')}
              >
                Admin Login
              </Button>
            </div>
          </div>
        </main>

        <footer className="mt-12 text-center text-sm text-slate-500 animate-fadeIn" style={{ animationDelay: '0.6s' }}>
          <p>&copy; {new Date().getFullYear()} Secure eVoting System. All rights reserved.</p>
          <p className="mt-1">Ensuring fair and accessible elections for everyone.</p>
        </footer>
      </div>
      {/* The <style jsx global> block has been removed from here. */}
    </div>
  );
}