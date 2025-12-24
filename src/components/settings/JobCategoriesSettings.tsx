import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { jobCategoryService, type JobCategory } from '@/services/api/jobCategoryService';
import { getErrorMessage } from '@/services/utils/error';

export const JobCategoriesSettings = () => {
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const activeCount = useMemo(() => categories.filter((c) => c.is_active).length, [categories]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await jobCategoryService.list(true);
      setCategories(data);
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to load categories'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh().catch(() => undefined);
  }, []);

  const createCategory = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    try {
      const created = await jobCategoryService.create({ name });
      setCategories((prev) => [created, ...prev]);
      setNewName('');
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to create category'));
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (category: JobCategory) => {
    setError(null);
    try {
      const result = await jobCategoryService.update(category.id, {
        is_active: !category.is_active,
      });
      const updated = result.category;
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to update category'));
    }
  };

  const save = async (category: JobCategory, name: string) => {
    const nextName = name.trim();
    if (!nextName) return;
    if (nextName === category.name) return;
    setError(null);
    try {
      const ok = window.confirm(
        `Rename category to "${nextName}"?\n\nThis will automatically update its slug and migrate existing jobs.`
      );
      if (!ok) return;

      const result = await jobCategoryService.update(category.id, { name: nextName });
      const updated = result.category;
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      if (typeof result.jobs_updated === 'number') alert(`Migrated ${result.jobs_updated} job(s).`);
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to rename category'));
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Job Categories
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Manage the categories available when creating jobs. Jobs store the category slug (stable),
          while the label can change.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="secondary">Total: {categories.length}</Badge>
          <Badge variant="secondary">Active: {activeCount}</Badge>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="md:col-span-2">
            <div className="text-xs text-muted-foreground mb-1">New category name</div>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. DR Testing"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  createCategory().catch(() => undefined);
                }
              }}
            />
          </div>
          <Button
            onClick={() => createCategory()}
            loading={creating}
            loadingText="Creating…"
            loadingMinMs={400}
            disabled={creating || !newName.trim()}
          >
            Add Category
          </Button>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
          <div className="grid grid-cols-12 gap-3 px-4 py-3 text-xs font-medium text-muted-foreground bg-muted/30">
            <div className="col-span-5">Name</div>
            <div className="col-span-4">Slug</div>
            <div className="col-span-1">State</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {categories.map((c) => (
              <CategoryRow
                key={`${c.id}:${c.name}`}
                category={c}
                onToggle={toggleActive}
                onSave={save}
              />
            ))}
          </div>
          {categories.length === 0 && !loading && (
            <div className="p-4 text-sm text-muted-foreground">No categories found.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const CategoryRow = ({
  category,
  onToggle,
  onSave,
}: {
  category: JobCategory;
  onToggle: (category: JobCategory) => Promise<void> | void;
  onSave: (category: JobCategory, name: string) => Promise<void> | void;
}) => {
  const [name, setName] = useState(category.name);
  const toSlug = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-|-$/g, '');
  const slugPreview = toSlug(name);

  return (
    <div className="grid grid-cols-12 gap-3 px-4 py-3 items-center">
      <div className="col-span-5">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={category.slug === 'general'}
        />
      </div>
      <div className="col-span-4">
        <Input value={category.slug === 'general' ? 'general' : slugPreview} disabled />
      </div>
      <div className="col-span-1">
        <Badge variant={category.is_active ? 'success' : 'secondary'}>
          {category.is_active ? 'active' : 'off'}
        </Badge>
      </div>
      <div className="col-span-2 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSave(category, name)}
          disabled={!name.trim() || name.trim() === category.name || category.slug === 'general'}
        >
          Save
        </Button>
        <Button variant="outline" size="sm" onClick={() => onToggle(category)}>
          {category.is_active ? 'Disable' : 'Enable'}
        </Button>
      </div>
    </div>
  );
};

export default JobCategoriesSettings;
