import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslations } from '../hooks/useTranslations';
import { useResetPassword } from '../features/auth/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export const Route = createFileRoute('/_public/forgot-password')({
  component: ForgotPassword,
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

function ForgotPassword() {
  const { t } = useTranslations();
  const resetPasswordMutation = useResetPassword();
  const [authError, setAuthError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordFormValues) => {
    setAuthError(null);
    setSuccess(false);
    resetPasswordMutation.mutate(data, {
      onSuccess: () => {
        setSuccess(true);
      },
      onError: (error: any) => {
        setAuthError(error?.message || t('common.error'));
      },
    });
  };

  return (
    <div className="flex flex-col">
      <h3 className="text-center text-xl font-bold mb-2 text-[#233B5D]">
        {t('auth.forgotPassword')}
      </h3>

      {!success ? (
        <p className="text-sm text-gray-600 mb-6 text-center">
          {t('auth.resetPasswordInstructions')}
        </p>
      ) : (
        <div className="p-4 text-sm text-green-700 bg-green-50 rounded-md mb-6 border border-green-200">
          {t('auth.resetPasswordSuccess')}
        </div>
      )}

      {!success && (
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

          <button
            type="submit"
            disabled={resetPasswordMutation.isPending}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-bold text-white bg-[#233B5D] hover:bg-[#1a2d48] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#233B5D] transition-colors"
          >
            {resetPasswordMutation.isPending ? t('common.loading') : t('common.send')}
          </button>
        </form>
      )}

      <div className="mt-6 text-center">
        <Link
          to="/login"
          className="text-sm font-medium text-[#233B5D] hover:underline"
        >
          {t('common.backToLogin')}
        </Link>
      </div>
    </div>
  );
}
