import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, X, Download, FileText } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { normalizeCsvRows, parseCsvText, stringifyCsv } from '@/services/utils/csv';
import { picTeamService, type PicTeam } from '@/services/api/picTeamService';
import { useJobStore } from '@/stores/jobStore';
import { getErrorMessage } from '@/services/utils/error';

type Props = {
  onClose: () => void;
};

type BulkUploadError = {
  row?: number;
  job_name?: string;
  error: string;
  message?: string;
  pic_team?: string | null;
  pic_team_slug?: string | null;
};

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function normalizeHeader(value: string): string {
  return (value ?? '').trim().toLowerCase();
}

function findHeaderIndex(headers: string[], candidates: string[]): number {
  const normalized = headers.map(normalizeHeader);
  const candidateSet = new Set(candidates.map((c) => normalizeHeader(c)));
  return normalized.findIndex((h) => candidateSet.has(h));
}

function validateBulkUploadTable(table: {
  headers: string[];
  rows: string[][];
}): BulkUploadError[] {
  const errors: BulkUploadError[] = [];
  const headers = table.headers ?? [];

  const nameIndex = findHeaderIndex(headers, ['job name', 'name']);
  const cronIndex = findHeaderIndex(headers, [
    'cron schedule (jst)',
    'cron expression',
    'cron',
    'cron_expression',
  ]);
  const endDateIndex = findHeaderIndex(headers, ['end date', 'end_date']);
  const picTeamIndex = findHeaderIndex(headers, [
    'pic team',
    'pic_team',
    'pic team slug',
    'pic_team_slug',
  ]);
  const targetUrlIndex = findHeaderIndex(headers, ['target url', 'target_url', 'url']);
  const repoIndex = findHeaderIndex(headers, ['repo', 'github repo', 'github_repo']);
  const workflowIndex = findHeaderIndex(headers, [
    'workflow name',
    'github workflow name',
    'github_workflow_name',
  ]);

  const missingColumns: Array<{ key: string; candidates: string[] }> = [];
  if (nameIndex < 0) missingColumns.push({ key: 'name', candidates: ['Job Name', 'name'] });
  if (cronIndex < 0)
    missingColumns.push({
      key: 'cron_expression',
      candidates: ['Cron schedule (JST)', 'cron_expression'],
    });
  if (endDateIndex < 0)
    missingColumns.push({ key: 'end_date', candidates: ['End Date', 'end_date'] });
  if (picTeamIndex < 0)
    missingColumns.push({ key: 'pic_team', candidates: ['PIC Team', 'pic_team'] });

  if (missingColumns.length > 0) {
    for (const col of missingColumns) {
      errors.push({
        error: 'Missing required column',
        message: `${col.key} is required. Add one of: ${col.candidates.join(', ')}`,
      });
    }
    return errors;
  }

  for (let i = 0; i < table.rows.length; i++) {
    const row = table.rows[i] ?? [];
    const rowNo = i + 2; // include header row
    const jobName = (row[nameIndex] ?? '').trim() || undefined;

    const cron = (row[cronIndex] ?? '').trim();
    if (!cron) {
      errors.push({
        row: rowNo,
        job_name: jobName,
        error: 'Missing required fields',
        message: 'cron_expression is required.',
      });
    }

    const endDate = (row[endDateIndex] ?? '').trim();
    if (!endDate) {
      errors.push({
        row: rowNo,
        job_name: jobName,
        error: 'Missing required fields',
        message: 'end_date (YYYY-MM-DD) is required.',
      });
    }

    const picTeam = (row[picTeamIndex] ?? '').trim();
    if (!picTeam) {
      errors.push({
        row: rowNo,
        job_name: jobName,
        error: 'Missing required fields',
        message: 'pic_team is required.',
      });
    }

    const targetUrl = targetUrlIndex >= 0 ? (row[targetUrlIndex] ?? '').trim() : '';
    const repo = repoIndex >= 0 ? (row[repoIndex] ?? '').trim() : '';
    const workflow = workflowIndex >= 0 ? (row[workflowIndex] ?? '').trim() : '';
    if (!targetUrl && !(repo && workflow)) {
      errors.push({
        row: rowNo,
        job_name: jobName,
        error: 'Missing target configuration',
        message: 'Provide Target URL or Repo + Workflow Name.',
      });
    }
  }

  return errors;
}

export function BulkUploadJobsCard({ onClose }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [rawCsv, setRawCsv] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [defaultGithubOwner, setDefaultGithubOwner] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [knownTeams, setKnownTeams] = useState<PicTeam[] | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    createdCount: number;
    errorCount: number;
    errors: BulkUploadError[];
  } | null>(null);

  const bulkUploadJobsCsv = useJobStore((s) => s.bulkUploadJobsCsv);

  const normalized = useMemo(() => {
    if (!rawCsv) return null;
    try {
      const rows = parseCsvText(rawCsv);
      return normalizeCsvRows(rows);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to parse CSV.';
      return { error: message } as const;
    }
  }, [rawCsv]);

  const clear = () => {
    setError(null);
    setFilename(null);
    setRawCsv('');
    setUploadResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setFilename(file.name);
    try {
      const text = await file.text();
      setRawCsv(text);
    } catch {
      setError('Unable to read file.');
    }
  };

  const canDownloadNormalized = normalized && 'table' in normalized;
  const preview = canDownloadNormalized ? normalized.table : null;
  const stats = canDownloadNormalized ? normalized.stats : null;

  const previewHeaders = preview?.headers.slice(0, 6) ?? [];
  const previewRows = preview?.rows.slice(0, 5) ?? [];
  const clientValidationErrors = preview ? validateBulkUploadTable(preview) : [];
  const isTotalFailure = uploadResult?.createdCount === 0 && (uploadResult?.errorCount ?? 0) > 0;

  const knownTeamSlugs = useMemo(
    () => new Set((knownTeams ?? []).map((t) => t.slug)),
    [knownTeams]
  );
  const knownTeamNames = useMemo(
    () => new Set((knownTeams ?? []).map((t) => t.name.trim().toLowerCase())),
    [knownTeams]
  );
  const inactiveTeamSlugs = useMemo(
    () => new Set((knownTeams ?? []).filter((t) => !t.is_active).map((t) => t.slug)),
    [knownTeams]
  );
  const inactiveTeamNames = useMemo(
    () =>
      new Set(
        (knownTeams ?? []).filter((t) => !t.is_active).map((t) => t.name.trim().toLowerCase())
      ),
    [knownTeams]
  );

  const clientUnknownTeamErrors = useMemo(() => {
    if (!preview || !knownTeams) return [];

    const headers = preview.headers ?? [];
    const picTeamIndex = findHeaderIndex(headers, [
      'pic team',
      'pic_team',
      'pic team slug',
      'pic_team_slug',
    ]);
    const nameIndex = findHeaderIndex(headers, ['job name', 'name']);
    if (picTeamIndex < 0) return [];

    const out: BulkUploadError[] = [];
    for (let i = 0; i < preview.rows.length; i++) {
      const row = preview.rows[i] ?? [];
      const rowNo = i + 2;
      const jobName = nameIndex >= 0 ? (row[nameIndex] ?? '').trim() || undefined : undefined;
      const raw = (row[picTeamIndex] ?? '').trim();
      if (!raw) continue;

      const slug = normalizeHeader(raw)
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '');

      const bySlug = knownTeamSlugs.has(slug);
      const byName = knownTeamNames.has(raw.trim().toLowerCase());
      const exists = bySlug || byName;
      const inactive =
        inactiveTeamSlugs.has(slug) || inactiveTeamNames.has(raw.trim().toLowerCase());

      if (!exists) {
        out.push({
          row: rowNo,
          job_name: jobName,
          error: 'Invalid PIC team',
          message: `Unknown PIC team "${raw}". Create it in Settings → PIC Teams first.`,
          pic_team: raw,
          pic_team_slug: slug,
        });
      } else if (inactive) {
        out.push({
          row: rowNo,
          job_name: jobName,
          error: 'Invalid PIC team',
          message: `PIC team "${raw}" is disabled. Enable it in Settings → PIC Teams or choose another.`,
          pic_team: raw,
          pic_team_slug: slug,
        });
      }
    }
    return out;
  }, [knownTeams, preview, knownTeamNames, knownTeamSlugs, inactiveTeamNames, inactiveTeamSlugs]);

  const aggregatedMissingTeams = useMemo(() => {
    const errors = uploadResult?.errors ?? [];
    const unknown = errors.filter(
      (e) =>
        e.error === 'Invalid PIC team' &&
        String(e.message || '')
          .toLowerCase()
          .includes('unknown pic team')
    );
    const values = new Set<string>();
    for (const e of unknown) {
      const raw = (e.pic_team || '').toString().trim();
      if (raw) values.add(raw);
    }
    return Array.from(values).slice(0, 10);
  }, [uploadResult]);

  const aggregatedDuplicateNames = useMemo(() => {
    const errors = uploadResult?.errors ?? [];
    return errors.filter((e) => e.error === 'Duplicate job name in CSV').length;
  }, [uploadResult]);

  const aggregatedInvalidTeamsClient = useMemo(() => {
    const values = new Set<string>();
    for (const e of clientUnknownTeamErrors) {
      const raw = (e.pic_team || '').toString().trim();
      if (raw) values.add(raw);
    }
    return Array.from(values).slice(0, 10);
  }, [clientUnknownTeamErrors]);

  // Load known PIC teams once so we can validate CSV before upload.
  // If this fails (e.g. auth), we fall back to backend validation.
  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const teams = await picTeamService.list(true);
        if (!canceled) setKnownTeams(teams);
      } catch {
        if (!canceled) setKnownTeams(null);
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  return (
    <Card className="border-indigo-200 dark:border-gray-700">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <Upload className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Bulk upload jobs (CSV)
            </CardTitle>
            <CardDescription>
              CSV is normalized on the client by removing empty rows and dropping columns without a
              header. Required columns: <code>name</code>, <code>cron_expression</code>,{' '}
              <code>end_date</code> (YYYY-MM-DD), <code>pic_team</code>.
            </CardDescription>
          </div>
          <Tooltip content="Close" position="left">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="text-sm font-medium">CSV file</div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="border-indigo-200 dark:border-gray-700"
              >
                <Upload className="mr-2 h-4 w-4" />
                {filename ? 'Change file' : 'Choose CSV'}
              </Button>
              <div className="text-xs text-muted-foreground truncate">
                {filename ? `Selected: ${filename}` : 'No file selected'}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={clear} disabled={!rawCsv && !filename}>
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
            <Button
              onClick={() => {
                const template =
                  'Job Name,Repo,Workflow Name,Branch,Cron schedule (JST),Status,End Date,PIC Team,Request Body\\r\\n';
                downloadText('jobs-template.csv', template);
              }}
              className="bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200 dark:border-indigo-900 dark:hover:bg-indigo-950/60"
            >
              <FileText className="mr-2 h-4 w-4" />
              Template
            </Button>
            <Button
              onClick={() => {
                if (!canDownloadNormalized) return;
                const normalizedCsv = stringifyCsv(normalized.table);
                downloadText('jobs-normalized.csv', normalizedCsv);
              }}
              disabled={!canDownloadNormalized}
            >
              <Download className="mr-2 h-4 w-4" />
              Download normalized
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="text-sm font-medium">Default GitHub owner (optional)</div>
            <Input
              value={defaultGithubOwner}
              onChange={(e) => setDefaultGithubOwner(e.target.value)}
              placeholder="e.g. myorg"
            />
            <div className="text-xs text-muted-foreground">
              Used when the CSV Repo column is just a repo name (not <code>owner/repo</code>).
            </div>
          </div>
        </div>

        {normalized && 'error' in normalized && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {normalized.error}
          </div>
        )}
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        {uploadResult && (
          <div
            className={`rounded-md border p-3 text-sm ${
              isTotalFailure
                ? 'border-destructive/40 bg-destructive/10 text-destructive'
                : 'border-indigo-200 dark:border-gray-700 bg-indigo-50/60 dark:bg-indigo-950/20'
            }`}
          >
            <div className="font-medium">{isTotalFailure ? 'Upload failed' : 'Upload summary'}</div>
            <div className="text-muted-foreground">
              Created: {uploadResult.createdCount} · Errors: {uploadResult.errorCount}
            </div>
            {uploadResult.errors.length > 0 && (
              <div className="mt-2 space-y-1">
                {(aggregatedMissingTeams.length > 0 || aggregatedDuplicateNames > 0) && (
                  <div className="rounded-md bg-background/60 p-2 text-xs text-muted-foreground">
                    {aggregatedMissingTeams.length > 0 && (
                      <div>
                        Unknown PIC teams:{' '}
                        <span className="font-medium">{aggregatedMissingTeams.join(', ')}</span>.
                        Create them in Settings → PIC Teams.
                      </div>
                    )}
                    {aggregatedDuplicateNames > 0 && (
                      <div>
                        Duplicate job names in this CSV:{' '}
                        <span className="font-medium">{aggregatedDuplicateNames}</span> row(s). Job
                        names must be unique.
                      </div>
                    )}
                  </div>
                )}
                {uploadResult.errors.slice(0, 5).map((e, idx) => (
                  <div key={idx} className="text-xs text-destructive">
                    {typeof e.row === 'number' ? `Row ${e.row}: ` : ''}
                    {e.job_name ? `${e.job_name} — ` : ''}
                    {e.error}
                    {e.message ? ` (${e.message})` : ''}
                  </div>
                ))}
                {uploadResult.errors.length > 5 && (
                  <div className="text-xs text-muted-foreground">
                    And {uploadResult.errors.length - 5} more…
                  </div>
                )}
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const header = 'row,job_name,error,message\\r\\n';
                      const body = uploadResult.errors
                        .map((e) => {
                          const row = typeof e.row === 'number' ? String(e.row) : '';
                          const jobName = (e.job_name ?? '').replaceAll('"', '""');
                          const err = (e.error ?? '').replaceAll('"', '""');
                          const msg = (e.message ?? '').replaceAll('"', '""');
                          return `"${row}","${jobName}","${err}","${msg}"`;
                        })
                        .join('\\r\\n');
                      downloadText('bulk-upload-errors.csv', header + body + '\\r\\n');
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download errors
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {stats && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Rows: {stats.originalRowCount}</Badge>
            <Badge variant="secondary">Cols: {stats.originalColumnCount}</Badge>
            <Badge variant="secondary">Removed empty rows: {stats.removedEmptyRowCount}</Badge>
            <Badge variant="secondary">Removed empty headers: {stats.removedColumnCount}</Badge>
            <Badge variant="outline">Ready to upload: {preview?.rows.length ?? 0}</Badge>
          </div>
        )}

        {preview && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  {previewHeaders.map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((r, idx) => (
                  <TableRow key={idx}>
                    {r.slice(0, 6).map((c, cIdx) => (
                      <TableCell key={cIdx} className="max-w-[280px] truncate">
                        {c || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="px-4 py-3 text-xs text-muted-foreground">
              Preview shows first 5 rows and first 6 columns.
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            Upload uses the normalized CSV shown above.
          </div>
          <Button
            disabled={!canDownloadNormalized || uploading}
            onClick={async () => {
              if (!canDownloadNormalized) return;
              setError(null);
              setUploadResult(null);

              if (clientValidationErrors.length > 0) {
                setUploadResult({
                  createdCount: 0,
                  errorCount: clientValidationErrors.length,
                  errors: clientValidationErrors,
                });
                setError('Fix CSV validation errors before uploading.');
                return;
              }

              if (knownTeams && clientUnknownTeamErrors.length > 0) {
                setUploadResult({
                  createdCount: 0,
                  errorCount: clientUnknownTeamErrors.length,
                  errors: clientUnknownTeamErrors,
                });
                setError(
                  aggregatedInvalidTeamsClient.length > 0
                    ? `Unknown PIC teams: ${aggregatedInvalidTeamsClient.join(', ')}. Create them in Settings → PIC Teams.`
                    : 'Fix PIC team validation errors before uploading.'
                );
                return;
              }

              setUploading(true);
              try {
                const normalizedCsv = stringifyCsv(normalized.table);
                const blob = new Blob([normalizedCsv], { type: 'text/csv;charset=utf-8' });
                const formData = new FormData();
                formData.append('file', blob, 'jobs-normalized.csv');
                if (defaultGithubOwner.trim()) {
                  formData.append('default_github_owner', defaultGithubOwner.trim());
                }

                const result = await bulkUploadJobsCsv(formData);
                setUploadResult({
                  createdCount: result.created_count ?? 0,
                  errorCount: result.error_count ?? 0,
                  errors: result.errors ?? [],
                });
              } catch (e: unknown) {
                const payload = axios.isAxiosError(e) ? e.response?.data : undefined;

                if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
                  const obj = payload as Record<string, unknown>;
                  const createdCount =
                    typeof obj.created_count === 'number' ? obj.created_count : 0;
                  const errorCount = typeof obj.error_count === 'number' ? obj.error_count : 0;
                  const errorsRaw = obj.errors;
                  const errors = Array.isArray(errorsRaw) ? (errorsRaw as BulkUploadError[]) : [];
                  setUploadResult({ createdCount, errorCount, errors });

                  const message =
                    (typeof obj.message === 'string' && obj.message) ||
                    (typeof obj.error === 'string' && obj.error) ||
                    getErrorMessage(e, 'Failed to upload.');
                  setError(message);
                } else {
                  setError(getErrorMessage(e, 'Failed to upload.'));
                }
              } finally {
                setUploading(false);
              }
            }}
          >
            {uploading ? 'Uploading…' : 'Upload to server'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default BulkUploadJobsCard;
