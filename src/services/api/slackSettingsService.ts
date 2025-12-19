import { client } from './client';

export type SlackSettings = {
  id: string;
  is_enabled: boolean;
  webhook_url?: string | null;
  channel?: string | null;
  created_at?: string;
  updated_at?: string;
};

export const slackSettingsService = {
  async get(): Promise<SlackSettings> {
    const { data } = await client.get('/settings/slack');
    return data.slack_settings;
  },

  async update(payload: {
    is_enabled?: boolean;
    webhook_url?: string | null;
    channel?: string | null;
  }): Promise<SlackSettings> {
    const { data } = await client.put('/settings/slack', payload);
    return data.slack_settings;
  },
};

export default slackSettingsService;

