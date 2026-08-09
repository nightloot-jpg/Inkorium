import { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useTranslations } from '../hooks/useTranslations';
import { useRegister } from '../features/auth/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const Route = createFileRoute('/_public/register')({
  component: Register,
});

const registerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

function Register() {
  const { t } = useTranslations();
  const registerMutation = useRegister();
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormValues) => {
    setAuthError(null);
    registerMutation.mutate(data, {
      onSuccess: () => {
        navigate({ to: '/login' });
      },
      onError: (error: any) => {
        setAuthError(error?.message || t('common.error'));
      },
    });
  };

  return (
    <div className="flex flex-col">
      <h3 className="text-center text-xl font-bold mb-6 text-[#233B5D]">
        {t('auth.createAccount')}
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {authError && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
            {authError}
          </div>
        )}

        <div>
          <div className="mt-1">
            <input
              type="text"
              placeholder={t('auth.fullName')}
              className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#233B5D] focus:border-[#233B5D] sm:text-base"
              {...register('fullName')}
            />
            {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
          </div>
        </div>

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
          disabled={registerMutation.isPending}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-bold text-white bg-[#42b72a] hover:bg-[#36a420] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#42b72a] transition-colors"
        >
          {registerMutation.isPending ? t('common.loading') : t('auth.register')}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/login"
          className="text-sm font-medium text-[#233B5D] hover:underline"
        >
          {t('auth.alreadyHaveAccount')}
        </Link>
      </div>
    </div>
  );
}
