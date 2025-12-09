import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'md',
  color = 'text-teal-600',
}) => {
  const spinnerSize = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div
        className={`animate-spin rounded-full border-4 border-t-4 border-gray-200 ${spinnerSize[size]} ${color}`}
      ></div>
      {message && <p className={`mt-3 text-gray-700 ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'}`}>{message}</p>}
    </div>
  );
};

export default LoadingSpinner;