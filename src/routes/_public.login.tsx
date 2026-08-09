import { useState, useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslations } from '../hooks/useTranslations';
import { useLogin } from '../features/auth/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const Route = createFileRoute('/_public/login')({
  component: Login,
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function Login() {
  const { t } = useTranslations();
  const loginMutation = useLogin();
  const [authError, setAuthError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const savedEmail = localStorage.getItem('inkorium_remember_email');
    const savedPassword = localStorage.getItem('inkorium_remember_password');
    if (savedEmail && savedPassword) {
      setValue('email', savedEmail);
      setValue('password', savedPassword);
      setRememberMe(true);
    }
  }, [setValue]);

  const onSubmit = (data: LoginFormValues) => {
    setAuthError(null);
    loginMutation.mutate(data, {
      onSuccess: () => {
        if (rememberMe) {
          localStorage.setItem('inkorium_remember_email', data.email);
          localStorage.setItem('inkorium_remember_password', data.password);
        } else {
          localStorage.removeItem('inkorium_remember_email');
          localStorage.removeItem('inkorium_remember_password');
        }
      },
      onError: (error: any) => {
        setAuthError(error?.message || t('common.error'));
      },
    });
  };

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#3b4d61] tracking-tight">
          {t('auth.welcomeBack')}
        </h1>
      </div>

      {authError && (
        <div className="p-3 mb-6 text-sm text-red-500 bg-red-50 rounded-md">
          {authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1">
            {t('auth.email')}
          </label>
          <div className="mt-1">
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t('auth.emailPlaceholder')}
              className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#3b4d61] focus:border-[#3b4d61] sm:text-sm"
              {...register('email')}
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-1">
            {t('auth.password')}
          </label>
          <div className="mt-1">
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••••"
              className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#3b4d61] focus:border-[#3b4d61] sm:text-sm tracking-widest"
              {...register('password')}
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-[#3b4d61] focus:ring-[#3b4d61] border-gray-300 rounded cursor-pointer"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 cursor-pointer">
              {t('auth.rememberMe')}
            </label>
          </div>
          <div className="text-sm">
            <Link
              to="/forgot-password"
              className="font-medium text-gray-600 hover:text-gray-900"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#3b4d61] hover:bg-[#2c3b4a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3b4d61] transition-colors duration-200"
          >
            {loginMutation.isPending ? t('common.loading') : t('auth.login')}
          </button>
        </div>
      </form>

      <div className="mt-8 text-center text-sm text-gray-600">
        {t('auth.dontHaveAccount')}{' '}
        <Link
          to="/register"
          className="font-medium text-[#3b4d61] hover:underline"
        >
          {t('auth.register')}
        </Link>
      </div>
    </>
  );
}
