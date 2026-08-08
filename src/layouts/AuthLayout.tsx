import { Outlet } from '@tanstack/react-router';
import { Logo } from '@/components/ui/Logo';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        <Outlet />
      </div>
    </div>
  );
};
