import { client } from './client';

export type JobCategory = {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export const jobCategoryService = {
  async list(includeInactive = false): Promise<JobCategory[]> {
    const { data } = await client.get('/job-categories', {
      params: includeInactive ? { include_inactive: true } : undefined,
    });
    return data.categories || [];
  },

  async create(payload: { name: string; slug?: string }): Promise<JobCategory> {
    const { data } = await client.post('/job-categories', payload);
    return data.category;
  },

  async update(
    id: string,
    payload: { name?: string; is_active?: boolean }
  ): Promise<{ category: JobCategory; jobs_updated?: number }> {
    const { data } = await client.put(`/job-categories/${id}`, payload);
    return { category: data.category, jobs_updated: data.jobs_updated };
  },

  async disable(id: string): Promise<JobCategory> {
    const { data } = await client.delete(`/job-categories/${id}`);
    return data.category;
  },
};

export default jobCategoryService;
