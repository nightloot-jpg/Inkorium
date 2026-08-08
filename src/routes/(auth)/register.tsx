import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslations } from '@/hooks/useTranslations';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '@/features/auth/schemas/auth.schema';
import type { RegisterFormData } from '@/features/auth/schemas/auth.schema';

export const Route = createFileRoute('/(auth)/register')({
  component: RegisterPage
});

function RegisterPage() {
  const { t } = useTranslations();
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = (data: RegisterFormData) => {
    // mock register
    console.log(data);
  };

  return (
    <Card className="p-8">
      <h1 className="text-2xl font-bold text-center mb-6">{t('auth.register')}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Usuario</label>
          <Input type="text" {...register('username')} />
          {errors.username?.message && <span className="text-xs text-red-500">{errors.username.message}</span>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('auth.email')}</label>
          <Input type="email" {...register('email')} />
          {errors.email?.message && <span className="text-xs text-red-500">{errors.email.message}</span>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('auth.password')}</label>
          <Input type="password" {...register('password')} />
          {errors.password?.message && <span className="text-xs text-red-500">{errors.password.message}</span>}
        </div>
        <Button type="submit" className="w-full">
          {t('auth.createAccount')}
        </Button>
      </form>
      <div className="mt-4 text-center text-sm">
        <span className="text-slate-500">{t('auth.hasAccount')} </span>
        <Link to="/login" className="text-[#233B5D] font-medium hover:underline">{t('auth.login')}</Link>
      </div>
    </Card>
  );
}
