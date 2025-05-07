import { Outlet, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '@/store/useAdminAuth'

export default function AdminLayout() {
  const navigate = useNavigate()
  const logout = useAdminAuth((state) => state.logout)

  const handleLogout = () => {
    logout() // Ensure this clears any relevant auth states or session data
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-800 text-white p-6 space-y-4">
        <h2 className="text-2xl font-bold">Admin</h2>
        <nav className="space-y-2">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="block w-full text-left hover:underline"
          >
            Dashboard
          </button>
          {/* Add more admin links here */}
        </nav>
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="mt-10 text-sm bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition duration-200"
        >
          Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 bg-gray-50">
        <Outlet />
      </main>
    </div>
  )
}
