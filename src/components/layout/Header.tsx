import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';
import { Menu, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 shadow-sm will-change-transform">
      <div className="flex h-16 items-center px-4">
        {/* Mobile menu button */}
        <Button variant="ghost" size="icon" className="mr-2 md:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 group transition-transform hover:scale-105">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg shadow-md group-hover:shadow-lg transition-shadow">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Cron Job Manager</span>
        </Link>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <NotificationsDropdown />

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <div className="hidden text-right md:block px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 border border-indigo-100 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{user?.name || user?.email}</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 capitalize font-medium">{user?.role}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
