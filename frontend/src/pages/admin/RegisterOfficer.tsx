import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import API from '@/lib/axios'

export default function RegisterOfficer() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      await API.post('/admin/officers', form, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`, // assumes token is stored here
        },
      })
      setMessage('✅ Officer registered successfully')
      setForm({ name: '', email: '', password: '' })
    } catch (err: any) {
      console.error(err)
      setMessage('❌ Failed to register officer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-4">Register Officer</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} />
        <Input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
        <Input
          name="password"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={handleChange}
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Registering...' : 'Register Officer'}
        </Button>
        {message && <p className="text-sm text-center mt-2">{message}</p>}
      </form>
    </div>
  )
}
