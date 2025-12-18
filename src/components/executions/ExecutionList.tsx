import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { JobExecution } from '@/types';

type Props = {
  executions: JobExecution[];
  onViewDetails: (execution: JobExecution) => void;
};

const statusBadgeVariant = (status: JobExecution['status']) => {
  if (status === 'success') return 'success';
  if (status === 'failed') return 'destructive';
  return 'secondary';
};

export function ExecutionList({ executions, onViewDetails }: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden bg-white dark:bg-gray-800">
      <Table>
        <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <TableRow>
            <TableHead>Job</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Trigger</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Target</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {executions.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="font-medium">{e.job_name || e.job_id}</TableCell>
              <TableCell>
                <Badge variant={statusBadgeVariant(e.status)}>{e.status}</Badge>
              </TableCell>
              <TableCell className="text-sm">{e.trigger_type}</TableCell>
              <TableCell className="text-sm">
                {e.started_at ? new Date(e.started_at).toLocaleString() : '-'}
              </TableCell>
              <TableCell className="text-sm">
                {typeof e.duration_seconds === 'number' ? `${e.duration_seconds.toFixed(1)}s` : '-'}
              </TableCell>
              <TableCell className="text-sm max-w-[320px] truncate" title={e.target || ''}>
                {e.target || '-'}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  onClick={() => onViewDetails(e)}
                  className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-sm hover:shadow-md transition-all"
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default ExecutionList;
