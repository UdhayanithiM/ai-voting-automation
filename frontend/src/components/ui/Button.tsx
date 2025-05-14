// src/components/ui/Button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'link'; // Added variant prop
}

export function Button({ children, className = '', variant = 'default', ...props }: ButtonProps) {
  // Base styles
  let baseStyles = "font-semibold py-2 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

  // Variant specific styles
  if (variant === 'link') {
    baseStyles = `text-blue-600 hover:text-blue-800 hover:underline ${baseStyles} py-1 px-2 bg-transparent focus:ring-blue-500`; // Adjusted padding for link
  } else { // Default variant
    baseStyles = `bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 ${baseStyles}`;
  }

  return (
    <button
      {...props}
      className={`${baseStyles} ${className}`} // Apply base, then variant, then custom className
    >
      {children}
    </button>
  );
}
