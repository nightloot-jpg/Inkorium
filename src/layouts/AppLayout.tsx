import { Outlet } from '@tanstack/react-router';
import { Navbar } from '@/components/layout/Navbar';
import { LeftSidebar } from '@/components/layout/LeftSidebar';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { MainContainer } from '@/components/layout/MainContainer';
import { useUIStore } from '@/stores/uiStore';

export const AppLayout = () => {
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />
      <div className="flex-1 flex max-w-7xl mx-auto w-full pt-16">
        <div className={`${isSidebarOpen ? 'block' : 'hidden'} md:block w-64 shrink-0 fixed md:sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto bg-white border-r z-40`}>
           <LeftSidebar />
        </div>

        <main className="flex-1 min-w-0 h-[calc(100vh-4rem)] overflow-y-auto">
          <MainContainer>
            <Outlet />
          </MainContainer>
        </main>

        <div className="hidden lg:block w-80 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto bg-white border-l">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
};
