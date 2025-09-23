import React, { useState } from 'react';
import { MaxJarvisAPI } from '@/utils/MaxJarvisAPI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SearchResult {
  source: string;
  title: string;
  url: string;
  snippet: string;
}

const WebSearchPanel: React.FC = () => {
  const api = new MaxJarvisAPI();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const performSearch = async () => {
    if (!query.trim()) return;
    try {
      setLoading(true);
      setSummary('');
      const res = await api.webSearch(query.trim(), 5);
      setResults(res.results || []);
    } finally {
      setLoading(false);
    }
  };

  const summarize = async (item: SearchResult) => {
    try {
      setLoading(true);
      setSummary('');
      const res: any = await api.webSummarize({ url: item.url, max_sentences: 5 });
      if (res.summary) setSummary(res.summary);
      else if (res.error) setSummary(`Error: ${res.error}`);
      else setSummary('No summary available.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-cyan-500/20 bg-black/40 p-3 text-sm text-white/90 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-semibold text-cyan-300">Web Search</div>
      </div>

      <div className="mb-3 flex gap-2">
        <Input className="focus:outline-none focus:ring-1 focus:ring-cyan-500/30" placeholder="Search the web (e.g., Quantum computing)" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Button onClick={performSearch} disabled={loading || !query.trim()}>
          {loading ? 'Searching…' : 'Search'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {results.length === 0 ? (
          <div className="text-white/50">No results</div>
        ) : (
          results.map((r, idx) => (
            <div key={`${idx}-${r.title}`} className="rounded-lg border border-white/10 bg-black/30 p-2">
              <div className="flex items-center justify-between">
                <div className="font-medium text-white/90 truncate pr-2">{r.title}</div>
                {r.url && (
                  <Button size="sm" variant="outline" onClick={() => summarize(r)} disabled={loading}>
                    Summarize
                  </Button>
                )}
              </div>
              {r.url && (
                <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-cyan-300 underline">
                  {r.url}
                </a>
              )}
              {r.snippet && <div className="mt-1 text-xs opacity-80">{r.snippet}</div>}
            </div>
          ))
        )}
      </div>

      {summary && (
        <div className="mt-3 rounded-lg border border-white/10 bg-black/30 p-2">
          <div className="mb-1 text-white/70">Summary</div>
          <div className="text-sm">{summary}</div>
        </div>
      )}
    </div>
  );
};

export default WebSearchPanel;
