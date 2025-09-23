import React, { useEffect, useMemo, useState } from 'react';
import { MaxJarvisAPI } from '@/utils/MaxJarvisAPI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PreferencesPanel: React.FC = () => {
  const api = new MaxJarvisAPI();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [backendUrl, setBackendUrl] = useState('');

  // Voice settings
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState('');
  const [rate, setRate] = useState(0.95);
  const [pitch, setPitch] = useState(1.0);
  // Voice-first assistant options
  const [enableChime, setEnableChime] = useState(true);
  const [chimeVolume, setChimeVolume] = useState(0.2);
  const [autoListenAfterWake, setAutoListenAfterWake] = useState(true);
  const [allowBargeIn, setAllowBargeIn] = useState(true);
  const [silenceTimeoutMs, setSilenceTimeoutMs] = useState(12000);

  // Personality / tone
  const [persona, setPersona] = useState('professional');

  const loadVoices = () => {
    const list = window.speechSynthesis.getVoices();
    setVoices(list);
  };

  useEffect(() => {
    loadVoices();
    if (typeof speechSynthesis !== 'undefined' && 'onvoiceschanged' in speechSynthesis) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
    try {
      const stored = window.localStorage.getItem('max_backend_url');
      if (stored) setBackendUrl(stored);
      else setBackendUrl(api['baseUrl'] || 'http://localhost:5001');
    } catch {}
  }, []);

  const fetchPrefs = async () => {
    try {
      setLoading(true);
      const res = await api.getUserPreferences('default');
      const prefs = res.preferences || {};
      if (prefs.voice_name) setVoiceName(prefs.voice_name);
      if (prefs.voice_rate) setRate(parseFloat(prefs.voice_rate));
      if (prefs.voice_pitch) setPitch(parseFloat(prefs.voice_pitch));
      if (prefs.persona) setPersona(prefs.persona);
      if (prefs.enable_chime) setEnableChime(String(prefs.enable_chime).toLowerCase() !== 'false');
      if (prefs.chime_volume) setChimeVolume(parseFloat(prefs.chime_volume));
      if (prefs.auto_listen_after_wake) setAutoListenAfterWake(String(prefs.auto_listen_after_wake).toLowerCase() !== 'false');
      if (prefs.allow_barge_in) setAllowBargeIn(String(prefs.allow_barge_in).toLowerCase() !== 'false');
      if (prefs.silence_timeout_ms) setSilenceTimeoutMs(parseInt(prefs.silence_timeout_ms, 10));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrefs();
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      // Save backend URL locally and update API instance
      if (backendUrl && backendUrl.startsWith('http')) {
        try {
          api.setBaseUrl(backendUrl);
        } catch {}
      }
      await api.setUserPreferences(
        {
          voice_name: voiceName,
          voice_rate: String(rate),
          voice_pitch: String(pitch),
          persona,
          enable_chime: String(enableChime),
          chime_volume: String(chimeVolume),
          auto_listen_after_wake: String(autoListenAfterWake),
          allow_barge_in: String(allowBargeIn),
          silence_timeout_ms: String(silenceTimeoutMs),
        },
        'default'
      );
    } finally {
      setSaving(false);
    }
  };

  const voiceOptions = useMemo(
    () => voices.map((v) => ({ name: v.name, lang: v.lang })),
    [voices]
  );

  return (
    <div className="w-full rounded-2xl border border-amber-500/20 bg-black/40 p-3 text-sm text-white/90 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-semibold text-amber-300">Preferences</div>
        <div className="space-x-2">
          <Button size="sm" variant="outline" onClick={fetchPrefs} disabled={loading}>
            {loading ? 'Loading…' : 'Reload'}
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <div className="text-white/70">Backend</div>
          <div className="text-xs text-white/60">Set the API base URL. On Android, enter your computer's LAN IP like http://192.168.0.186:5001</div>
          <Input
            className="w-full"
            placeholder="http://192.168.0.186:5001"
            value={backendUrl}
            onChange={(e) => setBackendUrl(e.target.value)}
          />
          <div className="text-xs text-white/50">Current: {backendUrl || 'http://localhost:5001'}</div>
        </div>
        <div className="space-y-2">
          <div className="text-white/70">Voice</div>
          <select
            className="w-full rounded-md border border-white/10 bg-black/30 p-2 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
          >
            <option value="">System default</option>
            {voiceOptions.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} • {v.lang}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <label className="w-24 text-xs text-white/60">Rate</label>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.05}
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="flex-1"
            />
            <Input className="w-20 focus:outline-none focus:ring-1 focus:ring-amber-500/30" value={rate} onChange={(e) => setRate(parseFloat(e.target.value || '1'))} />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-24 text-xs text-white/60">Pitch</label>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.05}
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="flex-1"
            />
            <Input className="w-20 focus:outline-none focus:ring-1 focus:ring-amber-500/30" value={pitch} onChange={(e) => setPitch(parseFloat(e.target.value || '1'))} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-white/70">Persona / Tone</div>
          <select
            className="w-full rounded-md border border-white/10 bg-black/30 p-2 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
          >
            <option value="professional">Professional</option>
            <option value="concierge">Concierge</option>
            <option value="friendly">Friendly</option>
            <option value="witty">Witty</option>
            <option value="formal">Formal</option>
          </select>
          <div className="text-xs opacity-60">Personality settings can shape MAX responses.</div>
        </div>

        <div className="space-y-2">
          <div className="text-white/70">Voice UX</div>
          <div className="flex items-center justify-between rounded-md border border-white/10 bg-black/30 p-2">
            <div>
              <div className="text-sm">Wake/Listen Chimes</div>
              <div className="text-xs text-white/60">Audible cues when waking or entering listening mode</div>
            </div>
            <input type="checkbox" checked={enableChime} onChange={(e) => setEnableChime(e.target.checked)} />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-40 text-xs text-white/60">Chime Volume</label>
            <input type="range" min={0} max={1} step={0.01} value={chimeVolume} onChange={(e) => setChimeVolume(parseFloat(e.target.value))} className="flex-1" />
            <Input className="w-20" value={chimeVolume} onChange={(e) => setChimeVolume(parseFloat(e.target.value || '0.2'))} />
          </div>
          <div className="flex items-center justify-between rounded-md border border-white/10 bg-black/30 p-2">
            <div>
              <div className="text-sm">Auto-listen after wake</div>
              <div className="text-xs text-white/60">Skip spoken wake response and immediately listen</div>
            </div>
            <input type="checkbox" checked={autoListenAfterWake} onChange={(e) => setAutoListenAfterWake(e.target.checked)} />
          </div>
          <div className="flex items-center justify-between rounded-md border border-white/10 bg-black/30 p-2">
            <div>
              <div className="text-sm">Allow barge-in</div>
              <div className="text-xs text-white/60">Saying 'Hey Max' interrupts speech to listen</div>
            </div>
            <input type="checkbox" checked={allowBargeIn} onChange={(e) => setAllowBargeIn(e.target.checked)} />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-40 text-xs text-white/60">Silence timeout (ms)</label>
            <Input className="w-32" value={silenceTimeoutMs} onChange={(e) => setSilenceTimeoutMs(parseInt(e.target.value || '12000', 10))} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesPanel;
