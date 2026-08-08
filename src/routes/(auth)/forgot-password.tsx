import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslations } from '@/hooks/useTranslations';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export const Route = createFileRoute('/(auth)/forgot-password')({
  component: () => {
    const { t } = useTranslations();
    return (
      <Card className="p-8">
        <h1 className="text-2xl font-bold text-center mb-6">{t('auth.forgotPassword')}</h1>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('auth.email')}</label>
            <Input type="email" />
          </div>
          <Button type="submit" className="w-full">
             Recuperar
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          <Link to="/login" className="text-[#233B5D] font-medium hover:underline">{t('auth.login')}</Link>
        </div>
      </Card>
    );
  }
});
