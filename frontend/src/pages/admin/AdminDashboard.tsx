// frontend/src/pages/admin/AdminDashboard.tsx
import useSWR from 'swr';
import { useNavigate, Navigate } from 'react-router-dom';
import API from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { useAdminAuth, useAdminHasHydrated, useAdminUser } from '@/store/useAdminAuth';
import { AxiosError } from 'axios'; // Import AxiosError

// Interface for the expected structure of data on successful fetch
interface AdminStatsData {
  totalVoters?: number;
  totalOfficers?: number;
  totalVotes?: number;
  pendingApprovals?: number;
}

// Interface for the expected structure of the error response from the backend
interface BackendErrorResponseData {
  message?: string;
  error?: string;
  success?: boolean;
}

const swrFetcher = (url: string) => API.get(url).then(res => res.data);

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  const token = useAdminAuth(state => state.token);
  const adminUser = useAdminUser();
  const hasHydrated = useAdminHasHydrated();

  const { 
    data, 
    error: swrError, // swrError will be of type AxiosError<BackendErrorResponseData> | undefined
    isLoading: isSwrLoading 
  } = useSWR<AdminStatsData, AxiosError<BackendErrorResponseData>>( // Specify Error type for SWR
    hasHydrated && token ? '/admin/stats' : null,
    swrFetcher,
    {
      shouldRetryOnError: false,
      onError: (err: AxiosError<BackendErrorResponseData>, key: string) => { // Type 'err' parameter
        console.error(`SWR Error for key "${key}":`, err.message);
        if (err.response?.status === 403 || err.response?.status === 401) {
            // Axios interceptor should ideally handle logout.
        }
      }
    }
  );

  if (!hasHydrated) {
    return <div className="flex justify-center items-center min-h-screen"><p>Loading authentication state...</p></div>;
  }

  if (!token && hasHydrated) {
     console.warn("AdminDashboard: No token after hydration. ProtectedAdminRoute should have redirected.");
     return <Navigate to="/admin/login" replace />;
  }

  if (swrError) {
    // Now swrError is typed, so we can access its properties more safely
    const errorMessage = swrError.response?.data?.message || swrError.message || "An error occurred.";
    const errorStatus = swrError.response?.status;

    return (
        <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center justify-center text-center">
            <h1 className="text-3xl font-bold text-red-700 mb-4">Access Denied</h1>
            <p className="text-red-600 mb-2">
                Could not load dashboard data. Message: {errorMessage}
            </p>
            {(errorStatus === 403 || errorStatus === 401) && (
                 <p className="text-sm text-gray-600 mb-6">
                    This may be due to incorrect permissions or an invalid session. 
                    Please ensure your token includes the correct 'admin' role.
                </p>
            )}
            <Button 
                onClick={() => {
                    useAdminAuth.getState().logout();
                    navigate('/admin/login');
                }} 
                className="bg-red-600 hover:bg-red-700 text-white"
            >
                Logout and Retry Login
            </Button>
        </div>
    );
  }
  
  if (isSwrLoading && token) {
    return <div className="flex justify-center items-center min-h-screen"><p>Loading dashboard statistics...</p></div>;
  }

  if (!data && token && !isSwrLoading) {
    return <p className="text-center mt-4 text-gray-700">Admin statistics are currently unavailable or being fetched.</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 flex flex-col">
      <header className="mb-6 pb-4 border-b border-gray-200 flex justify-between items-center">
        <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-xs sm:text-sm text-gray-500">
                Welcome back, {adminUser?.email || 'Admin'}.
            </p>
        </div>
        <Button onClick={() => { useAdminAuth.getState().logout(); navigate('/admin/login');}} variant="outline" size="sm">
            Logout
        </Button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white shadow-lg rounded-xl p-5 text-center transition-shadow hover:shadow-xl">
          <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-1">🧍 Total Voters</h2>
          <p className="text-3xl sm:text-4xl font-bold text-blue-600">{data?.totalVoters ?? '...'}</p>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-5 text-center transition-shadow hover:shadow-xl">
          <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-1">🧑‍💼 Total Officers</h2>
          <p className="text-3xl sm:text-4xl font-bold text-green-600">{data?.totalOfficers ?? '...'}</p>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-5 text-center transition-shadow hover:shadow-xl">
          <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-1">🗳️ Total Votes Cast</h2>
          <p className="text-3xl sm:text-4xl font-bold text-yellow-600">{data?.totalVotes ?? '...'}</p>
        </div>
        {data?.pendingApprovals !== undefined && (
            <div className="bg-white shadow-lg rounded-xl p-5 text-center transition-shadow hover:shadow-xl">
                <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-1">⏳ Pending Approvals</h2>
                <p className="text-3xl sm:text-4xl font-bold text-orange-500">{data.pendingApprovals}</p>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-4">Quick Actions</h3>
            <div className="space-y-3">
                <Button className="w-full justify-center py-2.5" onClick={() => navigate('/admin/register-officer')}>
                    Register New Officer
                </Button>
                <Button className="w-full justify-center py-2.5" onClick={() => navigate('/admin/dashboard/voters')}>
                    Manage Voters
                </Button>
                <Button className="w-full justify-center py-2.5" onClick={() => navigate('/admin/dashboard/results')}>
                    View Voting Logs
                </Button>
            </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-4">System Status</h3>
            <p className="text-gray-600">All systems operational.</p>
        </div>
      </div>
    </div>
  );
}