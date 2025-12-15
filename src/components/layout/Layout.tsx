import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-850 dark:to-gray-900">
      <Header onMenuClick={toggleSidebar} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <main className="flex-1 p-6 relative">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-200/20 to-blue-200/20 dark:from-indigo-900/10 dark:to-blue-900/10 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-200/20 to-indigo-200/20 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-full blur-3xl -z-10"></div>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
