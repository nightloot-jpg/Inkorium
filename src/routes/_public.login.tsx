import { createFileRoute } from '@tanstack/react-router';
import { useTranslations } from '../hooks/useTranslations';
import { useLogin } from '../features/auth/hooks/useAuth';
import React from 'react';

export const Route = createFileRoute('/_public/login')({
  component: Login,
});

function Login() {
  const { t } = useTranslations();
  const loginMutation = useLogin();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">{t('auth.email')}</label>
        <div className="mt-1">
          <input type="email" required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">{t('auth.password')}</label>
        <div className="mt-1">
          <input type="password" required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>
      </div>
      <button type="submit" disabled={loginMutation.isPending} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#233B5D] hover:bg-[#1a2d48] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
        {loginMutation.isPending ? t('common.loading') : t('auth.login')}
      </button>
    </form>
  );
}
