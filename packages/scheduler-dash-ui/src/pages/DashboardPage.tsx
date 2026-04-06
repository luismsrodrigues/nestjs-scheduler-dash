import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, RefreshCw, Sun, Moon, ChevronUp, ChevronDown,
  ChevronsUpDown, ChevronLeft, ChevronRight, Activity,
} from 'lucide-react';
import {
  LineChart, Line, ResponsiveContainer, Tooltip,
} from 'recharts';
import { fetchJobs, triggerJob } from '@/api/jobs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { cn, timeAgo, formatNextRun } from '@/lib/utils';
import { useTheme } from '@/contexts/theme';
import type { CronJob } from '@/types';

type SortKey = 'name' | 'cronExpression' | 'status' | 'lastRun' | 'nextRun' | 'successRate';

function buildGlobalHourlyBuckets(jobs: CronJob[]) {
  const now = Date.now();
  const buckets: { hour: string; completed: number; failed: number }[] = Array.from({ length: 24 }, (_, i) => {
    const d = new Date(now - (23 - i) * 3_600_000);
    return { hour: `${d.getHours()}h`, completed: 0, failed: 0 };
  });
  for (const job of jobs) {
    for (const entry of job.history) {
      const ms = new Date(entry.startedAt).getTime();
      const hoursAgo = (now - ms) / 3_600_000;
      if (hoursAgo > 24 || hoursAgo < 0) continue;
      const idx = 23 - Math.floor(hoursAgo);
      if (idx < 0 || idx > 23) continue;
      if (entry.status === 'completed') buckets[idx].completed++;
      else if (entry.status === 'failed') buckets[idx].failed++;
    }
  }
  return buckets;
}

function ActivityChartCard({ jobs }: { jobs: CronJob[] }) {
  const data = buildGlobalHourlyBuckets(jobs);
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
          Activity (24h)
        </p>
        <div className="h-14">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs shadow-sm">
                      <p className="font-medium text-zinc-500 dark:text-zinc-400 mb-1">{label}</p>
                      <p className="text-emerald-600 dark:text-emerald-400">ok: {payload[0]?.value ?? 0}</p>
                      <p className="text-red-500">err: {payload[1]?.value ?? 0}</p>
                    </div>
                  );
                }}
              />
              <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
type SortDir = 'asc' | 'desc';

const PAGE_SIZES = [10, 25, 50, 100];

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{label}</p>
        <p className={cn('text-2xl font-bold mt-1 font-mono', color ?? 'text-zinc-900 dark:text-zinc-100')}>{value}</p>
        {sub && <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== col) return <ChevronsUpDown className="w-3 h-3 text-zinc-400" />;
  return sortDir === 'asc'
    ? <ChevronUp className="w-3 h-3" />
    : <ChevronDown className="w-3 h-3" />;
}

function successRate(job: CronJob): number {
  const { totalRuns, failedRuns } = job.metrics;
  if (totalRuns === 0) return 100;
  return Math.round(((totalRuns - failedRuns) / totalRuns) * 100);
}

function lastRunDate(job: CronJob): number {
  const last = job.history[job.history.length - 1];
  return last ? new Date(last.startedAt).getTime() : 0;
}

function sortJobs(jobs: CronJob[], key: SortKey, dir: SortDir): CronJob[] {
  return [...jobs].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case 'name':          cmp = a.name.localeCompare(b.name); break;
      case 'cronExpression': cmp = (a.cronExpression ?? '').localeCompare(b.cronExpression ?? ''); break;
      case 'status':        cmp = Number(b.running) - Number(a.running); break;
      case 'lastRun':       cmp = lastRunDate(a) - lastRunDate(b); break;
      case 'nextRun':       cmp = new Date(a.nextRun).getTime() - new Date(b.nextRun).getTime(); break;
      case 'successRate':   cmp = successRate(a) - successRate(b); break;
    }
    return dir === 'asc' ? cmp : -cmp;
  });
}

export default function DashboardPage() {
  const { theme, toggle } = useTheme();
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(0);

  const load = useCallback(async () => {
    try {
      const data = await fetchJobs();
      setJobs(data.cron);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  }

  async function handleTrigger(e: React.MouseEvent, name: string) {
    e.preventDefault();
    setTriggering(name);
    try {
      await triggerJob(name);
      await load();
    } finally {
      setTriggering(null);
    }
  }

  const sorted = sortJobs(jobs, sortKey, sortDir);
  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const totalRuns   = jobs.reduce((s, j) => s + j.metrics.totalRuns, 0);
  const totalFailed = jobs.reduce((s, j) => s + j.metrics.failedRuns, 0);

  function ThHeader({ col, label }: { col: SortKey; label: string }) {
    return (
      <th
        className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer select-none hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        onClick={() => handleSort(col)}
      >
        <span className="flex items-center gap-1">
          {label}
          <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
        </span>
      </th>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Navbar */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-emerald-500" />
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">Scheduler Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={load} title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggle} title="Toggle theme">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Jobs" value={jobs.length} />
          <ActivityChartCard jobs={jobs} />
          <StatCard label="Total Runs" value={totalRuns.toLocaleString()} color="text-blue-600 dark:text-blue-400" />
          <StatCard
            label="Failed Runs"
            value={totalFailed.toLocaleString()}
            color={totalFailed > 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-100'}
          />
        </div>

        {/* Jobs table */}
        <Card>
          <CardHeader>
            <CardTitle>Cron Jobs ({jobs.length})</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Rows</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}
                className="text-xs border border-zinc-300 dark:border-zinc-700 rounded-md px-2 py-1 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none"
              >
                {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-sm text-zinc-400">Loading…</div>
            ) : paginated.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-sm text-zinc-400">No jobs found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <ThHeader col="name" label="Name" />
                    <ThHeader col="cronExpression" label="Schedule" />
                    <ThHeader col="status" label="Status" />
                    <ThHeader col="lastRun" label="Last Run" />
                    <ThHeader col="nextRun" label="Next Run" />
                    <ThHeader col="successRate" label="Rate" />
                    <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider" />
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(job => {
                    const last = job.history[job.history.length - 1];
                    const rate = successRate(job);
                    return (
                      <tr
                        key={job.name}
                        className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3.5">
                          <Link
                            to={`/jobs/${encodeURIComponent(job.name)}`}
                            className="font-mono text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          >
                            {job.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5">
                          {job.cronExpression
                            ? <code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded">{job.cronExpression}</code>
                            : <span className="text-zinc-400 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant={job.running ? 'active' : 'disabled'}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', job.running ? 'bg-emerald-500' : 'bg-amber-400')} />
                            {job.running ? 'Active' : 'Disabled'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                          {last ? (
                            <span className="flex items-center gap-1.5">
                              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', {
                                'bg-emerald-500': last.status === 'completed',
                                'bg-red-500': last.status === 'failed',
                                'bg-blue-500 animate-pulse': last.status === 'running',
                                'bg-amber-400': last.status === 'queued',
                                'bg-zinc-400': last.status === 'stopped',
                              })} />
                              {timeAgo(last.startedAt)}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                          {job.running ? formatNextRun(job.nextRun) : '—'}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                              <div
                                className={cn('h-full rounded-full', rate >= 90 ? 'bg-emerald-500' : rate >= 70 ? 'bg-amber-400' : 'bg-red-500')}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{job.metrics.totalRuns > 0 ? `${rate}%` : '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={e => handleTrigger(e, job.name)}
                            disabled={triggering === job.name || !job.running}
                            title={!job.running ? 'Job is disabled' : 'Trigger job'}
                          >
                            <Zap className="w-3 h-3" />
                            {triggering === job.name ? 'Running…' : 'Trigger'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-200 dark:border-zinc-800">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={cn(
                      'w-7 h-7 text-xs rounded-md transition-colors',
                      i === page
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
                <Button variant="ghost" size="icon" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
