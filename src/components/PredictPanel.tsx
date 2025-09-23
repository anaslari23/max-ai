import React, { useEffect, useState } from 'react';
import { MaxJarvisAPI } from '@/utils/MaxJarvisAPI';
import { Button } from '@/components/ui/button';

interface Proposal {
  id: string;
  title: string;
  description: string;
  action: any;
  created_at: string;
}

const PredictPanel: React.FC = () => {
  const api = new MaxJarvisAPI();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      setBusy(true);
      const res: any = await api.getProposals();
      setProposals(res.proposals || []);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 60_000); // refresh every minute
    return () => clearInterval(id);
  }, []);

  const ack = async (p: Proposal, decision: 'accept' | 'skip') => {
    try {
      setBusy(true);
      const res: any = await api.ackProposal({ id: p.id, decision, action: p.action });
      // Remove acknowledged proposal from list
      setProposals(prev => prev.filter(x => x.id !== p.id));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-rose-500/20 bg-black/40 p-3 text-sm text-white/90 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-semibold text-rose-300">Predictive Suggestions</div>
        <Button size="sm" variant="outline" onClick={refresh} disabled={busy}>
          {busy ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      <div className="space-y-2">
        {proposals.length === 0 ? (
          <div className="text-white/50">No proposals at the moment</div>
        ) : (
          proposals.map((p) => (
            <div key={p.id} className="rounded-lg border border-white/10 bg-black/30 p-2">
              <div className="flex items-center justify-between">
                <div className="font-medium text-white/90 pr-2 truncate">{p.title}</div>
                <div className="text-xs opacity-60">{new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div className="mt-1 text-xs opacity-80">{p.description}</div>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => ack(p, 'accept')} disabled={busy}>Accept</Button>
                <Button size="sm" variant="outline" onClick={() => ack(p, 'skip')} disabled={busy}>Skip</Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PredictPanel;
