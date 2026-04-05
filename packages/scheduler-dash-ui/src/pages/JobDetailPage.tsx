import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Zap, RefreshCw, Sun, Moon,
  CheckCircle2, XCircle, Loader2, Clock, StopCircle,
  ChevronDown, ChevronUp, Activity,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { fetchJobs, triggerJob, stopExecution } from '@/api/jobs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn, formatDate, formatDuration, formatDurationMs, formatNextRun, timeAgo } from '@/lib/utils';
import { useTheme } from '@/contexts/theme';
import type { CronJob, JobExecution } from '@/types';

function StatusIcon({ status }: { status: JobExecution['status'] }) {
  if (status === 'completed') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
  if (status === 'failed')    return <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />;
  if (status === 'queued')    return <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
  if (status === 'stopped')   return <StopCircle className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
  return <Loader2 className="w-3.5 h-3.5 text-blue-500 shrink-0 animate-spin" />;
}

function ErrorRow({ error }: { error: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1.5">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-400 transition-colors font-mono"
      >
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {error.split('\n')[0]}
      </button>
      {open && (
        <pre className="mt-1.5 p-3 rounded-md bg-red-500/5 border border-red-500/10 text-xs font-mono text-red-400 overflow-x-auto whitespace-pre-wrap break-all">
          {error}
        </pre>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{label}</p>
        <p className={cn('text-2xl font-bold font-mono mt-1', color ?? 'text-zinc-900 dark:text-zinc-100')}>{value}</p>
      </CardContent>
    </Card>
  );
}

function buildHourlyBuckets(history: JobExecution[]) {
  const now = Date.now();
  return Array.from({ length: 24 }, (_, i) => {
    const slotStart = now - (23 - i) * 3_600_000;
    const label = new Date(slotStart).getHours().toString().padStart(2, '0') + 'h';
    const completed = history.filter(h => {
      const t = new Date(h.startedAt).getTime();
      return h.status === 'completed' && t >= slotStart && t < slotStart + 3_600_000;
    }).length;
    const failed = history.filter(h => {
      const t = new Date(h.startedAt).getTime();
      return h.status === 'failed' && t >= slotStart && t < slotStart + 3_600_000;
    }).length;
    return { label, completed, failed };
  });
}

export default function JobDetailPage() {
  const { name } = useParams<{ name: string }>();
  const decodedName = decodeURIComponent(name ?? '');
  const { theme, toggle } = useTheme();

  const [job, setJob] = useState<CronJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioning, setActioning] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchJobs();
      setJob(data.cron.find(j => j.name === decodedName) ?? null);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [decodedName]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load]);

  async function doAction(fn: () => Promise<void>) {
    setActioning(true);
    try { await fn(); await load(); } finally { setActioning(false); }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-mono">
          Job not found: <span className="text-zinc-900 dark:text-zinc-100">{decodedName}</span>
        </p>
        <Link to="/" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
        </Link>
      </div>
    );
  }

  const history = [...job.history].reverse();
  const { totalRuns, failedRuns, avgDurationMs } = job.metrics;
  const succeededRuns = totalRuns - failedRuns;
  const buckets = buildHourlyBuckets(job.history);
  const hasChartData = buckets.some(b => b.completed + b.failed > 0);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Navbar */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Dashboard
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100">{job.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={load} title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              size="md"
              onClick={() => doAction(() => triggerJob(decodedName))}
              disabled={actioning}
            >
              <Zap className="w-3.5 h-3.5" />
              Trigger
            </Button>
            <Button variant="ghost" size="icon" onClick={toggle} title="Toggle theme">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Job identity */}
        <div className="flex flex-wrap items-start gap-3">
          <Badge variant={job.running ? 'active' : 'inactive'}>
            <span className={cn('w-1.5 h-1.5 rounded-full', job.running ? 'bg-emerald-500' : 'bg-zinc-400')} />
            {job.running ? 'Active' : 'Stopped'}
          </Badge>
          {job.cronExpression && (
            <code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
              {job.cronExpression}
            </code>
          )}
          {job.running && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
              next: {formatNextRun(job.nextRun)}
            </span>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Runs" value={totalRuns} />
          <StatCard label="Succeeded" value={succeededRuns} color="text-emerald-600 dark:text-emerald-400" />
          <StatCard
            label="Failed"
            value={failedRuns}
            color={failedRuns > 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-100'}
          />
          <StatCard label="Avg Duration" value={formatDurationMs(avgDurationMs)} color="text-blue-600 dark:text-blue-400" />
        </div>

        {/* 24h chart */}
        {hasChartData && (
          <Card>
            <CardHeader>
              <CardTitle>Executions — last 24h</CardTitle>
              <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" /> Completed</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block" /> Failed</span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 pb-2">
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={buckets} barSize={12} barGap={2}>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: theme === 'dark' ? '#71717a' : '#a1a1aa' }}
                    tickLine={false}
                    axisLine={false}
                    interval={3}
                  />
                  <YAxis hide allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'dark' ? '#18181b' : '#fff',
                      border: `1px solid ${theme === 'dark' ? '#3f3f46' : '#e4e4e7'}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: theme === 'dark' ? '#e4e4e7' : '#18181b', marginBottom: 4 }}
                    cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
                  />
                  <Bar dataKey="completed" stackId="a" fill="#10b981" radius={[2, 2, 0, 0]}>
                    {buckets.map((entry, i) => (
                      <Cell key={i} fill={entry.completed > 0 ? '#10b981' : 'transparent'} />
                    ))}
                  </Bar>
                  <Bar dataKey="failed" stackId="a" fill="#ef4444" radius={[2, 2, 0, 0]}>
                    {buckets.map((entry, i) => (
                      <Cell key={i} fill={entry.failed > 0 ? '#ef4444' : 'transparent'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle>Execution History</CardTitle>
            <span className="text-xs text-zinc-400 dark:text-zinc-600">{history.length} records</span>
          </CardHeader>
          {history.length === 0 ? (
            <CardContent>
              <p className="text-center text-sm text-zinc-400 dark:text-zinc-600 py-8">No executions recorded yet.</p>
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    {['#', 'Started', 'Duration', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((exec, i) => (
                    <tr
                      key={exec.id}
                      className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-zinc-400 dark:text-zinc-600">
                        {history.length - i}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                        {formatDate(exec.startedAt)}
                        <span className="text-zinc-400 dark:text-zinc-600 ml-2">({timeAgo(exec.startedAt)})</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDuration(exec.startedAt, exec.finishedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <StatusIcon status={exec.status} />
                          <Badge variant={exec.status}>{exec.status}</Badge>
                          {(exec.status === 'running' || exec.status === 'queued') && (
                            <button
                              onClick={() => doAction(() => stopExecution(exec.id))}
                              disabled={actioning}
                              className="ml-2 flex items-center gap-1 text-xs text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-40 font-mono"
                              title="Stop execution"
                            >
                              <StopCircle className="w-3.5 h-3.5" />
                              stop
                            </button>
                          )}
                        </div>
                        {exec.error && <ErrorRow error={exec.error} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
