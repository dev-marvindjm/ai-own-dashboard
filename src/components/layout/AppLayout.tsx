import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppLayout() {
  return (
    <div className="flex h-screen w-full bg-[#f8f9fc] dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#f8f9fc] dark:bg-[#0b0f19]">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
