import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Zap, Play, Square, RefreshCw,
  CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { fetchJobs, triggerJob, stopJob, startJob } from '@/api/jobs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatDate, formatDuration, formatNextRun, timeAgo } from '@/lib/utils';
import type { CronJob, JobExecution } from '@/types';

function StatusIcon({ status }: { status: JobExecution['status'] }) {
  if (status === 'completed') return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
  if (status === 'failed') return <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
  return <Loader2 className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />;
}

function ErrorRow({ error }: { error: string }) {
  const [open, setOpen] = useState(false);
  const firstLine = error.split('\n')[0];
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors font-mono"
      >
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {firstLine}
      </button>
      {open && (
        <pre className="mt-2 p-3 bg-red-500/5 border border-red-500/10 rounded text-xs font-mono text-red-400 overflow-x-auto whitespace-pre-wrap break-all">
          {error}
        </pre>
      )}
    </div>
  );
}

function StatCard({ label, value, color = 'text-zinc-100' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="px-5 py-4 border border-zinc-800 rounded-lg bg-zinc-900">
      <div className={`font-mono text-2xl font-semibold ${color}`}>{value}</div>
      <div className="text-zinc-500 text-xs mt-1">{label}</div>
    </div>
  );
}

export default function JobDetailPage() {
  const { name } = useParams<{ name: string }>();
  const decodedName = decodeURIComponent(name ?? '');

  const [job, setJob] = useState<CronJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioning, setActioning] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchJobs();
      const found = data.cron.find(j => j.name === decodedName) ?? null;
      setJob(found);
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

  const history = job ? [...job.history].reverse() : [];
  const total = history.length;
  const succeeded = history.filter(h => h.status === 'completed').length;
  const failed = history.filter(h => h.status === 'failed').length;
  const avgDuration = (() => {
    const finished = history.filter(h => h.finishedAt);
    if (!finished.length) return '—';
    const avg = finished.reduce((acc, h) => acc + (new Date(h.finishedAt!).getTime() - new Date(h.startedAt).getTime()), 0) / finished.length;
    return avg < 1000 ? `${Math.round(avg)}ms` : `${(avg / 1000).toFixed(2)}s`;
  })();

  if (loading) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen grid-bg flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-400 font-mono">Job not found: <span className="text-zinc-200">{decodedName}</span></p>
        <Link to="/" className="text-teal-400 hover:text-teal-300 text-sm font-mono flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-bg">
      {/* Header */}
      <header className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors text-sm font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              onClick={() => doAction(() => triggerJob(decodedName))}
              disabled={actioning}
            >
              <Zap className="w-3.5 h-3.5" /> Trigger
            </Button>
            {job.running ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => doAction(() => stopJob(decodedName))}
                disabled={actioning}
              >
                <Square className="w-3.5 h-3.5" /> Stop
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => doAction(() => startJob(decodedName))}
                disabled={actioning}
              >
                <Play className="w-3.5 h-3.5" /> Start
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6 animate-fade-in">
        {/* Job identity */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-xl font-semibold text-zinc-100">{job.name}</h1>
            <Badge variant={job.running ? 'completed' : 'stopped'}>
              {job.running ? 'active' : 'stopped'}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            {job.cronExpression && (
              <code className="font-mono text-sm text-teal-400 bg-teal-500/5 border border-teal-500/10 px-2.5 py-1 rounded">
                {job.cronExpression}
              </code>
            )}
            {job.running && (
              <span className="text-zinc-500 font-mono text-xs">
                next: {formatNextRun(job.nextRun)}
              </span>
            )}
          </div>
        </div>

        {error && (
          <p className="text-red-400 font-mono text-sm">{error}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Runs" value={total} />
          <StatCard label="Succeeded" value={succeeded} color="text-emerald-400" />
          <StatCard
            label="Failed"
            value={failed}
            color={failed > 0 ? 'text-red-400' : 'text-zinc-100'}
          />
          <StatCard label="Avg Duration" value={avgDuration} color="text-teal-400" />
        </div>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle>Execution History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {history.length === 0 ? (
              <p className="px-5 py-10 text-center text-zinc-600 font-mono text-sm">No executions recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800/60">
                      {['#', 'Started', 'Duration', 'Status'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-mono text-zinc-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((exec, i) => (
                      <tr key={exec.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs text-zinc-600">
                          {total - i}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-zinc-300">
                          {formatDate(exec.startedAt)}
                          <span className="text-zinc-600 ml-2">({timeAgo(exec.startedAt)})</span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-zinc-400">
                          {formatDuration(exec.startedAt, exec.finishedAt)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-start gap-2">
                            <div className="flex items-center gap-2 pt-0.5">
                              <StatusIcon status={exec.status} />
                              <Badge variant={exec.status}>{exec.status}</Badge>
                            </div>
                          </div>
                          {exec.error && <ErrorRow error={exec.error} />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
