import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { JobExecution } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Props = {
  execution: JobExecution;
  open: boolean;
  onClose: () => void;
};

const statusBadgeVariant = (status: JobExecution['status']) => {
  if (status === 'success') return 'success';
  if (status === 'failed') return 'destructive';
  return 'secondary';
};

export function ExecutionDetailsModal({ execution, open, onClose }: Props) {
  if (!open) return null;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 transform transition-all animate-in fade-in zoom-in-95">
          <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-200 dark:border-gray-700">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Execution details</h2>
                <Badge variant={statusBadgeVariant(execution.status)}>{execution.status}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">{execution.job_name || execution.job_id}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} title="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-5 space-y-3 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Trigger</div>
                <div className="font-medium">{execution.trigger_type}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Execution type</div>
                <div className="font-medium">{execution.execution_type || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Started</div>
                <div className="font-medium">
                  {execution.started_at ? new Date(execution.started_at).toLocaleString() : '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Completed</div>
                <div className="font-medium">
                  {execution.completed_at ? new Date(execution.completed_at).toLocaleString() : '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Duration</div>
                <div className="font-medium">
                  {typeof execution.duration_seconds === 'number'
                    ? `${execution.duration_seconds.toFixed(1)}s`
                    : '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">HTTP status</div>
                <div className="font-medium">{execution.response_status ?? '-'}</div>
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Target</div>
              <div className="font-medium break-words">{execution.target || '-'}</div>
            </div>

            {execution.error_message && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {execution.error_message}
              </div>
            )}

            <div>
              <div className="text-xs text-muted-foreground mb-1">Output</div>
              <pre className="max-h-[320px] overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
                {execution.output || '-'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExecutionDetailsModal;
