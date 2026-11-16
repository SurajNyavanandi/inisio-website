import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          error
            ? 'border-red-400 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
        } ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
