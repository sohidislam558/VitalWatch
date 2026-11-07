import React from 'react';

export default function PageContainer({ children, className = '' }) {
  return (
    <main className={`flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full ${className}`}>
      {children}
    </main>
  );
}

