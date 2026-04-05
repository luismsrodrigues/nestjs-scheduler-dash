import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Timer, Activity, AlertTriangle, Play, Square, Zap } from 'lucide-react';
import { fetchJobs, triggerJob, stopJob, startJob } from '@/api/jobs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { timeAgo, formatNextRun } from '@/lib/utils';
import type { CronJob, JobsResponse } from '@/types';

function StatusDot({ running, lastStatus }: { running: boolean; lastStatus?: string }) {
  if (!running) return <span className="w-2 h-2 rounded-full bg-zinc-600 inline-block" />;
  return (
    <span className="relative inline-flex w-2 h-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
    </span>
  );
}

function LastExecution({ job }: { job: CronJob }) {
  const last = job.history[job.history.length - 1];
  if (!last) return <span className="text-zinc-600 font-mono text-xs">—</span>;
  return (
    <div className="flex items-center gap-2">
      <Badge variant={last.status}>{last.status}</Badge>
      <span className="text-zinc-500 font-mono text-xs">{timeAgo(last.startedAt)}</span>
    </div>
  );
}

export default function JobsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<JobsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async () => {
    try {
      const result = await fetchJobs();
      setData(result);
      setError(null);
      setLastRefresh(new Date());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [autoRefresh, load]);

  async function action(name: string, fn: () => Promise<void>) {
    setActioning(name);
    try { await fn(); await load(); } finally { setActioning(null); }
  }

  const jobs = data?.cron ?? [];
  const totalFailed = jobs.reduce((acc, j) => acc + j.history.filter(h => h.status === 'failed').length, 0);
  const activeJobs = jobs.filter(j => j.running).length;

  return (
    <div className="min-h-screen grid-bg">
      {/* Header */}
      <header className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <Timer className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <span className="font-mono text-sm font-semibold text-zinc-100 tracking-tight">
              scheduler<span className="text-teal-400">.</span>dash
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-zinc-600 font-mono text-xs">
              {timeAgo(lastRefresh.toISOString())}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefresh(v => !v)}
              className={autoRefresh ? 'text-teal-400 hover:text-teal-300' : ''}
            >
              <Activity className="w-3.5 h-3.5" />
              {autoRefresh ? 'live' : 'paused'}
            </Button>
            <Button variant="ghost" size="icon" onClick={load} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Jobs', value: jobs.length, icon: Timer, color: 'text-zinc-400' },
            { label: 'Active', value: activeJobs, icon: Activity, color: 'text-emerald-400' },
            { label: 'Failed Executions', value: totalFailed, icon: AlertTriangle, color: totalFailed > 0 ? 'text-red-400' : 'text-zinc-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="px-5 py-4 flex items-center gap-4">
              <Icon className={`w-5 h-5 shrink-0 ${color}`} />
              <div>
                <div className={`font-mono text-2xl font-semibold ${color}`}>{value}</div>
                <div className="text-zinc-500 text-xs mt-0.5">{label}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Jobs table */}
        <Card>
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="font-semibold text-sm text-zinc-100">Cron Jobs</h2>
            <span className="text-zinc-600 font-mono text-xs">{jobs.length} registered</span>
          </div>

          {error && (
            <div className="px-5 py-4 text-red-400 font-mono text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}

          {!error && jobs.length === 0 && !loading && (
            <div className="px-5 py-12 text-center text-zinc-600 font-mono text-sm">
              No cron jobs registered.
            </div>
          )}

          {jobs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800/60">
                    {['', 'Name', 'Schedule', 'Status', 'Last Run', 'Next Run', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-mono text-zinc-500 uppercase tracking-wider first:w-8">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job, i) => (
                    <tr
                      key={job.name}
                      onClick={() => navigate(`/jobs/${encodeURIComponent(job.name)}`)}
                      className="border-b border-zinc-800/40 hover:bg-zinc-800/30 cursor-pointer transition-colors group"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <td className="px-4 py-3.5 w-8">
                        <StatusDot running={job.running} />
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-sm text-zinc-100 group-hover:text-teal-400 transition-colors">
                          {job.name}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <code className="font-mono text-xs text-zinc-400 bg-zinc-800/60 px-2 py-1 rounded">
                          {job.cronExpression ?? '—'}
                        </code>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={job.running ? 'completed' : 'stopped'}>
                          {job.running ? 'active' : 'stopped'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <LastExecution job={job} />
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-zinc-400">
                        {job.running ? formatNextRun(job.nextRun) : '—'}
                      </td>
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Trigger now"
                            disabled={actioning === job.name}
                            onClick={() => action(job.name, () => triggerJob(job.name))}
                          >
                            <Zap className="w-3 h-3" />
                          </Button>
                          {job.running ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={actioning === job.name}
                              onClick={() => action(job.name, () => stopJob(job.name))}
                            >
                              <Square className="w-3 h-3" /> Stop
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={actioning === job.name}
                              onClick={() => action(job.name, () => startJob(job.name))}
                            >
                              <Play className="w-3 h-3" /> Start
                            </Button>
                          )}
                        </div>
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
