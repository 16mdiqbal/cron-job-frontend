import { useState } from 'react';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { EmailSettings } from '@/components/settings/EmailSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { User, Bell, Mail, Lock } from 'lucide-react';

type SettingsTab = 'profile' | 'notifications' | 'email' | 'security';

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const tabs = [
    { id: 'profile' as SettingsTab, label: 'Profile', icon: User },
    { id: 'notifications' as SettingsTab, label: 'Notification Preferences', icon: Bell },
    { id: 'email' as SettingsTab, label: 'Email', icon: Mail },
    { id: 'security' as SettingsTab, label: 'Security', icon: Lock },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-sm border border-indigo-100 dark:border-gray-700">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account and preferences</p>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-2">
        <nav className="flex space-x-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-6 font-medium text-sm transition-all rounded-xl ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 dark:hover:from-gray-700 dark:hover:to-gray-600 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="py-4">
        {activeTab === 'profile' && <ProfileSettings />}
        {activeTab === 'notifications' && <NotificationSettings />}
        {activeTab === 'email' && <EmailSettings />}
        {activeTab === 'security' && <SecuritySettings />}
      </div>
    </div>
  );
};

export default SettingsPage;
