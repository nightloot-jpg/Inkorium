import type { ReactNode } from 'react';
import { useLocation } from '@tanstack/react-router';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const location = useLocation();
  const isLoginRoute = location.pathname === '/login';

  if (isLoginRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#f1f5f9] font-sans">
        <main className="w-full max-w-md relative mt-16">
          <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 z-10 w-24 h-24 flex items-center justify-center">
            <img
              alt="Inkorium Logo"
              className="w-24 h-24 object-contain block drop-shadow-sm"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDh21j_EsxY-EHMnu9xhZtPSz5YQfwkXZ4S_xxWcNjGNc6cyd781tFfLlj7eJRT4BjyfBEbSp64wFH4vhu4Lbwkr_gG5UcEZDKKSJb6v-jlyqPTGH41GMGkBVBr-Bgxt6MHr9OHBWN44oJ9BHKQRRw8IvQFQ4abAKjf7nM3vCzAE_sLFrVmGdSBWkOxjZpPJGoFsv2zd9dwqQnyksVUB4Ln_ZXghRi-wti-IBI9nX0iWqcZXlFNwi5i5Bt6rVJTbpmUpg"
            />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 pt-12 pb-8 px-8 sm:px-10 mt-8">
            {children}
          </div>
        </main>
      </div>
    );
  }

  // Original fallback for other auth routes like /register, /forgot-password
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-[#233B5D]">
          Inkorium
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
          {children}
        </div>
      </div>
    </div>
  );
}
