// frontend/src/pages/admin/AdminLayout.tsx
import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/store/useAdminAuth';
// shallow import is removed as we will select primitives/stable functions directly

// Example Icons (using simple text/emojis, consider a library like lucide-react)
const DashboardIcon = () => <span role="img" aria-label="Dashboard" className="text-lg">📊</span>;
const VotersIcon = () => <span role="img" aria-label="Voters" className="text-lg">👥</span>;
const CreateVoterIcon = () => <span role="img" aria-label="Create Voter" className="text-lg">➕</span>;
const RegisterOfficerIcon = () => <span role="img" aria-label="Register Officer" className="text-lg">🧑‍🔧</span>;
const LogsIcon = () => <span role="img" aria-label="Logs" className="text-lg">📄</span>;
const LogoutIcon = () => <span role="img" aria-label="Logout" className="text-lg">🚪</span>;
const EvotingLogo = () => <span role="img" aria-label="eVoting System Logo" className="text-2xl mr-2">🗳️</span>;


// cn utility function (if not globally available from your project's @/lib/utils)
function cn(...classes: (string | undefined | null | false | 0)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // ** CORRECTED ZUSTAND SELECTORS **
  // Select primitive parts of the admin state and the logout function separately.
  // This avoids creating new object references in the selector and sidesteps issues with `shallow` if TS has arity problems.
  const adminEmail = useAdminAuth(state => state.admin?.email);
  const logout = useAdminAuth(state => state.logout);
  // If other specific parts of 'admin' object were needed, select them too:
  // const adminId = useAdminAuth(state => state.admin?.id);
  // const adminRole = useAdminAuth(state => state.admin?.role);

  const handleLogout = () => {
    logout();
    navigate('/admin/login', {replace: true}); 
  };

  const getNavLinkClass = ({ isActive }: { isActive: boolean }): string =>
    cn(
      "flex items-center space-x-3 rounded-md px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ease-in-out group",
      isActive
        ? 'bg-sky-700 text-white shadow-md scale-105' 
        : 'text-sky-100 hover:bg-sky-700/80 hover:text-white hover:shadow-sm'
    );
  
  const adminDisplayName = adminEmail?.split('@')[0] || 'Admin';
  const adminEmailInitial = adminEmail ? adminEmail.charAt(0).toUpperCase() : 'A';

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.endsWith('/admin/dashboard')) return 'Dashboard Overview';
    if (path.includes('/dashboard/voters')) return 'Manage Voter Records';
    if (path.includes('/dashboard/create-voter')) return 'Create New Voter Record';
    if (path.includes('/register-officer')) return 'Register Polling Officer';
    if (path.includes('/dashboard/results')) return 'Voting Logs & Results';
    return 'Admin Panel';
  };


  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-sky-800 to-sky-900 text-white p-5 flex flex-col shadow-2xl fixed h-full z-20">
        <div className="mb-8 text-left border-b border-sky-700 pb-5">
            <div className="flex items-center space-x-2.5 mb-4">
                <EvotingLogo />
                <h1 className="text-xl font-bold text-white tracking-tight">eVoting Admin</h1>
            </div>
            <div className="flex items-center space-x-3 mt-5">
                <div className="w-11 h-11 rounded-full bg-sky-600 flex items-center justify-center text-lg font-semibold text-white ring-2 ring-sky-400/70 shadow-md">
                    {adminEmailInitial}
                </div>
                <div>
                    <h2 className="text-sm font-semibold text-white truncate max-w-[150px]" title={adminEmail || 'Admin User'}>
                      {adminDisplayName}
                    </h2>
                    <p className="text-xs text-sky-300">Administrator</p>
                </div>
            </div>
        </div>

        <nav className="space-y-1.5 flex-1 overflow-y-auto pr-1 custom-scrollbar"> {/* Added custom-scrollbar if you define one */}
          <NavLink to="/admin/dashboard" className={getNavLinkClass} end>
            <DashboardIcon /> <span>Dashboard</span>
          </NavLink>
          <NavLink to="/admin/dashboard/voters" className={getNavLinkClass}>
            <VotersIcon /> <span>Manage Voters</span>
          </NavLink>
          <NavLink to="/admin/dashboard/create-voter" className={getNavLinkClass}>
            <CreateVoterIcon /> <span>Create New Voter</span>
          </NavLink>
          <NavLink to="/admin/register-officer" className={getNavLinkClass}>
            <RegisterOfficerIcon /> <span>Register Officer</span>
          </NavLink>
          <NavLink to="/admin/dashboard/results" className={getNavLinkClass}>
            <LogsIcon /> <span>Voting Logs</span>
          </NavLink>
        </nav>

        <button
          onClick={handleLogout}
          className="mt-8 w-full flex items-center justify-center space-x-2.5 text-sm bg-sky-700/80 px-4 py-3 rounded-lg hover:bg-red-600 hover:text-white transition-colors duration-200 font-medium shadow hover:shadow-md"
        >
          <LogoutIcon /> <span>Logout</span>
        </button>
      </aside>

      {/* Main content area */}
      <div className="flex-1 pl-72"> {/* Adjust pl- to match sidebar width */}
         <header className="bg-white shadow-sm p-5 sticky top-0 z-10 border-b border-slate-200">
             <h1 className="text-xl font-semibold text-slate-800">{getPageTitle()}</h1>
        </header>
        <main className="p-6 md:p-8 bg-slate-100 min-h-[calc(100vh-73px)]"> {/* Adjust min-h based on header height (5rem or 80px for p-5 on header) */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}