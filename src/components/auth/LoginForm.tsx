import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/features/auth/schemas/auth.schema';
import type { LoginFormData } from '@/features/auth/schemas/auth.schema';
import { useLogin } from '@/features/auth/hooks/useAuth';
import { useTranslations } from '@/hooks/useTranslations';
import { useNavigate } from '@tanstack/react-router';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export const LoginForm = () => {
  const { t } = useTranslations();
  const navigate = useNavigate();
  const { mutate: login, isPending } = useLogin();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = (data: LoginFormData) => {
    login(data, {
      onSuccess: () => navigate({ to: '/' })
    });
  };

  return (
    <Card className="p-8">
      <h1 className="text-2xl font-bold text-center mb-6">{t('auth.login')}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('auth.email')}</label>
          <Input
            type="email"
            {...register('email')}
          />
          {errors.email?.message && <span className="text-xs text-red-500">{errors.email.message}</span>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('auth.password')}</label>
          <Input
            type="password"
            {...register('password')}
          />
          {errors.password?.message && <span className="text-xs text-red-500">{errors.password.message}</span>}
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? '...' : t('auth.submit')}
        </Button>
      </form>
    </Card>
  );
};
