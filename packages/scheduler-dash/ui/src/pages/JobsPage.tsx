import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Timer, Activity, AlertTriangle, Zap, Sun, Moon, ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { fetchJobs, triggerJob } from '@/api/jobs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ExecutionsChart } from '@/components/ExecutionsChart';
import { timeAgo, formatNextRun } from '@/lib/utils';
import { useTheme } from '@/contexts/theme';
import type { CronJob, JobsResponse } from '@/types';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

type SortKey = 'name' | 'schedule' | 'status' | 'lastRun' | 'nextRun';
type SortDir = 'asc' | 'desc';

function sortJobs(jobs: CronJob[], key: SortKey, dir: SortDir): CronJob[] {
  return [...jobs].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case 'name':
        cmp = a.name.localeCompare(b.name);
        break;
      case 'schedule':
        cmp = (a.cronExpression ?? '').localeCompare(b.cronExpression ?? '');
        break;
      case 'status':
        cmp = (a.running ? 'active' : 'stopped').localeCompare(b.running ? 'active' : 'stopped');
        break;
      case 'lastRun': {
        const at = a.history.at(-1)?.startedAt ?? '';
        const bt = b.history.at(-1)?.startedAt ?? '';
        cmp = at.localeCompare(bt);
        break;
      }
      case 'nextRun':
        cmp = (a.nextRun ?? '').localeCompare(b.nextRun ?? '');
        break;
    }
    return dir === 'asc' ? cmp : -cmp;
  });
}

function SortableHeader({
  label, sortKey, active, dir, onClick,
}: {
  label: string;
  sortKey: SortKey;
  active: boolean;
  dir: SortDir;
  onClick: (k: SortKey) => void;
}) {
  return (
    <th className="px-4 py-3 text-left text-xs font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
      <button
        onClick={() => onClick(sortKey)}
        className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors group"
      >
        {label}
        <span className={active ? 'text-teal-500 dark:text-teal-400' : 'text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-400 dark:group-hover:text-zinc-400'}>
          {active
            ? (dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
            : <ChevronsUpDown className="w-3 h-3" />}
        </span>
      </button>
    </th>
  );
}

function StatusDot({ running }: { running: boolean }) {
  if (!running) return <span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600 inline-block" />;
  return (
    <span className="relative inline-flex w-2 h-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
    </span>
  );
}

function LastExecution({ job }: { job: CronJob }) {
  const last = job.history[job.history.length - 1];
  if (!last) return <span className="text-zinc-400 dark:text-zinc-600 font-mono text-xs">—</span>;
  return (
    <div className="flex items-center gap-2">
      <Badge variant={last.status}>{last.status}</Badge>
      <span className="text-zinc-400 dark:text-zinc-500 font-mono text-xs">{timeAgo(last.startedAt)}</span>
    </div>
  );
}

function Pagination({
  page, pageCount, pageSize, total,
  onPage, onPageSize,
}: {
  page: number;
  pageCount: number;
  pageSize: PageSize;
  total: number;
  onPage: (p: number) => void;
  onPageSize: (s: PageSize) => void;
}) {
  const from = Math.min((page - 1) * pageSize + 1, total);
  const to = Math.min(page * pageSize, total);

  return (
    <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 font-mono">
        <span>Rows per page:</span>
        {PAGE_SIZE_OPTIONS.map(s => (
          <button
            key={s}
            onClick={() => onPageSize(s)}
            className={`px-2 py-0.5 rounded transition-colors ${
              s === pageSize
                ? 'bg-teal-500/10 text-teal-500 dark:text-teal-400 border border-teal-500/20'
                : 'hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 dark:text-zinc-500">
        <span>{total === 0 ? '0' : `${from}–${to}`} of {total}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`w-6 h-6 rounded text-xs transition-colors ${
                p === page
                  ? 'bg-teal-500 text-white font-semibold'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => onPage(page + 1)}
            disabled={page >= pageCount}
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function JobsPage() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [data, setData] = useState<JobsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

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

  function handlePageSize(s: PageSize) {
    setPageSize(s);
    setPage(1);
  }

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  }

  const jobs = data?.cron ?? [];
  const totalFailed = jobs.reduce((acc, j) => acc + j.history.filter(h => h.status === 'failed').length, 0);
  const activeJobs = jobs.filter(j => j.running).length;
  const sortedJobs = sortJobs(jobs, sortKey, sortDir);
  const pageCount = Math.max(1, Math.ceil(sortedJobs.length / pageSize));
  const pagedJobs = sortedJobs.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="min-h-screen grid-bg">
      {/* Header */}
      <header className="border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <Timer className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              scheduler<span className="text-teal-400">.</span>dash
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-zinc-400 dark:text-zinc-600 font-mono text-xs">
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
            <Button variant="ghost" size="icon" onClick={toggle} title="Toggle theme">
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Jobs', value: jobs.length, icon: Timer, color: 'text-zinc-500 dark:text-zinc-400' },
            { label: 'Active', value: activeJobs, icon: Activity, color: 'text-emerald-500 dark:text-emerald-400' },
            { label: 'Failed Executions', value: totalFailed, icon: AlertTriangle, color: totalFailed > 0 ? 'text-red-500 dark:text-red-400' : 'text-zinc-500 dark:text-zinc-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="px-5 py-4 flex items-center gap-4">
              <Icon className={`w-5 h-5 shrink-0 ${color}`} />
              <div>
                <div className={`font-mono text-2xl font-semibold ${color}`}>{value}</div>
                <div className="text-zinc-400 dark:text-zinc-500 text-xs mt-0.5">{label}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Executions chart */}
        <Card>
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Executions</h2>
          </div>
          <div className="px-5 py-4">
            <ExecutionsChart jobs={jobs} />
          </div>
        </Card>

        {/* Jobs table */}
        <Card>
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Cron Jobs</h2>
            <span className="text-zinc-400 dark:text-zinc-600 font-mono text-xs">{jobs.length} registered</span>
          </div>

          {error && (
            <div className="px-5 py-4 text-red-400 font-mono text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}

          {!error && jobs.length === 0 && !loading && (
            <div className="px-5 py-12 text-center text-zinc-400 dark:text-zinc-600 font-mono text-sm">
              No cron jobs registered.
            </div>
          )}

          {jobs.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800/60">
                      <th className="px-4 py-3 w-8" />
                      <SortableHeader label="Name"     sortKey="name"     active={sortKey === 'name'}     dir={sortDir} onClick={handleSort} />
                      <SortableHeader label="Schedule" sortKey="schedule" active={sortKey === 'schedule'} dir={sortDir} onClick={handleSort} />
                      <SortableHeader label="Status"   sortKey="status"   active={sortKey === 'status'}   dir={sortDir} onClick={handleSort} />
                      <SortableHeader label="Last Run" sortKey="lastRun"  active={sortKey === 'lastRun'}  dir={sortDir} onClick={handleSort} />
                      <SortableHeader label="Next Run" sortKey="nextRun"  active={sortKey === 'nextRun'}  dir={sortDir} onClick={handleSort} />
                      <th className="px-4 py-3 text-left text-xs font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedJobs.map((job, i) => (
                      <tr
                        key={job.name}
                        onClick={() => navigate(`/jobs/${encodeURIComponent(job.name)}`)}
                        className="border-b border-zinc-100 dark:border-zinc-800/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 cursor-pointer transition-colors group"
                        style={{ animationDelay: `${i * 40}ms` }}
                      >
                        <td className="px-4 py-3.5 w-8">
                          <StatusDot running={job.running} />
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-teal-500 dark:group-hover:text-teal-400 transition-colors">
                            {job.name}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <code className="font-mono text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/60 px-2 py-1 rounded">
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
                        <td className="px-4 py-3.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                          {job.running ? formatNextRun(job.nextRun) : '—'}
                        </td>
                        <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Trigger now"
                            disabled={actioning === job.name}
                            onClick={() => action(job.name, () => triggerJob(job.name))}
                          >
                            <Zap className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={page}
                pageCount={pageCount}
                pageSize={pageSize}
                total={sortedJobs.length}
                onPage={setPage}
                onPageSize={handlePageSize}
              />
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
