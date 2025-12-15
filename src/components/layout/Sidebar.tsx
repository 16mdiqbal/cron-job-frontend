import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/services/utils/helpers';
import { LayoutDashboard, Clock, History, Bell, Users, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    iconColor: 'text-blue-500',
  },
  {
    title: 'Jobs',
    href: '/jobs',
    icon: Clock,
    iconColor: 'text-green-500',
  },
  {
    title: 'Executions',
    href: '/executions',
    icon: History,
    iconColor: 'text-amber-500',
  },
  {
    title: 'Notifications',
    href: '/notifications',
    icon: Bell,
    iconColor: 'text-orange-500',
  },
  {
    title: 'Users',
    href: '/users',
    icon: Users,
    iconColor: 'text-purple-500',
    roles: ['admin'],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    iconColor: 'text-gray-500',
  },
];

export const Sidebar = ({ isOpen = true, onClose }: SidebarProps) => {
  const location = useLocation();
  const { user } = useAuthStore();

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role || '')
  );

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 border-r bg-background transition-transform duration-200 ease-in-out md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between border-b p-4 md:hidden">
          <span className="font-semibold">Menu</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 p-4">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className={`h-5 w-5 ${item.iconColor}`} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
