// src/components/ui/Input.tsx
import type { InputHTMLAttributes } from 'react'

export const Input = ({ ...props }: InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <input
      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
      {...props}
    />
  )
}
