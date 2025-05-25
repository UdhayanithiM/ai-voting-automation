// frontend/src/pages/admin/ResultsLogs.tsx
import useSWR from 'swr';
import API from '@/lib/axios'; // Your global Axios instance
import { Button } from '@/components/ui/Button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAdminAuth, useAdminHasHydrated } from '@/store/useAdminAuth'; 
import { Navigate } from 'react-router-dom'; 
import { AxiosError } from 'axios'; // Import AxiosError

interface FormattedVote {
  id: string; 
  voterId: string;
  voterName?: string; 
  candidateName: string;
  candidatePosition?: string; 
  timestamp: string; 
}

// Define an interface for the backend error response
interface BackendErrorResponseData {
    message?: string;
    error?: string;
}

const swrFetcher = (url: string) => API.get(url).then((res) => res.data as FormattedVote[]);

export default function ResultsLogs() {
  // CORRECTED: Select the token directly as a primitive value
  const token = useAdminAuth(state => state.token);
  const hasHydrated = useAdminHasHydrated();

  const { data: votes = [], error: votesError, isLoading } = useSWR<FormattedVote[], AxiosError<BackendErrorResponseData>>(
    // Ensure SWR runs only after hydration and if token exists
    hasHydrated && token ? '/admin/votes' : null, 
    swrFetcher,
    {
        onError: (err) => {
            console.error('SWR Error fetching vote logs:', err.message);
            // Additional error handling if needed
        }
    }
  );

  const exportToCSV = () => {
    if (votes.length === 0) {
      alert('No data to export.');
      return;
    }
    const headers = ['#', 'Voter ID', 'Voter Name', 'Candidate Name', 'Candidate Position', 'Time'];
    const rows = votes.map((vote, i) => [
      i + 1,
      vote.voterId,
      vote.voterName || 'N/A',
      vote.candidateName,
      vote.candidatePosition || 'N/A',
      new Date(vote.timestamp).toLocaleString(),
    ]);

    const csvContent = [headers, ...rows].map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'voting-logs.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    if (votes.length === 0) {
      alert('No data to export.');
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Voting Logs Report', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    autoTable(doc, {
      startY: 35,
      head: [['#', 'Voter ID', 'Voter Name', 'Candidate Name', 'Candidate Position', 'Time']],
      body: votes.map((vote, i) => [
        i + 1,
        vote.voterId,
        vote.voterName || 'N/A',
        vote.candidateName,
        vote.candidatePosition || 'N/A',
        new Date(vote.timestamp).toLocaleString(),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [22, 160, 133] }, 
      margin: { top: 30 }
    });

    doc.save('voting-logs.pdf');
  };

  // Wait for hydration before rendering
  if (!hasHydrated) {
    return <p className="text-center mt-4">Loading authentication...</p>;
  }

  // If not authenticated after hydration
  if (!token) {
    console.warn("ResultsLogs: No token after hydration, redirecting to login.");
    return <Navigate to="/admin/login" replace />;
  }
  
  if (isLoading && token) return <p className="text-gray-500 text-center mt-4">Loading vote data...</p>;
  
  if (votesError) {
    console.error("Error loading vote logs:", votesError);
    const errorMsg = votesError.response?.data?.message || votesError.message;
    return <p className="text-red-500 text-center mt-4">Failed to load vote logs: {errorMsg}</p>;
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📊 Voting Logs</h1>
        {votes.length > 0 && (
          <div className="flex gap-3">
            <Button onClick={exportToCSV} variant="outline">📥 Export CSV</Button>
            <Button onClick={exportToPDF} variant="outline">🖨 Export PDF</Button>
          </div>
        )}
      </div>

      {votes.length === 0 && !isLoading ? (
        <p className="text-gray-500 text-center py-10">No vote records available.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border shadow-md">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Voter ID</th>
                <th className="px-4 py-3">Voter Name</th>
                <th className="px-4 py-3">Candidate Voted For</th>
                <th className="px-4 py-3">Candidate Position</th>
                <th className="px-4 py-3">Time of Vote</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {votes.map((vote, i) => (
                <tr key={vote.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2 font-medium text-gray-900">{i + 1}</td>
                  <td className="px-4 py-2 text-gray-700">{vote.voterId}</td>
                  <td className="px-4 py-2 text-gray-700">{vote.voterName || 'N/A'}</td>
                  <td className="px-4 py-2 text-gray-700">{vote.candidateName}</td>
                  <td className="px-4 py-2 text-gray-700">{vote.candidatePosition || 'N/A'}</td>
                  <td className="px-4 py-2 text-gray-700">{new Date(vote.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}