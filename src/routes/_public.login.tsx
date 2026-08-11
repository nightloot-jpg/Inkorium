import { useEffect, useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useTranslations } from '../hooks/useTranslations';
import { useLogin } from '../features/auth/hooks/useAuth';
import { supabase } from '../lib/supabase';
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
  const navigate = useNavigate();
  const router = useRouter();
  const loginMutation = useLogin();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    if (searchParams.has('email') || searchParams.has('password')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

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
      onSuccess: async (result) => {
        // Keep the browser Supabase client in sync with the session created by
        // the server function. This is required because feed mutations and
        // realtime use the browser client after navigation.
        if (result.session) {
          const { error } = await supabase.auth.setSession(result.session);
          if (error) throw error;
        }

        await router.invalidate();
        await navigate({ to: '/feed' });
      },
      onError: (error: any) => {
        setAuthError(error?.message || t('common.error'));
      },
    });
  };

  return (
    <main className="ik-login-page">
      <div className="ik-login-wrapper">
        <div className="ik-login-brand" aria-label="inkorium">
          <span>inko</span><span>rium</span>
        </div>

        <section className="ik-login-card" aria-labelledby="login-title">
          <h1 id="login-title" className="sr-only">{t('auth.welcomeBack')}</h1>

          {authError && <div className="ik-login-error" role="alert">{authError}</div>}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="ik-field">
              <label htmlFor="email" className="sr-only">{t('auth.email')}</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={t('auth.emailPlaceholder') || t('auth.email')}
                disabled={loginMutation.isPending}
                {...register('email')}
              />
              {errors.email && (
                <p className="ik-field-error">{errors.email.message}</p>
              )}
            </div>

            <div className="ik-field">
              <label htmlFor="password" className="sr-only">{t('auth.password')}</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder={t('auth.password')}
                disabled={loginMutation.isPending}
                {...register('password')}
              />
              {errors.password && (
                <p className="ik-field-error">{errors.password.message}</p>
              )}
            </div>

            <button type="submit" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? t('common.loading') : t('auth.login')}
            </button>
          </form>

          <Link className="ik-login-forgot" to="/forgot-password">
            {t('auth.forgotPassword')}
          </Link>
        </section>

        <div className="ik-login-register">
          <span>{t('auth.dontHaveAccount')}</span>{' '}
          <Link to="/register">{t('auth.register')}</Link>
        </div>
      </div>
    </main>
  );
}
