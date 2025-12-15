import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { Mail, Server, Key, TestTube } from 'lucide-react';

export const EmailSettings = () => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const [config, setConfig] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUsername: '',
    smtpPassword: '',
    fromEmail: 'noreply@example.com',
    fromName: 'Cron Job Manager',
  });

  const handleSave = async () => {
    setIsLoading(true);
    setSuccess(null);
    setError(null);

    // Simulate API call
    setTimeout(() => {
      setSuccess('Email configuration saved successfully');
      setIsLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }, 500);
  };

  const handleTest = async () => {
    setIsTesting(true);
    setError(null);

    // Simulate test email
    setTimeout(() => {
      setSuccess('Test email sent successfully! Check your inbox.');
      setIsTesting(false);
      setTimeout(() => setSuccess(null), 5000);
    }, 1000);
  };

  if (user?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-muted-foreground">
              Email configuration is only available to administrators.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {success && (
        <div className="p-3 rounded-md bg-green-50 border border-green-200">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Admin Badge */}
      <div>
        <Badge variant="default">Admin Only</Badge>
      </div>

      {/* SMTP Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            <CardTitle>SMTP Server Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure your SMTP server to send email notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtpHost">SMTP Host</Label>
              <Input
                id="smtpHost"
                type="text"
                value={config.smtpHost}
                onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                placeholder="smtp.gmail.com"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtpPort">SMTP Port</Label>
              <Input
                id="smtpPort"
                type="text"
                value={config.smtpPort}
                onChange={(e) => setConfig({ ...config, smtpPort: e.target.value })}
                placeholder="587"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtpUsername">SMTP Username</Label>
            <Input
              id="smtpUsername"
              type="text"
              value={config.smtpUsername}
              onChange={(e) => setConfig({ ...config, smtpUsername: e.target.value })}
              placeholder="your-email@gmail.com"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtpPassword">SMTP Password</Label>
            <Input
              id="smtpPassword"
              type="password"
              value={config.smtpPassword}
              onChange={(e) => setConfig({ ...config, smtpPassword: e.target.value })}
              placeholder="••••••••"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              For Gmail, use an App Password instead of your regular password
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sender Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Sender Information</CardTitle>
          </div>
          <CardDescription>Configure the sender details for outgoing emails</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fromEmail">From Email Address</Label>
            <Input
              id="fromEmail"
              type="email"
              value={config.fromEmail}
              onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
              placeholder="noreply@example.com"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fromName">From Name</Label>
            <Input
              id="fromName"
              type="text"
              value={config.fromName}
              onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
              placeholder="Cron Job Manager"
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          onClick={handleTest}
          variant="outline"
          disabled={isLoading || isTesting}
          className="gap-2"
        >
          <TestTube className="h-4 w-4" />
          {isTesting ? 'Sending Test...' : 'Send Test Email'}
        </Button>

        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
};
