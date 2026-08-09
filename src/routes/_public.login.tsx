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
      <div className="bg-gradient-to-b from-[#e2edf5] to-[#cdddec] border-b border-[#a9c2d7] px-4 py-2">
        <h1 className="text-[15px] font-bold text-[#555] font-arial">
          {t('auth.login')}
        </h1>
      </div>

      <div className="p-6">
        {authError && (
          <div className="p-2 mb-4 text-sm text-red-600 bg-red-50 border border-red-200 text-center">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center">
            <label htmlFor="email" className="w-1/3 text-right pr-4 text-[13px] font-bold text-gray-500 font-arial">
              E-mail
            </label>
            <div className="w-2/3">
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="w-full px-2 py-1.5 border border-[#cccccc] shadow-inner text-[13px] focus:outline-none focus:border-[#72a8cb]"
                {...register('email')}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>
          </div>

          <div className="flex items-center">
            <label htmlFor="password" className="w-1/3 text-right pr-4 text-[13px] font-bold text-gray-500 font-arial">
              Contraseña
            </label>
            <div className="w-2/3">
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="w-full px-2 py-1.5 border border-[#cccccc] shadow-inner text-[13px] focus:outline-none focus:border-[#72a8cb]"
                {...register('password')}
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>
          </div>

          <div className="flex items-center pt-1">
            <div className="w-1/3"></div>
            <div className="w-2/3 flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-[13px] w-[13px] border-gray-300 rounded-sm focus:ring-0 mr-2"
              />
              <label htmlFor="remember-me" className="text-[12px] text-gray-400 font-arial">
                Recordarme en este equipo
              </label>
            </div>
          </div>

          <div className="flex items-center pt-2">
            <div className="w-1/3"></div>
            <div className="w-2/3">
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="bg-gradient-to-b from-[#8ebad6] to-[#6998bf] border border-[#5281a9] text-white text-[13px] font-bold px-6 py-1.5 rounded-[2px] shadow-sm hover:from-[#7facca] hover:to-[#5c8bb3] focus:outline-none"
              >
                {loginMutation.isPending ? t('common.loading') : 'Entrar'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-[#f0f4f7] border-t border-[#e2e2e2] py-2 text-center">
        <Link
          to="/forgot-password"
          className="text-[12px] text-[#5586b0] hover:underline font-arial"
        >
          ¿Tienes problemas para entrar?
        </Link>
      </div>

      <div className="absolute -bottom-10 left-0 right-0 text-center">
        <Link
          to="/forgot-password"
          className="text-[13px] text-white hover:underline font-arial"
        >
          ¿Has olvidado tu contraseña?
        </Link>
      </div>
    </>
  );
}
