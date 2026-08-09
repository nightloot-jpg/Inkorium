import re

with open('src/routes/_public.login.tsx', 'r') as f:
    content = f.read()

# 1. Add css import
content = content.replace("import { z } from 'zod';", "import { z } from 'zod';\nimport '../styles/login.css';")

# 2. Replace the return structure
replacement = """
  return (
    <div className="ik-login-card">
      <h1>{t('auth.welcomeBack')}</h1>

      {authError && (
        <div className="ik-login-error">
          {authError}
        </div>
      )}

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
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
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
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <div className="ik-login-row">
          <label>
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            {t('auth.rememberMe')}
          </label>
          <Link to="/forgot-password">
            {t('auth.forgotPassword')}
          </Link>
        </div>

        <button type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? t('common.loading') : t('auth.login')}
        </button>
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
    </div>
  );
"""

pattern = r"  return \(\n    <>\n.*    </>\n  \);"

new_content = re.sub(pattern, replacement.strip('\n'), content, flags=re.DOTALL)

with open('src/routes/_public.login.tsx', 'w') as f:
    f.write(new_content)
