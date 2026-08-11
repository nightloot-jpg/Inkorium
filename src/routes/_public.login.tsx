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
  const [rememberMe, setRememberMe] = useState(false);

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

        if (!rememberMe) {
          localStorage.removeItem('inkorium_remember_email');
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
    <div className="ik-login-page">
      <div className="ik-login-wrapper">
        <div className="ik-login-header">
          <img src="/logo.png" alt="Inkorium Logo" />
          <h1>INKORIUM</h1>
        </div>

        <div className="ik-login-card">
          {authError && <div className="ik-login-error">{authError}</div>}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="ik-field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                disabled={loginMutation.isPending}
                {...register('email')}
              />
              {errors.email && (
                <p className="ik-field-error">{errors.email.message}</p>
              )}
            </div>

            <div className="ik-field">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
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
            </div>

            <button type="submit" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? t('common.loading') : t('auth.login')}
            </button>

            <div className="ik-login-register">
              <Link to="/forgot-password">¿Tienes problemas para entrar? ¿Has olvidado tu contraseña?</Link>
              <br/><br/>
              {t('auth.dontHaveAccount')}{' '}
              <Link to="/register">{t('auth.register')}</Link>
            </div>
          </form>
        </div>

        <div className="ik-login-footer">
          <span>Blog</span>
          <span>Empleo</span>
          <span>Información Legal</span>
          <span>© Inkorium 2024</span>
        </div>
      </div>
    </div>
  );
}
