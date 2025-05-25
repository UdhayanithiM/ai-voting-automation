// frontend/src/components/ui/Button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'link' | 'outline'; // Ensure 'outline' is a valid variant
  size?: 'default' | 'sm' | 'lg';           // Add 'size' prop
}

export function Button({ children, className = '', variant = 'default', size = 'default', ...props }: ButtonProps) {
  // Base styles
  let baseStyles = "font-semibold rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

  // Variant specific styles
  if (variant === 'link') {
    baseStyles = `text-blue-600 hover:text-blue-800 hover:underline ${baseStyles} py-1 px-2 bg-transparent focus:ring-blue-500`;
  } else if (variant === 'outline') {
    // Basic outline style, adjust as needed to match your design system
    baseStyles = `border border-current text-blue-600 hover:bg-blue-50 ${baseStyles} bg-transparent focus:ring-blue-500`;
  } else { // Default variant
    baseStyles = `bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 ${baseStyles}`;
  }

  // Size specific styles (applied after variant styles)
  if (size === 'sm') {
    baseStyles = `${baseStyles} py-1 px-3 text-sm`; // Adjusted padding for 'sm'
  } else if (size === 'lg') {
    baseStyles = `${baseStyles} py-3 px-6 text-lg`; // Adjusted for 'lg'
  } else { // Default size
    baseStyles = `${baseStyles} py-2 px-4`; // Default padding
  }


  return (
    <button
      {...props}
      className={`${baseStyles} ${className}`} // Apply base, then variant, then size, then custom className
    >
      {children}
    </button>
  );
}