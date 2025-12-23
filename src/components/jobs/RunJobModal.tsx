import { useEffect, useMemo, useRef, useState, type KeyboardEventHandler } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Plus, Trash2, X, Play } from 'lucide-react';
import type { Job } from '@/types';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type Props = {
  job: Job;
  open: boolean;
  onClose: () => void;
  initial?: {
    target_url?: string;
    dispatch_url?: string;
  };
  onRun: (payload: {
    metadata?: Record<string, any>;
    target_url?: string;
    dispatch_url?: string;
    github_owner?: string;
    github_repo?: string;
    github_workflow_name?: string;
    github_token?: string;
  }) => Promise<void>;
};

const isGithubJob = (job: Job) => Boolean(job.github_owner && job.github_repo && job.github_workflow_name);

const getRepoType = (job: Job): 'api' | 'web' | 'mobile' | null => {
  const repo = job.github_repo?.toLowerCase();
  if (!repo) return null;
  if (repo === 'api' || repo === 'web' || repo === 'mobile') return repo;
  if (repo.includes('api')) return 'api';
  if (repo.includes('web')) return 'web';
  if (repo.includes('mobile')) return 'mobile';
  return null;
};

type MetadataRow = { key: string; value: string };

const MAX_METADATA_FIELDS = 10;

const splitMetadata = (
  metadata: Record<string, any> | undefined
): { rows: MetadataRow[]; compositeText: string } => {
  if (!metadata) return { rows: [], compositeText: '' };

  const entries = Object.entries(metadata);
  const compositeEntry = entries.find(([k]) => k === 'composite');
  const nonComposite = entries.filter(([k]) => k !== 'composite');

  // If there are more than MAX_METADATA_FIELDS entries, keep MAX-1 as individual fields
  // and aggregate the rest under a single "composite" field.
  const maxIndividual = compositeEntry ? MAX_METADATA_FIELDS - 1 : MAX_METADATA_FIELDS;
  const keptIndividual = nonComposite.slice(0, maxIndividual);
  const overflow = nonComposite.slice(maxIndividual);

  const rows: MetadataRow[] = keptIndividual.map(([key, value]) => ({
    key,
    value: typeof value === 'string' ? value : JSON.stringify(value),
  }));

  const compositeObj: Record<string, any> = {};

  if (compositeEntry) {
    const [, compositeValue] = compositeEntry;
    if (compositeValue && typeof compositeValue === 'object' && !Array.isArray(compositeValue)) {
      Object.assign(compositeObj, compositeValue);
    } else if (typeof compositeValue === 'string' && compositeValue.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(compositeValue);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          Object.assign(compositeObj, parsed);
        }
      } catch {
        // ignore parse errors here; user can fix at runtime
      }
    }
  }

  for (const [key, value] of overflow) {
    compositeObj[key] = value;
  }

  const compositeText = Object.keys(compositeObj).length > 0 ? JSON.stringify(compositeObj, null, 2) : '';

  if (compositeText) {
    rows.push({ key: 'composite', value: compositeText });
  }

  return { rows: rows.slice(0, MAX_METADATA_FIELDS), compositeText };
};

const coerceValue = (raw: string): any => {
  const value = raw.trim();
  if (value === '') return '';
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (value.startsWith('{') || value.startsWith('[')) {
    try {
      return JSON.parse(value);
    } catch {
      return raw;
    }
  }
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return raw;
};

const parseCompositeValue = (raw: string): Record<string, any> | undefined => {
  const text = raw.trim();
  if (!text) return undefined;

  if (text.startsWith('{')) {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Composite value must be a JSON object.');
    }
    return parsed as Record<string, any>;
  }

  const result: Record<string, any> = {};
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const idx = line.indexOf('=');
    if (idx === -1) {
      throw new Error('Composite value must be JSON or lines in key=value format.');
    }
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1);
    if (!key) continue;
    result[key] = coerceValue(value);
  }
  return Object.keys(result).length > 0 ? result : undefined;
};

const rowsToMetadata = (rows: MetadataRow[]): Record<string, any> | undefined => {
  const result: Record<string, any> = {};
  for (const row of rows) {
    const key = row.key.trim();
    if (!key) continue;
    if (key === 'composite') {
      const composite = parseCompositeValue(row.value);
      if (composite !== undefined) result[key] = composite;
      continue;
    }
    result[key] = coerceValue(row.value);
  }
  return Object.keys(result).length > 0 ? result : undefined;
};

export function RunJobModal({ job, open, onClose, onRun, initial }: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const github = isGithubJob(job);
  const repoType = github ? getRepoType(job) : null;
  const badgeVariant = github
    ? repoType === 'api'
      ? 'info'
      : repoType === 'web'
        ? 'secondary'
        : repoType === 'mobile'
          ? 'warning'
          : 'info'
    : 'secondary';
  const badgeLabel = github ? (repoType ? repoType.toUpperCase() : 'GITHUB') : 'WEBHOOK';
  const initialMetadata = useMemo(() => job.metadata || {}, [job.metadata]);
  const initialSplit = useMemo(() => splitMetadata(job.metadata), [job.metadata]);
  const initialDispatchUrl = useMemo(() => {
    const owner = job.github_owner || 'Pay-Baymax';
    if (!job.github_repo || !job.github_workflow_name) return '';
    const workflow = job.github_workflow_name.match(/\.(ya?ml)$/i)
      ? job.github_workflow_name
      : `${job.github_workflow_name}.yml`;
    return `https://github.com/${owner}/${job.github_repo}/actions/workflows/${workflow}`;
  }, [job.github_owner, job.github_repo, job.github_workflow_name]);

  const [githubOwner, setGithubOwner] = useState(job.github_owner || '');
  const [githubRepo, setGithubRepo] = useState(job.github_repo || '');
  const [githubWorkflow, setGithubWorkflow] = useState(job.github_workflow_name || '');
  const [targetUrl, setTargetUrl] = useState(job.target_url || '');
  const [dispatchUrl, setDispatchUrl] = useState(initialDispatchUrl);
  const [githubToken, setGithubToken] = useState('');
  const [metadataRows, setMetadataRows] = useState<MetadataRow[]>(() => initialSplit.rows);
  const [metadataNotice, setMetadataNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setMetadataNotice(null);
    setRunning(false);
    setGithubOwner(job.github_owner || '');
    setGithubRepo(job.github_repo || '');
    setGithubWorkflow(job.github_workflow_name || '');
    setTargetUrl(initial?.target_url ?? job.target_url ?? '');
    setDispatchUrl(initial?.dispatch_url ?? initialDispatchUrl);
    setGithubToken('');
    const split = splitMetadata(job.metadata);
    setMetadataRows(split.rows);
  }, [open, job, initial, initialDispatchUrl]);

  const isBrowser = typeof document !== 'undefined';
  useEffect(() => {
    if (!open || !isBrowser) return;

    const previousActive = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.setTimeout(() => {
      dialogRef.current?.focus();
    }, 0);

    return () => {
      document.body.style.overflow = prevOverflow;
      previousActive?.focus?.();
    };
  }, [open, isBrowser]);

  const getFocusable = () => {
    const root = dialogRef.current;
    if (!root) return [];
    return Array.from(
      root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
  };

  const onDialogKeyDown: KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key !== 'Tab') return;

    const focusable = getFocusable();
    if (focusable.length === 0) {
      e.preventDefault();
      dialogRef.current?.focus();
      return;
    }

    const current = document.activeElement as HTMLElement | null;
    const currentIndex = current ? focusable.indexOf(current) : -1;
    const lastIndex = focusable.length - 1;

    if (e.shiftKey) {
      if (currentIndex <= 0) {
        e.preventDefault();
        focusable[lastIndex]?.focus();
      }
      return;
    }

    if (currentIndex === lastIndex) {
      e.preventDefault();
      focusable[0]?.focus();
    }
  };

  if (!open) return null;
  // Render into a portal so `position: fixed` isn't affected by transformed ancestors (e.g., sticky header).
  if (!isBrowser) return null;

  const handleRun = async () => {
    setError(null);
    let metadata: Record<string, any> | undefined;
    try {
      metadata = rowsToMetadata(metadataRows);
    } catch (e: any) {
      setError(e?.message || 'Invalid metadata.');
      return;
    }
    const metadataPayload = Object.keys(metadata).length > 0 ? metadata : undefined;

    setRunning(true);
    try {
      if (!job.is_active) {
        setError('This job is inactive. Enable it first to run now.');
        return;
      }
      if (github) {
        await onRun({
          dispatch_url: dispatchUrl.trim() || undefined,
          github_owner: githubOwner.trim(),
          github_repo: githubRepo.trim(),
          github_workflow_name: githubWorkflow.trim(),
          github_token: githubToken.trim() || undefined,
          metadata: metadataPayload,
        });
      } else {
        await onRun({
          target_url: targetUrl.trim(),
          metadata: metadataPayload,
        });
      }
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to run job.');
    } finally {
      setRunning(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[70]" role="presentation">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          onKeyDown={onDialogKeyDown}
          className="w-full max-w-2xl max-h-[calc(100vh-2rem)] rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 transform transition-all animate-in fade-in zoom-in-95 flex flex-col overflow-hidden"
        >
          <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-200 dark:border-gray-700">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Run job now</h2>
                <Badge variant={badgeVariant} className={github ? 'uppercase tracking-wide' : undefined}>{badgeLabel}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">{job.name}</div>
            </div>
            <Tooltip content="Close" position="left">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </Tooltip>
          </div>

          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Cron expression</div>
                <Input value={job.cron_expression} readOnly />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Status</div>
                <Input value={job.is_active ? 'Active' : 'Inactive'} readOnly />
              </div>
            </div>

            {github ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Dispatch URL</div>
                    <Input
                      value={dispatchUrl}
                      onChange={(e) => setDispatchUrl(e.target.value)}
                      placeholder="https://github.com/<owner>/<repo>/actions/workflows/Launcher.yml"
                    />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">GitHub PAT</div>
                    <Input
                      type="password"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      placeholder="ghp_..."
                    />
                    <div className="text-xs text-muted-foreground mt-1">Used only for this run.</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">GitHub owner</div>
                  <Input value={githubOwner} onChange={(e) => setGithubOwner(e.target.value)} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Repo</div>
                  <Input value={githubRepo} onChange={(e) => setGithubRepo(e.target.value)} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Workflow</div>
                  <Input value={githubWorkflow} onChange={(e) => setGithubWorkflow(e.target.value)} />
                </div>
              </div>
              </div>
            ) : (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Target URL</div>
                <Input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-muted-foreground">Metadata</div>
                <div className="text-xs text-muted-foreground">Not saved to DB</div>
              </div>
              <div className="rounded-md border border-input bg-background p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Fields: <span className="font-medium text-foreground">{metadataRows.length}</span>/{MAX_METADATA_FIELDS}
                  </div>
                </div>

                {metadataNotice && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100 p-3 text-sm">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5" />
                      <div>{metadataNotice}</div>
                    </div>
                  </div>
                )}

                {metadataRows.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No metadata</div>
                ) : (
                  <div className="space-y-2">
                    {metadataRows.map((row, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          value={row.key}
                          onChange={(e) =>
                            setMetadataRows((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, key: e.target.value } : r))
                            )
                          }
                          placeholder="key"
                        />
                        <Input
                          value={row.value}
                          onChange={(e) =>
                            setMetadataRows((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, value: e.target.value } : r))
                            )
                          }
                          placeholder="value"
                        />
                        <Tooltip content="Remove" position="top">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setMetadataNotice(null);
                              setMetadataRows((prev) => prev.filter((_, i) => i !== idx));
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (metadataRows.length >= MAX_METADATA_FIELDS) {
                        setMetadataNotice(
                          `You already added ${MAX_METADATA_FIELDS} fields. Add extra metadata inside a field named "composite" (JSON object or key=value lines).`
                        );
                        return;
                      }
                      setMetadataNotice(null);
                      setMetadataRows((prev) => [...prev, { key: '', value: '' }]);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add field
                  </Button>
                  <Tooltip content="Reset to default metadata" position="top">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setMetadataNotice(null);
                        const split = splitMetadata(initialMetadata);
                        setMetadataRows(split.rows);
                      }}
                      className="text-muted-foreground"
                    >
                      Reset
                    </Button>
                  </Tooltip>
                </div>

                <div className="text-xs text-muted-foreground">
                  Values are auto-typed (numbers/booleans). For more than {MAX_METADATA_FIELDS} fields, use a field named <code>composite</code>.
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={onClose} disabled={running}>
              Cancel
            </Button>
            <Tooltip content={job.is_active ? '' : 'Enable job to run now'} position="top">
              <Button onClick={handleRun} disabled={running || !job.is_active}>
                <Play className="mr-2 h-4 w-4" />
                {running ? 'Running…' : 'Run now'}
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default RunJobModal;
