import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getErrorMessage } from '@/services/utils/error';
import {
  slackSettingsService,
  type SlackSettings as SlackSettingsModel,
} from '@/services/api/slackSettingsService';

export const SlackSettings = () => {
  const [settings, setSettings] = useState<SlackSettingsModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isEnabled, setIsEnabled] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [channel, setChannel] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await slackSettingsService.get();
      setSettings(data);
      setIsEnabled(Boolean(data.is_enabled));
      setWebhookUrl((data.webhook_url || '').trim());
      setChannel((data.channel || '').trim());
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to load Slack settings'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh().catch(() => undefined);
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await slackSettingsService.update({
        is_enabled: isEnabled,
        webhook_url: webhookUrl.trim() || null,
        channel: channel.trim() || null,
      });
      setSettings(updated);
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to update Slack settings'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Slack Integration
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Configure Slack webhook delivery for weekly end-date reminders and auto-pause alerts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant={isEnabled ? 'success' : 'secondary'}>
            {isEnabled ? 'enabled' : 'disabled'}
          </Badge>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading || saving}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Webhook URL</div>
            <Input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              disabled={saving}
            />
            <div className="text-xs text-muted-foreground">
              Stored in the backend database. Keep this secret.
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Channel (optional)</div>
            <Input
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              placeholder="#qa-alerts"
              disabled={saving}
            />
            <div className="text-xs text-muted-foreground">
              If supported by the webhook, messages can be directed to this channel.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              disabled={saving}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Enable Slack notifications
          </label>
          <Button
            onClick={save}
            loading={saving}
            loadingText="Saving…"
            loadingMinMs={400}
            disabled={saving}
          >
            Save
          </Button>
        </div>

        {settings && (
          <div className="text-xs text-muted-foreground">
            Last updated:{' '}
            {settings.updated_at ? new Date(settings.updated_at).toLocaleString() : '-'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SlackSettings;
