import { createFileRoute } from '@tanstack/react-router';
import { useTranslations } from '@/hooks/useTranslations';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export const Route = createFileRoute('/(auth)/update-password')({
  component: () => {
    const { t } = useTranslations();
    return (
      <Card className="p-8">
        <h1 className="text-2xl font-bold text-center mb-6">{t('auth.updatePassword')}</h1>
         <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('auth.password')}</label>
            <Input type="password" />
          </div>
          <Button type="submit" className="w-full">
             Actualizar
          </Button>
        </form>
      </Card>
    );
  }
});
