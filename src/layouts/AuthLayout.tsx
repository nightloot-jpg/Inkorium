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
      <div className="ik-login-page">
        <div className="ik-login-wrapper">
          {children}
        </div>
      </div>
    );
  }

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
