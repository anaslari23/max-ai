import React, { useEffect, useState } from 'react';
import { MaxJarvisAPI } from '@/utils/MaxJarvisAPI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SystemControlPanel: React.FC = () => {
  const api = new MaxJarvisAPI();
  const [appName, setAppName] = useState('');
  const [taskName, setTaskName] = useState('Morning Reminder');
  const [taskTime, setTaskTime] = useState('09:00');
  const [running, setRunning] = useState<any[]>([]);
  const [info, setInfo] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      setBusy(true);
      const [apps, sys] = await Promise.all([
        api.getRunningApplications(),
        api.getSystemInfo(),
      ]);
      setRunning(apps?.apps ?? []);
      setInfo(sys);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const openApp = async () => {
    if (!appName.trim()) return;
    try {
      setBusy(true);
      await api.openApplication(appName.trim());
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const schedule = async () => {
    try {
      setBusy(true);
      await api.scheduleTask(taskName || 'Task', 'daily', taskTime || '09:00');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-purple-500/20 bg-black/40 p-3 text-sm text-white/90 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-semibold text-purple-300">System Controls</div>
        <Button size="sm" variant="outline" onClick={refresh} disabled={busy}>
          {busy ? 'Working…' : 'Refresh'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <div className="text-white/70">Open Application</div>
          <div className="flex gap-2">
            <Input className="focus:outline-none focus:ring-1 focus:ring-purple-500/30" placeholder="e.g., Chrome" value={appName} onChange={(e) => setAppName(e.target.value)} />
            <Button onClick={openApp} disabled={busy || !appName.trim()}>Open</Button>
          </div>
          <div className="text-xs opacity-60">Try common app names (Chrome, Safari, Spotify, VS Code)</div>
        </div>

        <div className="space-y-2">
          <div className="text-white/70">Schedule Daily Task</div>
          <div className="flex gap-2">
            <Input className="focus:outline-none focus:ring-1 focus:ring-purple-500/30" placeholder="Task name" value={taskName} onChange={(e) => setTaskName(e.target.value)} />
            <Input className="w-28 focus:outline-none focus:ring-1 focus:ring-purple-500/30" placeholder="HH:MM" value={taskTime} onChange={(e) => setTaskTime(e.target.value)} />
            <Button onClick={schedule} disabled={busy}>Schedule</Button>
          </div>
          <div className="text-xs opacity-60">This uses /api/schedule/task with daily cadence.</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <div className="text-white/70">Running Apps</div>
          <div className="mt-1 max-h-44 overflow-auto rounded-lg border border-white/10 bg-black/30 p-2">
            {running.length === 0 ? (
              <div className="text-white/50">No data</div>
            ) : (
              <ul className="space-y-1">
                {running.slice(0, 12).map((a) => (
                  <li key={`${a.pid}-${a.name}`} className="flex justify-between text-xs">
                    <span className="truncate pr-2">{a.name}</span>
                    <span className="opacity-60">CPU {a.cpu_percent}% • RAM {a.memory_percent}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div>
          <div className="text-white/70">Quick System Info</div>
          <div className="mt-1 rounded-lg border border-white/10 bg-black/30 p-2 text-xs">
            <div>Platform: {info?.system?.platform ?? '-'}</div>
            <div>OS: {info?.system?.system ?? '-'} {info?.system?.release ?? ''}</div>
            <div>CPU Cores: {info?.hardware?.cpu_count ?? '-'}</div>
            <div>Total RAM: {info?.hardware?.memory_total ?? '-'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemControlPanel;
