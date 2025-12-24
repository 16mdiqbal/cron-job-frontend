import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { picTeamService, type PicTeam } from '@/services/api/picTeamService';
import { getErrorMessage } from '@/services/utils/error';

export const PicTeamsSettings = () => {
  const [teams, setTeams] = useState<PicTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlackHandle, setNewSlackHandle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const activeCount = useMemo(() => teams.filter((t) => t.is_active).length, [teams]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await picTeamService.list(true);
      setTeams(data);
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to load PIC teams'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh().catch(() => undefined);
  }, []);

  const createTeam = async () => {
    const name = newName.trim();
    const slack_handle = newSlackHandle.trim();
    if (!name) return;
    if (!slack_handle) {
      setError('Slack handle is required (e.g. @qa-team or <!subteam^S123ABC>).');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const created = await picTeamService.create({ name, slack_handle });
      setTeams((prev) => [created, ...prev]);
      setNewName('');
      setNewSlackHandle('');
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to create PIC team'));
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (team: PicTeam) => {
    setError(null);
    try {
      const result = await picTeamService.update(team.id, { is_active: !team.is_active });
      const updated = result.pic_team;
      setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to update PIC team'));
    }
  };

  const save = async (team: PicTeam, payload: { name?: string; slack_handle?: string }) => {
    const nextName = (payload.name ?? team.name).trim();
    const nextSlack = (payload.slack_handle ?? team.slack_handle ?? '').trim();
    if (!nextName) return;
    if (!nextSlack) {
      setError('Slack handle is required (e.g. @qa-team or <!subteam^S123ABC>).');
      return;
    }
    setError(null);
    try {
      if (nextName !== team.name) {
        const ok = window.confirm(
          `Rename PIC team to "${nextName}"?\n\nThis will automatically update its slug and migrate existing jobs.`
        );
        if (!ok) return;
      }

      const result = await picTeamService.update(team.id, {
        name: nextName !== team.name ? nextName : undefined,
        slack_handle: nextSlack !== (team.slack_handle || '') ? nextSlack : undefined,
      });
      const updated = result.pic_team;
      setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      if (typeof result.jobs_updated === 'number') alert(`Migrated ${result.jobs_updated} job(s).`);
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to rename PIC team'));
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          PIC Teams
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Manage the teams responsible for jobs. Jobs store the team slug (stable), while the label
          can change.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="secondary">Total: {teams.length}</Badge>
          <Badge variant="secondary">Active: {activeCount}</Badge>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="md:col-span-2">
            <div className="text-xs text-muted-foreground mb-1">New team name</div>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Payments Platform"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  createTeam().catch(() => undefined);
                }
              }}
            />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Slack handle *</div>
            <Input
              value={newSlackHandle}
              onChange={(e) => setNewSlackHandle(e.target.value)}
              placeholder="e.g. @qa-team or <!subteam^S123ABC>"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  createTeam().catch(() => undefined);
                }
              }}
            />
          </div>
          <Button
            onClick={() => createTeam()}
            loading={creating}
            loadingText="Creating…"
            loadingMinMs={400}
            disabled={creating || !newName.trim()}
          >
            Add Team
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          Tip: Use a Slack user group mention like <code>{'<!subteam^S123ABC>'}</code> for reliable
          tagging.
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
          <div className="grid grid-cols-12 gap-3 px-4 py-3 text-xs font-medium text-muted-foreground bg-muted/30">
            <div className="col-span-3">Name</div>
            <div className="col-span-3">Slug</div>
            <div className="col-span-3">Slack handle</div>
            <div className="col-span-1">State</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {teams.map((t) => (
              <TeamRow
                key={`${t.id}:${t.name}:${t.slack_handle || ''}`}
                team={t}
                onToggle={toggleActive}
                onSave={save}
              />
            ))}
          </div>
          {teams.length === 0 && !loading && (
            <div className="p-4 text-sm text-muted-foreground">No PIC teams found.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const TeamRow = ({
  team,
  onToggle,
  onSave,
}: {
  team: PicTeam;
  onToggle: (team: PicTeam) => Promise<void> | void;
  onSave: (
    team: PicTeam,
    payload: { name?: string; slack_handle?: string }
  ) => Promise<void> | void;
}) => {
  const [name, setName] = useState(team.name);
  const [slackHandle, setSlackHandle] = useState(team.slack_handle || '');
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
      <div className="col-span-3">
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="col-span-3">
        <Input value={slugPreview} disabled />
      </div>
      <div className="col-span-3">
        <Input
          value={slackHandle}
          onChange={(e) => setSlackHandle(e.target.value)}
          placeholder="@qa-team or <!subteam^...>"
        />
      </div>
      <div className="col-span-1">
        <Badge variant={team.is_active ? 'success' : 'secondary'}>
          {team.is_active ? 'active' : 'off'}
        </Badge>
      </div>
      <div className="col-span-2 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            const nextName = name.trim();
            const nextSlack = slackHandle.trim();
            if (!nextName || !nextSlack) return;
            await onSave(team, { name: nextName, slack_handle: nextSlack });
          }}
          disabled={
            !name.trim() ||
            !slackHandle.trim() ||
            (name.trim() === team.name && slackHandle.trim() === (team.slack_handle || ''))
          }
        >
          Save
        </Button>
        <Button variant="outline" size="sm" onClick={() => onToggle(team)}>
          {team.is_active ? 'Disable' : 'Enable'}
        </Button>
      </div>
    </div>
  );
};

export default PicTeamsSettings;
