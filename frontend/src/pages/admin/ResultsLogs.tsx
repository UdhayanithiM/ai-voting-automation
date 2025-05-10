import useSWR from 'swr'
import API from '@/lib/axios'
import { Button } from '@/components/ui/Button'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Vote {
  _id: string
  voterId: string
  candidate: string
  createdAt: string
}

const fetcher = (url: string) => API.get(url).then((res) => res.data)

export default function ResultsLogs() {
  const { data: votes = [], isLoading } = useSWR<Vote[]>('/admin/votes', fetcher)

  const exportToCSV = () => {
    const headers = ['#', 'Voter ID', 'Candidate', 'Time']
    const rows = votes.map((v, i) => [
      i + 1,
      v.voterId,
      v.candidate,
      new Date(v.createdAt).toLocaleString(),
    ])

    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'voting-results.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('Voting Results Report', 14, 20)
    doc.setFontSize(11)
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28)

    const rows = votes.map((v, i) => [
      i + 1,
      v.voterId,
      v.candidate,
      new Date(v.createdAt).toLocaleString(),
    ])

    autoTable(doc, {
      startY: 35,
      head: [['#', 'Voter ID', 'Candidate', 'Time']],
      body: rows,
    })

    doc.save('voting-results.pdf')
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">📊 Voting Logs</h1>

      {isLoading ? (
        <p className="text-gray-500">Loading vote data...</p>
      ) : votes.length === 0 ? (
        <p className="text-gray-500">No vote records available.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border mb-6">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Voter ID</th>
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {votes.map((vote, i) => (
                  <tr key={vote._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{i + 1}</td>
                    <td className="px-4 py-2">{vote.voterId}</td>
                    <td className="px-4 py-2">{vote.candidate}</td>
                    <td className="px-4 py-2">{new Date(vote.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-4">
            <Button onClick={exportToCSV}>📥 Export CSV</Button>
            <Button onClick={exportToPDF}>🖨 Export PDF</Button>
          </div>
        </>
      )}
    </div>
  )
}
