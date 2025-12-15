import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CronExpressionHelperProps {
  onExpressionChange: (expression: string) => void;
  currentExpression?: string;
}

const cronPresets = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Every 30 minutes', value: '*/30 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every 6 hours', value: '0 */6 * * *' },
  { label: 'Every 12 hours', value: '0 */12 * * *' },
  { label: 'Daily at midnight', value: '0 0 * * *' },
  { label: 'Daily at noon', value: '0 12 * * *' },
  { label: 'Daily at 6 AM', value: '0 6 * * *' },
  { label: 'Daily at 6 PM', value: '0 18 * * *' },
  { label: 'Weekly on Monday', value: '0 0 * * 1' },
  { label: 'Weekly on Sunday', value: '0 0 * * 0' },
  { label: 'Monthly on 1st', value: '0 0 1 * *' },
  { label: 'Monthly on 15th', value: '0 0 15 * *' },
  { label: 'Yearly on Jan 1st', value: '0 0 1 1 *' },
];

const getCronDescription = (expression: string): string => {
  const preset = cronPresets.find((p) => p.value === expression);
  if (preset) return preset.label;

  const parts = expression.split(' ');
  if (parts.length !== 5) return 'Invalid cron expression';

  const [minute, hour, day, month, dayOfWeek] = parts;

  const descriptions: string[] = [];

  // Minute
  if (minute === '*') {
    descriptions.push('every minute');
  } else if (minute.startsWith('*/')) {
    descriptions.push(`every ${minute.slice(2)} minutes`);
  } else {
    descriptions.push(`at minute ${minute}`);
  }

  // Hour
  if (hour === '*') {
    descriptions.push('of every hour');
  } else if (hour.startsWith('*/')) {
    descriptions.push(`every ${hour.slice(2)} hours`);
  } else {
    descriptions.push(`at hour ${hour}`);
  }

  // Day of month
  if (day !== '*') {
    descriptions.push(`on day ${day} of the month`);
  }

  // Month
  if (month !== '*') {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    descriptions.push(`in ${months[parseInt(month) - 1] || month}`);
  }

  // Day of week
  if (dayOfWeek !== '*') {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    descriptions.push(`on ${days[parseInt(dayOfWeek)] || dayOfWeek}`);
  }

  return descriptions.join(', ');
};

export const CronExpressionHelper = ({
  onExpressionChange,
  currentExpression,
}: CronExpressionHelperProps) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(currentExpression || '');

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    onExpressionChange(value);
  };

  const description = selectedPreset ? getCronDescription(selectedPreset) : '';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cron Expression Helper</CardTitle>
        <CardDescription>Choose a preset or build your own cron expression</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="preset">Common Schedules</Label>
          <Select
            id="preset"
            value={selectedPreset}
            onChange={(e) => handlePresetChange(e.target.value)}
          >
            <option value="">Select a preset...</option>
            {cronPresets.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label} ({preset.value})
              </option>
            ))}
          </Select>
        </div>

        {selectedPreset && (
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm font-medium mb-2">Selected Expression:</p>
            <code className="text-sm bg-background px-3 py-2 rounded block mb-2">
              {selectedPreset}
            </code>
            <p className="text-sm text-muted-foreground">
              <strong>Runs:</strong> {description}
            </p>
          </div>
        )}

        <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-4">
          <p className="text-sm font-medium mb-2">Cron Format:</p>
          <code className="text-xs block">* * * * *</code>
          <p className="text-xs text-muted-foreground mt-1">
            │ │ │ │ │<br />
            │ │ │ │ └─ Day of week (0-6, 0=Sunday)
            <br />
            │ │ │ └─── Month (1-12)
            <br />
            │ │ └───── Day of month (1-31)
            <br />
            │ └─────── Hour (0-23)
            <br />
            └───────── Minute (0-59)
          </p>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Examples:</strong>
          </p>
          <p>• * = every</p>
          <p>• */5 = every 5 units</p>
          <p>• 0,30 = at 0 and 30</p>
          <p>• 10-15 = from 10 to 15</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CronExpressionHelper;
