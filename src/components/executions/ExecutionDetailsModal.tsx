import { useEffect, useRef, type KeyboardEventHandler } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { JobExecution } from '@/types';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

type Props = {
  execution: JobExecution;
  open: boolean;
  onClose: () => void;
  onRetry?: () => void;
};

const statusBadgeVariant = (status: JobExecution['status']) => {
  if (status === 'success') return 'success';
  if (status === 'failed') return 'destructive';
  return 'secondary';
};

const formatDateJst = (dateString?: string) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString(undefined, { timeZone: 'Asia/Tokyo' });
};

export function ExecutionDetailsModal({ execution, open, onClose, onRetry }: Props) {
  if (!open) return null;

  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isBrowser || !open) return;
    dialogRef.current?.focus();
  }, [isBrowser, open]);

  const getFocusable = () => {
    const root = dialogRef.current;
    if (!root) return [];
    return Array.from(
      root.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1);
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

  if (!isBrowser) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70]" role="presentation">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          onKeyDown={onDialogKeyDown}
          className="w-full max-w-3xl max-h-[calc(100vh-2rem)] overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 transform transition-all animate-in fade-in zoom-in-95 flex flex-col"
        >
          <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-200 dark:border-gray-700">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Execution details</h2>
                <Badge variant={statusBadgeVariant(execution.status)}>{execution.status}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">{execution.job_name || execution.job_id}</div>
            </div>
            <Tooltip content="Close" position="left">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </Tooltip>
          </div>

          <div className="p-5 space-y-3 text-sm overflow-y-auto flex-1">
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
                  {formatDateJst(execution.started_at)}
                  <span className="ml-1 text-[11px] text-muted-foreground">JST</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Completed</div>
                <div className="font-medium">
                  {formatDateJst(execution.completed_at)}
                  {execution.completed_at && <span className="ml-1 text-[11px] text-muted-foreground">JST</span>}
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

          <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {execution.status === 'failed' && onRetry && (
              <Button
                onClick={onRetry}
                className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-sm hover:shadow-md transition-all"
              >
                Retry with same overrides
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ExecutionDetailsModal;
