import { useMemo, useRef, useState } from 'react';
import { Upload, X, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { normalizeCsvRows, parseCsvText, stringifyCsv } from '@/services/utils/csv';
import { useJobStore } from '@/stores/jobStore';

type Props = {
  onClose: () => void;
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

export function BulkUploadJobsCard({ onClose }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [rawCsv, setRawCsv] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [defaultGithubOwner, setDefaultGithubOwner] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    createdCount: number;
    errorCount: number;
    errors: Array<{ row?: number; job_name?: string; error: string; message?: string }>;
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
              header. Required columns: <code>name</code>, <code>cron_expression</code>, <code>end_date</code> (YYYY-MM-DD), <code>pic_team</code>.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} title="Close">
            <X className="h-4 w-4" />
          </Button>
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
                  'Job Name,Repo,Workflow Name,Branch,Cron schedule (JST),Status,Request Body\\r\\n';
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
        {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        {uploadResult && (
          <div className="rounded-md border border-indigo-200 dark:border-gray-700 bg-indigo-50/60 dark:bg-indigo-950/20 p-3 text-sm">
            <div className="font-medium">Upload summary</div>
            <div className="text-muted-foreground">
              Created: {uploadResult.createdCount} · Errors: {uploadResult.errorCount}
            </div>
            {uploadResult.errors.length > 0 && (
              <div className="mt-2 space-y-1">
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
              } catch (e: any) {
                setError(e?.response?.data?.message || e?.message || 'Failed to upload.');
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
