import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslations } from '../hooks/useTranslations';
import { useLogin } from '../features/auth/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import '../styles/login.css';

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
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormValues) => {
    setAuthError(null);

    loginMutation.mutate(data, {
      onSuccess: () => {
        // Never persist passwords in localStorage. Supabase manages the
        // authenticated session; remember-me is intentionally UI-only.
        if (!rememberMe) {
          localStorage.removeItem('inkorium_remember_email');
        }
      },
      onError: (error: any) => {
        setAuthError(error?.message || t('common.error'));
      },
    });
  };

  return (
    <div className="ik-login-card">
      <h1>{t('auth.welcomeBack')}</h1>

      {authError && <div className="ik-login-error">{authError}</div>}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="ik-field">
          <label htmlFor="email">{t('auth.email')}</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t('auth.emailPlaceholder')}
            disabled={loginMutation.isPending}
            {...register('email')}
          />
          {errors.email && (
            <p className="ik-field-error">{errors.email.message}</p>
          )}
        </div>

        <div className="ik-field">
          <label htmlFor="password">{t('auth.password')}</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••••••"
            disabled={loginMutation.isPending}
            {...register('password')}
          />
          {errors.password && (
            <p className="ik-field-error">{errors.password.message}</p>
          )}
        </div>

        <div className="ik-login-row">
          <label className="ik-remember-label" htmlFor="remember-me">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loginMutation.isPending}
            />
            {t('auth.rememberMe')}
          </label>
          <Link to="/forgot-password">{t('auth.forgotPassword')}</Link>
        </div>

        <button type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? t('common.loading') : t('auth.login')}
        </button>
      </form>

      <div className="ik-login-register">
        {t('auth.dontHaveAccount')}{' '}
        <Link to="/register">{t('auth.register')}</Link>
      </div>
    </div>
  );
}
