import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Check, CheckCheck, RefreshCcw, Trash2 } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';

import { PageTransition } from '@/components/ui/page-transition';
import { Tooltip } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useNotificationStore } from '@/stores/notificationStore';

const getNotificationTypeColor = (type: string) => {
  switch (type) {
    case 'success':
      return 'text-green-700 bg-green-50 dark:text-green-200 dark:bg-green-900/30';
    case 'error':
      return 'text-red-700 bg-red-50 dark:text-red-200 dark:bg-red-900/30';
    case 'warning':
      return 'text-amber-700 bg-amber-50 dark:text-amber-200 dark:bg-amber-900/30';
    case 'info':
    default:
      return 'text-blue-700 bg-blue-50 dark:text-blue-200 dark:bg-blue-900/30';
  }
};

export const NotificationsPage = () => {
  const {
    notifications,
    unreadCount,
    total,
    page,
    perPage,
    totalPages,
    loading,
    rangePreset,
    fromDate,
    toDate,
    setRangePreset,
    setFromDate,
    setToDate,
    fetchNotifications,
    fetchUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteReadNotifications,
    removeNotification,
  } = useNotificationStore();

  const [unreadOnly, setUnreadOnly] = useState(false);
  const unreadOnlyRef = useRef(unreadOnly);
  const pageRef = useRef(page);
  const perPageRef = useRef(perPage);

  useEffect(() => {
    unreadOnlyRef.current = unreadOnly;
  }, [unreadOnly]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    perPageRef.current = perPage;
  }, [perPage]);

  const refresh = useCallback(
    async (nextPage?: number) => {
      const effectivePage = nextPage ?? pageRef.current;
      const effectivePerPage = perPageRef.current;
      const effectiveUnreadOnly = unreadOnlyRef.current;
      await Promise.all([
        fetchUnreadCount(),
        fetchNotifications(effectivePage, effectivePerPage, effectiveUnreadOnly),
      ]);
    },
    [fetchNotifications, fetchUnreadCount]
  );

  useEffect(() => {
    refresh(1).catch((e) => console.error('Failed to load notifications:', e));
    // Poll for inbox updates
    const interval = window.setInterval(() => {
      refresh().catch(() => undefined);
    }, 15000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    refresh(1).catch(() => undefined);
  }, [unreadOnly, refresh]);

  useEffect(() => {
    refresh(1).catch(() => undefined);
  }, [rangePreset, fromDate, toDate, refresh]);

  const canPrev = page > 1;
  const canNext = totalPages > 0 && page < totalPages;

  const title = useMemo(() => {
    if (unreadOnly) return 'Notifications (Unread)';
    return 'Notifications';
  }, [unreadOnly]);

  const readCountOnPage = useMemo(
    () => notifications.filter((n) => n.is_read).length,
    [notifications]
  );

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-sm border border-indigo-100 dark:border-gray-700">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                {title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Inbox/history of system events and job activity.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 text-sm">
                <span className="px-3 py-1.5 rounded-xl bg-white/70 dark:bg-gray-900/30 border border-indigo-100 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                  Inbox
                </span>
                <Link
                  to="/settings?tab=notifications"
                  className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 dark:hover:from-gray-700 dark:hover:to-gray-600"
                >
                  Settings
                </Link>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-sm text-muted-foreground">
                Unread: <span className="font-medium text-foreground">{unreadCount}</span>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <div className="flex items-center gap-2 rounded-xl border border-indigo-100 dark:border-gray-700 bg-white/70 dark:bg-gray-900/30 px-3 py-2 shadow-sm">
                  <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    Range
                  </div>
                  <div className="w-44">
                    <Select
                      value={rangePreset}
                      onChange={(e) => {
                        const next = e.target.value;
                        if (next === 'all' || next === '7d' || next === '30d' || next === 'custom')
                          setRangePreset(next);
                      }}
                      className="h-9 py-1 bg-white dark:bg-gray-800 border-indigo-200 dark:border-gray-700 focus-visible:ring-indigo-500"
                    >
                      <option value="all">All time</option>
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="custom">Custom</option>
                    </Select>
                  </div>

                  {rangePreset === 'custom' && (
                    <div className="flex gap-2">
                      <div className="w-40">
                        <Input
                          type="date"
                          value={fromDate}
                          onChange={(e) => setFromDate(e.target.value)}
                          aria-label="From date"
                          className="h-9 py-1 bg-white dark:bg-gray-800 border-indigo-200 dark:border-gray-700 focus-visible:ring-indigo-500"
                        />
                      </div>
                      <div className="w-40">
                        <Input
                          type="date"
                          value={toDate}
                          onChange={(e) => setToDate(e.target.value)}
                          aria-label="To date"
                          className="h-9 py-1 bg-white dark:bg-gray-800 border-indigo-200 dark:border-gray-700 focus-visible:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  variant={unreadOnly ? 'default' : 'outline'}
                  onClick={() => setUnreadOnly((v) => !v)}
                  className={
                    unreadOnly ? 'bg-gradient-to-r from-indigo-500 to-blue-600' : undefined
                  }
                >
                  <Bell className="mr-2 h-4 w-4" />
                  {unreadOnly ? 'Showing unread' : 'Show unread only'}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => refresh().catch(() => undefined)}
                  disabled={loading}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                {unreadCount > 0 && (
                  <Button
                    onClick={async () => {
                      await markAllNotificationsAsRead();
                      await refresh(1);
                    }}
                    className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700"
                  >
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Mark all read
                  </Button>
                )}
                {readCountOnPage > 0 && (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const ok = window.confirm(
                        'Delete all read notifications in the current date range?'
                      );
                      if (!ok) return;
                      await deleteReadNotifications();
                      await refresh(1);
                    }}
                    disabled={loading}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete read
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Inbox
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {totalPages > 0 ? (
                <>
                  Page <span className="font-medium text-foreground">{page}</span> of{' '}
                  <span className="font-medium text-foreground">{totalPages}</span> · Total{' '}
                  <span className="font-medium text-foreground">{total}</span>
                </>
              ) : (
                <>
                  Total <span className="font-medium text-foreground">{total}</span>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && (
              <div className="p-6 text-sm text-muted-foreground">Loading notifications…</div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="p-6 text-sm text-muted-foreground">No notifications found.</div>
            )}

            {!loading && notifications.length > 0 && (
              <div className="space-y-2">
                {notifications.map((notification) => {
                  const timeAgo = notification.created_at
                    ? formatDistanceToNow(parseISO(notification.created_at), { addSuffix: true })
                    : '';

                  return (
                    <div
                      key={notification.id}
                      className={
                        'rounded-2xl border p-4 transition-all ' +
                        (notification.is_read
                          ? 'border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/20'
                          : 'border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20')
                      }
                      onClick={async () => {
                        if (!notification.is_read) {
                          await markNotificationAsRead(notification.id);
                          await fetchUnreadCount();
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                'px-2 py-0.5 rounded text-xs font-medium ' +
                                getNotificationTypeColor(notification.type)
                              }
                            >
                              {notification.type === 'error' ? 'error' : notification.type}
                            </span>
                            {!notification.is_read && (
                              <span className="h-2 w-2 rounded-full bg-blue-500" />
                            )}
                            {timeAgo && (
                              <span className="text-xs text-muted-foreground">{timeAgo}</span>
                            )}
                          </div>
                          <div className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                            {notification.title}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground break-words">
                            {notification.message}
                          </div>
                          {(notification.related_job_id || notification.related_execution_id) && (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {notification.related_job_id && (
                                <Tooltip
                                  content={`Open job ${notification.related_job_id}`}
                                  position="top"
                                >
                                  <Link
                                    to={`/jobs/${notification.related_job_id}/edit`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Badge variant="secondary" className="hover:bg-accent">
                                      Job
                                    </Badge>
                                  </Link>
                                </Tooltip>
                              )}
                              {notification.related_execution_id && (
                                <Tooltip content={notification.related_execution_id} position="top">
                                  <Badge variant="secondary">Execution</Badge>
                                </Tooltip>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {!notification.is_read && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await markNotificationAsRead(notification.id);
                                await refresh();
                              }}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Mark read
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await removeNotification(notification.id);
                              await refresh();
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                disabled={!canPrev || loading}
                onClick={() => refresh(page - 1).catch(() => undefined)}
              >
                Previous
              </Button>
              <div className="text-sm text-muted-foreground">
                Page <span className="font-medium text-foreground">{page}</span> of{' '}
                <span className="font-medium text-foreground">{Math.max(totalPages, 1)}</span>
              </div>
              <Button
                variant="outline"
                disabled={!canNext || loading}
                onClick={() => refresh(page + 1).catch(() => undefined)}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default NotificationsPage;
