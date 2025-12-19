import { client } from './client';

export type PicTeam = {
  id: string;
  slug: string;
  name: string;
  slack_handle?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export const picTeamService = {
  async list(includeInactive = false): Promise<PicTeam[]> {
    const { data } = await client.get('/pic-teams', {
      params: includeInactive ? { include_inactive: true } : undefined,
    });
    return data.pic_teams || [];
  },

  async create(payload: { name: string; slug?: string; slack_handle: string }): Promise<PicTeam> {
    const { data } = await client.post('/pic-teams', payload);
    return data.pic_team;
  },

  async update(
    id: string,
    payload: { name?: string; is_active?: boolean; slack_handle?: string }
  ): Promise<{ pic_team: PicTeam; jobs_updated?: number }> {
    const { data } = await client.put(`/pic-teams/${id}`, payload);
    return { pic_team: data.pic_team, jobs_updated: data.jobs_updated };
  },

  async disable(id: string): Promise<PicTeam> {
    const { data } = await client.delete(`/pic-teams/${id}`);
    return data.pic_team;
  },
};

export default picTeamService;
