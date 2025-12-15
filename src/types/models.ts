// Domain Models
export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  name: string;
  cron_expression: string;
  target_url?: string;
  github_owner?: string;
  github_repo?: string;
  github_workflow_name?: string;
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
  jobId: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  response?: string;
  error?: string;
  retryAttempt: number;
  createdAt: string;
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
