import useSWR from 'swr'
import { Button } from '@/components/ui/Button'
import API from '@/lib/axios'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface QueueToken {
  _id: string
  tokenNumber: number
  voterName: string
  status: 'waiting' | 'completed'
  updatedAt: string
}

const fetcher = (url: string) =>
  API.get(url).then((res) => Array.isArray(res.data) ? res.data : [])

const exportToCSV = (tokens: QueueToken[]) => {
  const headers = ['Token Number', 'Voter Name', 'Completed At']
  const rows = tokens.map(token => [
    token.tokenNumber,
    token.voterName,
    new Date(token.updatedAt).toLocaleString(),
  ])

  const csvContent = 'data:text/csv;charset=utf-8,' +
    [headers, ...rows].map(e => e.join(',')).join('\n')

  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', 'voting_report.csv')
  document.body.appendChild(link)
  link.click()
  link.remove()
}

const exportToPDF = (tokens: QueueToken[]) => {
  const doc = new jsPDF()
  const date = new Date().toLocaleString()

  doc.setFontSize(18)
  doc.text('Voting Report', 14, 20)
  doc.setFontSize(11)
  doc.text(`Exported: ${date}`, 14, 28)

  const rows = tokens.map(token => [
    token.tokenNumber,
    token.voterName,
    new Date(token.updatedAt).toLocaleString(),
  ])

  autoTable(doc, {
    startY: 35,
    head: [['Token Number', 'Voter Name', 'Completed At']],
    body: rows,
  })

  doc.save('voting_report.pdf')
}

export default function OfficerReports() {
  const { data: completed = [], isLoading } = useSWR<QueueToken[]>(
    '/queue?status=completed',
    fetcher
  )

  return (
    <div className="min-h-screen bg-white p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">🧾 Voting Reports</h1>

      {isLoading ? (
        <p className="text-gray-500">Loading completed votes...</p>
      ) : completed.length === 0 ? (
        <p className="text-gray-500">No votes have been completed yet.</p>
      ) : (
        <div className="space-y-4">
          {completed.map((token) => (
            <div
              key={token._id}
              className="p-4 border rounded-xl flex justify-between items-center"
            >
              <div>
                <p className="text-lg font-medium">
                  ✅ Token #{token.tokenNumber} — {token.voterName}
                </p>
                <p className="text-sm text-gray-500">
                  Completed: {new Date(token.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ Export Buttons */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button onClick={() => exportToCSV(completed)}>📥 Export to CSV</Button>
        <Button onClick={() => exportToPDF(completed)}>🖨 Export to PDF</Button>
      </div>
    </div>
  )
}
