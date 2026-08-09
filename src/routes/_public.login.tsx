import { useState } from 'react';
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormValues) => {
    setAuthError(null);
    loginMutation.mutate(data, {
      onError: (error: any) => {
        setAuthError(error?.message || t('common.error'));
      },
    });
  };

  return (
    <div className="flex flex-col">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {authError && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
            {authError}
          </div>
        )}

        <div>
          <div className="mt-1">
            <input
              type="email"
              placeholder={t('auth.email')}
              className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#233B5D] focus:border-[#233B5D] sm:text-base"
              {...register('email')}
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>
        </div>

        <div>
          <div className="mt-1">
            <input
              type="password"
              placeholder={t('auth.password')}
              className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#233B5D] focus:border-[#233B5D] sm:text-base"
              {...register('password')}
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-bold text-white bg-[#233B5D] hover:bg-[#1a2d48] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#233B5D] transition-colors"
        >
          {loginMutation.isPending ? t('common.loading') : t('auth.login')}
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link
          to="/forgot-password"
          className="text-sm font-medium text-[#233B5D] hover:underline"
        >
          {t('auth.forgotPassword')}
        </Link>
      </div>

      <div className="mt-6 mb-4 relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-300" />
        </div>
      </div>

      <div className="text-center mt-6">
        <Link
          to="/register"
          className="w-auto inline-flex justify-center py-3 px-6 border border-transparent rounded-md shadow-sm text-base font-bold text-white bg-[#42b72a] hover:bg-[#36a420] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#42b72a] transition-colors"
        >
          {t('auth.createAccount')}
        </Link>
      </div>
    </div>
  );
}
