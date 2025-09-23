import React, { useEffect, useState } from 'react';
import { MaxJarvisAPI } from '@/utils/MaxJarvisAPI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const FilesPanel: React.FC = () => {
  const api = new MaxJarvisAPI();
  const [cwd, setCwd] = useState<string>('.');
  const [items, setItems] = useState<Array<{ name: string; is_dir: boolean; size: number }>>([]);
  const [newPath, setNewPath] = useState<string>('notes/today.txt');
  const [content, setContent] = useState<string>('');
  const [searchQ, setSearchQ] = useState<string>('');
  const [searchMatches, setSearchMatches] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setBusy(true);
    try {
      const res: any = await api.filesList(cwd);
      if (!res.error) setItems(res.items || []);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { refresh(); }, [cwd]);

  const createFile = async () => {
    if (!newPath.trim()) return;
    setBusy(true);
    try {
      const res: any = await api.filesCreate({ path: newPath, content, overwrite: true });
      setCwd('.');
      setContent('');
      setNewPath('notes/today.txt');
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const deleteItem = async (name: string) => {
    setBusy(true);
    try {
      await api.filesDelete({ path: `${cwd}/${name}`.replace('./', '') });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const openDir = (name: string) => {
    if (name === '..') {
      if (cwd === '.' || cwd === '') return;
      const parts = cwd.split('/').filter(Boolean);
      parts.pop();
      setCwd(parts.length ? parts.join('/') : '.');
    } else {
      setCwd(cwd === '.' ? name : `${cwd}/${name}`);
    }
  };

  const search = async () => {
    if (!searchQ.trim()) return;
    setBusy(true);
    try {
      const res: any = await api.filesSearch({ query: searchQ, path: cwd });
      setSearchMatches(res.matches || []);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-blue-500/20 bg-black/40 p-3 text-sm text-white/90 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-semibold text-blue-300">Files</div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={busy}>{busy ? 'Working…' : 'Refresh'}</Button>
        </div>
      </div>

      <div className="mb-2 flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => openDir('..')}>Up</Button>
        <div className="truncate text-xs text-white/70">{cwd}</div>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/30 p-2">
        {items.length === 0 ? (
          <div className="text-white/50">Empty</div>
        ) : (
          <ul className="space-y-1">
            {items.map((it) => (
              <li key={it.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <button className="underline text-blue-300" onClick={() => it.is_dir ? openDir(it.name) : undefined}>
                    {it.is_dir ? `[${it.name}]` : it.name}
                  </button>
                  {!it.is_dir && <span className="opacity-60">{it.size} B</span>}
                </div>
                {!it.is_dir && (
                  <Button size="sm" variant="ghost" onClick={() => deleteItem(it.name)}>Delete</Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <div className="text-white/70">Create / Overwrite File</div>
          <Input className="focus:outline-none focus:ring-1 focus:ring-blue-500/30" placeholder="path (e.g., notes/today.txt)" value={newPath} onChange={(e) => setNewPath(e.target.value)} />
          <textarea className="h-24 w-full rounded-md border border-white/10 bg-black/30 p-2 focus:outline-none focus:ring-1 focus:ring-blue-500/30" placeholder="content" value={content} onChange={(e) => setContent(e.target.value)} />
          <Button onClick={createFile} disabled={busy || !newPath.trim()}>{busy ? 'Saving…' : 'Save File'}</Button>
        </div>
        <div className="space-y-2">
          <div className="text-white/70">Search</div>
          <div className="flex gap-2">
            <Input className="focus:outline-none focus:ring-1 focus:ring-blue-500/30" placeholder="filename contains…" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} />
            <Button onClick={search} disabled={busy || !searchQ.trim()}>Search</Button>
          </div>
          <div className="rounded-md border border-white/10 bg-black/30 p-2 text-xs">
            {searchMatches.length === 0 ? (
              <div className="text-white/50">No matches</div>
            ) : (
              <ul className="list-disc pl-4">
                {searchMatches.map((m) => (<li key={m}>{m}</li>))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilesPanel;
