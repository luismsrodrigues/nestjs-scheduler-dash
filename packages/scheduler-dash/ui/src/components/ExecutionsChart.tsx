import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { useTheme } from '@/contexts/theme';
import type { CronJob } from '@/types';

interface Bucket {
  label: string;
  completed: number;
  failed: number;
}

function buildBuckets(jobs: CronJob[]): Bucket[] {
  const allExecutions = jobs.flatMap(j => j.history).filter(e => e.status !== 'running');
  if (allExecutions.length === 0) return [];

  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000; // last 24 hours
  const bucketCount = 24;
  const bucketMs = windowMs / bucketCount;
  const start = now - windowMs;

  const buckets: Bucket[] = Array.from({ length: bucketCount }, (_, i) => {
    const bucketStart = new Date(start + i * bucketMs);
    return {
      label: bucketStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      completed: 0,
      failed: 0,
    };
  });

  for (const exec of allExecutions) {
    const t = new Date(exec.startedAt).getTime();
    if (t < start) continue;
    const idx = Math.min(Math.floor((t - start) / bucketMs), bucketCount - 1);
    if (exec.status === 'completed') buckets[idx].completed++;
    else if (exec.status === 'failed') buckets[idx].failed++;
  }

  return buckets;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 shadow-md text-xs font-mono">
      <p className="text-zinc-500 dark:text-zinc-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

interface ExecutionsChartProps {
  jobs: CronJob[];
}

export function ExecutionsChart({ jobs }: ExecutionsChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const buckets = buildBuckets(jobs);

  const axisColor = isDark ? '#52525b' : '#a1a1aa';
  const gridColor = isDark ? '#27272a' : '#f4f4f5';

  const totalCompleted = buckets.reduce((s, b) => s + b.completed, 0);
  const totalFailed = buckets.reduce((s, b) => s + b.failed, 0);

  if (buckets.length === 0 || (totalCompleted === 0 && totalFailed === 0)) {
    return (
      <div className="h-36 flex items-center justify-center text-zinc-400 dark:text-zinc-600 font-mono text-sm">
        No executions in the last 24 hours.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={buckets} barSize={8} barGap={2} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={gridColor} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: axisColor }}
          tickLine={false}
          axisLine={false}
          interval={3}
        />
        <YAxis
          tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: axisColor }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? '#ffffff08' : '#00000006' }} />
        <Legend
          iconType="circle"
          iconSize={6}
          wrapperStyle={{ fontSize: 10, fontFamily: 'IBM Plex Mono', paddingTop: 4 }}
        />
        <Bar dataKey="completed" name="completed" fill="#10b981" radius={[2, 2, 0, 0]} />
        <Bar dataKey="failed" name="failed" fill="#f87171" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
