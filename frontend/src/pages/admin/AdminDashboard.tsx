// frontend/src/pages/admin/AdminDashboard.tsx
import React from 'react';
import useSWR from 'swr';
import { useNavigate, Navigate } from 'react-router-dom';
import API from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { useAdminAuth, useAdminHasHydrated } from '@/store/useAdminAuth'; // Removed useAdminUser, will select email directly
import { AxiosError } from 'axios';
import { shallow } from 'zustand/shallow'; // ** IMPORT shallow if selecting multiple parts of admin user **

// Example Icons (using emojis for simplicity, consider a library like lucide-react)
const UserGroupIcon = () => <span role="img" aria-label="Total Voters" className="text-2xl">👥</span>;
const BriefcaseIcon = () => <span role="img" aria-label="Total Officers" className="text-2xl">🧑‍💼</span>;
const ClipboardCheckIcon = () => <span role="img" aria-label="Total Votes Cast" className="text-2xl">🗳️</span>;
const ClockIcon = () => <span role="img" aria-label="Pending Approvals" className="text-2xl">⏳</span>;

const UserPlusIcon = () => <span role="img" aria-label="Create Voter" className="text-xl">👤<sub className='text-xs'>+</sub></span>;
const ManageVotersIcon = () => <span role="img" aria-label="Manage Voters" className="text-xl">📋</span>;
const RegisterOfficerIcon = () => <span role="img" aria-label="Register Officer" className="text-xl">🧑‍🔧</span>;
const ViewLogsIcon = () => <span role="img" aria-label="View Logs" className="text-xl">📄</span>;


interface AdminStatsData {
  totalVoters?: number;
  totalOfficers?: number;
  totalVotes?: number;
  pendingApprovals?: number;
}

interface BackendErrorResponseData {
  message?: string;
  error?: string;
  success?: boolean;
}

const swrFetcher = (url: string) => API.get(url).then(res => res.data);

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  const token = useAdminAuth(state => state.token);
  // ** SELECT admin email directly, or use shallow if selecting the whole admin object **
  const adminEmail = useAdminAuth(state => state.admin?.email); 
  const hasHydrated = useAdminHasHydrated();

  const { 
    data, 
    error: swrError,
    isLoading: isSwrLoading,
    isValidating,
  } = useSWR<AdminStatsData, AxiosError<BackendErrorResponseData>>(
    hasHydrated && token ? '/admin/stats' : null,
    swrFetcher,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: true,
      onError: (err, key) => {
        console.error(`SWR Error for key "${key}":`, err.response?.data || err.message);
      }
    }
  );

  if (!hasHydrated) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-theme(space.24))] p-4 text-center">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg text-slate-600">Loading authentication state...</p>
      </div>
    );
  }

  if (!token && hasHydrated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (swrError) {
    const errorMessage = swrError.response?.data?.message || swrError.message || "Could not load dashboard data.";
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(space.24))] p-6 text-center">
            <div className="bg-white p-8 sm:p-10 rounded-xl shadow-2xl max-w-lg w-full border border-red-200">
                <div className="text-6xl mb-5 text-red-500">😟</div>
                <h1 className="text-2xl font-bold text-red-700 mb-4">Dashboard Error</h1>
                <p className="text-slate-700 bg-red-50 p-3.5 rounded-lg mb-6 text-sm border border-red-200">
                   {errorMessage}
                </p>
                 <p className="text-xs text-slate-500 mb-6">
                    This might be due to a server issue or network problem. If your session expired, you might need to log in again.
                 </p>
                <Button
                    onClick={() => {
                        useAdminAuth.getState().logout();
                        navigate('/admin/login', { replace: true });
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white py-2.5 text-base"
                >
                    Logout and Try Again
                </Button>
            </div>
        </div>
    );
  }
  
  const isLoadingDisplay = (isSwrLoading || isValidating) && !data;


  const StatCard: React.FC<{ title: string; value: number | string | undefined; icon: React.ReactNode; colorClasses: string; isLoading?: boolean }> = 
    ({ title, value, icon, colorClasses, isLoading }) => (
    <div className={`bg-white shadow-lg rounded-2xl p-5 md:p-6 transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1 ${isLoading ? 'opacity-60 cursor-default' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm sm:text-base font-semibold text-slate-600">{title}</h2>
        <div className={`p-2.5 rounded-full bg-opacity-10 ${colorClasses.split(' ')[0].replace('text-', 'bg-')} ${colorClasses}`}>
          {icon}
        </div>
      </div>
      {isLoading ? (
        <div className="h-10 w-2/3 bg-slate-200 animate-pulse rounded-md mt-1.5"></div>
      ) : (
        <p className={`text-3xl sm:text-4xl font-bold ${colorClasses}`}>{value ?? <span className="text-slate-400">N/A</span>}</p>
      )}
    </div>
  );

  const QuickActionButton: React.FC<{ to: string; children: React.ReactNode; icon?: React.ReactNode; className?: string }> = 
    ({ to, children, icon, className }) => (
    <Button 
      onClick={() => navigate(to)}
      variant="outline" 
      className={`w-full justify-start text-left py-3.5 px-5 text-base font-medium rounded-lg
                  text-slate-700 bg-slate-50 hover:bg-sky-100 hover:text-sky-700
                  transition-all duration-200 ease-in-out border border-slate-300 hover:border-sky-400 
                  focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 
                  disabled:opacity-70 group ${className}`} // Added group for potential icon styling on hover
    >
      {icon && <span className="mr-3 text-xl text-sky-600 transition-colors duration-200 group-hover:text-sky-700">{icon}</span>}
      {children}
    </Button>
  );

  return (
    <div className="flex flex-col gap-6 md:gap-8 selection:bg-sky-100">
      <header className="pb-5 border-b border-slate-200 flex flex-wrap justify-between items-center gap-4">
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Admin Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">
                Welcome back, <span className="font-medium text-sky-600">{adminEmail || 'Admin'}</span>.
            </p>
        </div>
        <Button 
          onClick={() => { useAdminAuth.getState().logout(); navigate('/admin/login', {replace: true});}} 
          variant="outline" 
          size="default"
          className="border-slate-300 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
        >
            Logout
        </Button>
      </header>

      <section aria-labelledby="statistics-title">
        <h2 id="statistics-title" className="sr-only">Key Statistics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          <StatCard title="Total Voters" value={data?.totalVoters} icon={<UserGroupIcon />} colorClasses="text-sky-600" isLoading={isLoadingDisplay} />
          <StatCard title="Total Officers" value={data?.totalOfficers} icon={<BriefcaseIcon />} colorClasses="text-emerald-600" isLoading={isLoadingDisplay} />
          <StatCard title="Total Votes Cast" value={data?.totalVotes} icon={<ClipboardCheckIcon />} colorClasses="text-amber-600" isLoading={isLoadingDisplay} />
          <StatCard title="Pending Approvals" value={data?.pendingApprovals} icon={<ClockIcon />} colorClasses="text-orange-500" isLoading={isLoadingDisplay} />
        </div>
        {!isLoadingDisplay && !data && token && !swrError && (
           <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 rounded-md shadow">
               <p className="font-semibold">Data Note:</p>
               <p>Dashboard statistics are currently unavailable or returned no data. This might be a temporary issue.</p>
           </div>
       )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <section aria-labelledby="quick-actions-heading" className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200">
            <h3 id="quick-actions-heading" className="text-xl sm:text-2xl font-semibold text-slate-800 mb-6 border-b border-slate-200 pb-4">
              Management Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <QuickActionButton to="/admin/dashboard/create-voter" icon={<UserPlusIcon />}>
                    Create New Voter
                </QuickActionButton>
                <QuickActionButton to="/admin/dashboard/voters" icon={<ManageVotersIcon />}>
                    Manage Voters & Approvals
                </QuickActionButton>
                <QuickActionButton to="/admin/register-officer" icon={<RegisterOfficerIcon />}>
                    Register New Officer
                </QuickActionButton>
                <QuickActionButton to="/admin/dashboard/results" icon={<ViewLogsIcon />}>
                    View Voting Logs
                </QuickActionButton>
            </div>
        </section>
        
        <aside aria-labelledby="system-status-heading" className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200">
            <h3 id="system-status-heading" className="text-xl sm:text-2xl font-semibold text-slate-800 mb-6 border-b border-slate-200 pb-4">
              System Status
            </h3>
            <div className="space-y-4">
                <div className="flex items-center">
                    <div className="h-3 w-3.5 rounded-full bg-emerald-500 mr-3 animate-pulse"></div>
                    <p className="text-slate-700">API Services: <span className="font-semibold text-emerald-600">Operational</span></p>
                </div>
                <div className="flex items-center">
                    <div className="h-3 w-3.5 rounded-full bg-emerald-500 mr-3"></div>
                    <p className="text-slate-700">Database Connection: <span className="font-semibold text-emerald-600">Healthy</span></p>
                </div>
                <div className="flex items-center">
                     <div className={`h-3 w-3.5 rounded-full mr-3 shadow-sm ${data?.pendingApprovals && data.pendingApprovals > 0 ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`}></div>
                    <p className="text-slate-700">Pending Tasks: 
                        <span className={`font-semibold ${data?.pendingApprovals && data.pendingApprovals > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {isLoadingDisplay ? 'Checking...' : (data?.pendingApprovals && data.pendingApprovals > 0 ? `${data.pendingApprovals} approvals` : 'None')}
                        </span>
                    </p>
                </div>
            </div>
        </aside>
      </div>
    </div>
  );
}