// Domain Models
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  name: string;
  cron_expression: string;
  target_url?: string;
  github_owner?: string;
  github_repo?: string;
  github_workflow_name?: string;
  category?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  last_execution_at?: string;
  next_execution_at?: string;
  enable_email_notifications?: boolean;
  notification_emails?: string[];
  notify_on_success?: boolean;
  metadata?: Record<string, any>;
}

export interface JobExecution {
  id: string;
  job_id: string;
  job_name?: string;
  github_repo?: string;
  status: 'running' | 'success' | 'failed';
  trigger_type: 'scheduled' | 'manual';
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  execution_type?: string;
  target?: string;
  response_status?: number;
  error_message?: string;
  output?: string;
}

export interface JobStatistics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  successRate: number;
}

export interface NotificationSettings {
  id: string;
  userId: string;
  emailEnabled: boolean;
  emailOnSuccess: boolean;
  emailOnFailure: boolean;
  webhookEnabled: boolean;
  webhookUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export default User;
