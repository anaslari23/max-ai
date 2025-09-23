import React, { useEffect, useState } from 'react';
import { MaxJarvisAPI } from '@/utils/MaxJarvisAPI';
import { Button } from '@/components/ui/button';

const StatusPanel: React.FC = () => {
  const api = new MaxJarvisAPI();
  const [status, setStatus] = useState<any>(null);
  const [system, setSystem] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    try {
      setLoading(true);
      const [s, sys] = await Promise.all([api.getStatus(), api.getSystemInfo()]);
      setStatus(s);
      setSystem(sys);
      try {
        const learn = await api.getLearningStatus();
        (window as any).__maxLearning = learn; // debug hook
        setLearning(learn);
      } catch {}
    } catch (e) {
      // ignore simple errors for panel
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 10000);
    return () => clearInterval(id);
  }, []);

  const [learning, setLearning] = useState<any>(null);

  return (
    <div className="w-full rounded-2xl border border-teal-500/20 bg-black/40 p-3 text-sm text-white/90 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-semibold text-teal-300">System Status</div>
        <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <div className="text-white/70">API</div>
          <div className="mt-1 rounded-lg border border-white/10 bg-black/30 p-2">
            <div>Status: {status?.status ?? 'unknown'}</div>
            <div className="text-xs opacity-60">Timestamp: {status?.timestamp ?? '-'}</div>
            <div className="mt-2 text-xs">
              Capabilities: {status?.capabilities?.slice(0, 6)?.join(', ') ?? '-'}
            </div>
          </div>
        </div>
        <div>
          <div className="text-white/70">System</div>
          <div className="mt-1 rounded-lg border border-white/10 bg-black/30 p-2">
            <div>CPU: {system?.status?.cpu_percent ?? 0}%</div>
            <div>RAM: {system?.status?.memory_percent ?? 0}%</div>
            <div>Disk: {system?.status?.disk_percent ?? 0}%</div>
            {system?.status?.battery && (
              <div>Battery: {system.status.battery.percent}% {system.status.battery.power_plugged ? '(Plugged)' : ''}</div>
            )}
          </div>
        </div>
      </div>

      {/* Learning */}
      <div className="mt-3">
        <div className="text-white/70">Learning</div>
        <div className="mt-1 rounded-lg border border-white/10 bg-black/30 p-2 text-xs">
          {learning ? (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <div>
                <div className="opacity-70">Total Feedback</div>
                <div className="text-white/90">{learning.total_count} • avg {(learning.avg_score || 0).toFixed(2)}</div>
              </div>
              <div>
                <div className="opacity-70">Last 24h</div>
                <div className="text-white/90">{learning.last_24h?.count ?? 0} • avg {(learning.last_24h?.avg_score || 0).toFixed(2)}</div>
              </div>
              <div>
                <div className="opacity-70">Top Models</div>
                <div className="text-white/90 truncate">{(learning.by_model || []).map((m: any) => `${m.model_type}:${(m.avg_score||0).toFixed(2)}(${m.count})`).join(', ') || '-'}</div>
              </div>
            </div>
          ) : (
            <div className="opacity-60">No feedback yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;
