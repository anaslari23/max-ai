import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MaxJarvisAPI } from '@/utils/MaxJarvisAPI';

interface FaceAuthProps {
  userId?: string;
  onVerified: () => void;
}

const FaceAuth: React.FC<FaceAuthProps> = ({ userId = 'default', onVerified }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'verify' | 'enroll'>('verify');
  const { toast } = useToast();
  const api = useRef(new MaxJarvisAPI());

  useEffect(() => {
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (e) {
        toast({
          title: 'Camera access denied',
          description: 'Please allow camera access to verify your identity.',
          variant: 'destructive',
        });
      }
    };
    start();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  const captureFrame = (): File | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/png');
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const file = new File([u8arr], 'frame.png', { type: mime });
    const blob = new Blob([u8arr], { type: mime });
    const url = URL.createObjectURL(blob);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(url);
    return file;
  };

  const handleVerify = async () => {
    setIsCapturing(true);
    const file = captureFrame();
    setIsCapturing(false);
    if (!file) return;
    setLoading(true);
    try {
      const result = await api.current.verifyFace(file, userId);
      if ((result as any).error) {
        toast({ title: 'Verification failed', description: (result as any).error, variant: 'destructive' });
        return;
      }
      const res = result as { verified: boolean; distance: number; threshold: number };
      if (res.verified) {
        toast({ title: 'Access granted', description: 'Identity verified successfully.' });
        onVerified();
      } else {
        toast({
          title: 'Not recognized',
          description: `Face mismatch (distance ${res.distance.toFixed(3)} > threshold ${res.threshold}). You may need to enroll first.`,
          variant: 'destructive',
        });
      }
    } catch (e: any) {
      toast({ title: 'Verification error', description: e?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    setIsCapturing(true);
    const file = captureFrame();
    setIsCapturing(false);
    if (!file) return;
    setLoading(true);
    try {
      const result = await api.current.enrollFace(file, userId);
      if ((result as any).error) {
        toast({ title: 'Enrollment failed', description: (result as any).error, variant: 'destructive' });
        return;
      }
      const res = result as { status: string; faces_added: number };
      if (res.status === 'enrolled') {
        toast({ title: 'Enrollment complete', description: `${res.faces_added} face encoding(s) saved.` });
        // Optional immediate verify
        await handleVerify();
      }
    } catch (e: any) {
      toast({ title: 'Enrollment error', description: e?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-teal-500/30 bg-black/60 p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-teal-300">Secure Access • Face Verification</h2>
          <div className="space-x-2">
            <Button variant={mode === 'verify' ? 'default' : 'outline'} size="sm" onClick={() => setMode('verify')}>
              Verify
            </Button>
            <Button variant={mode === 'enroll' ? 'default' : 'outline'} size="sm" onClick={() => setMode('enroll')}>
              Enroll
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="relative aspect-video overflow-hidden rounded-xl border border-teal-500/20 bg-black/40">
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          </div>
          <div className="relative aspect-video overflow-hidden rounded-xl border border-purple-500/20 bg-black/40">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white/50">No preview</div>
            )}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-end space-x-2">
          <Button onClick={mode === 'verify' ? handleVerify : handleEnroll} disabled={loading}>
            {loading ? 'Processing…' : mode === 'verify' ? 'Verify' : 'Enroll'}
          </Button>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default FaceAuth;
