import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4">
        {/* Mobile menu button */}
        <Button variant="ghost" size="icon" className="mr-2 md:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <Link to="/dashboard" className="flex items-center">
          <span className="font-bold">Cron Job Manager</span>
        </Link>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>

          {/* User menu */}
          <div className="flex items-center space-x-2">
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium">{user?.name || user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
