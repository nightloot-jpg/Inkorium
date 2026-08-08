import { useTranslations } from '@/hooks/useTranslations';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';

export const RightSidebar = () => {
  const { t } = useTranslations();

  return (
    <div className="p-4 flex flex-col gap-6">
      <div>
        <h3 className="font-semibold text-slate-500 mb-3 text-sm">{t('rightSidebar.online')}</h3>
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg">
              <div className="relative">
                <Avatar>
                  <AvatarFallback>{`U${i}`}</AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
              </div>
              <span className="text-sm font-medium">User {i}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
         <h3 className="font-semibold text-slate-500 mb-3 text-sm">{t('rightSidebar.birthdays')}</h3>
         <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
           Hoy es el cumpleaños de <strong>Juan</strong>
         </div>
      </div>
    </div>
  );
};
