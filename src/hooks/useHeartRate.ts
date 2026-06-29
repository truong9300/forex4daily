import { useRef, useState, useCallback, useEffect } from 'react';

export interface LogEntry {
  id: string;
  bpm: number;
  timestamp: Date;
  duration: number;
}

const BUFFER_SIZE = 180; // 6s at 30fps
const MIN_PEAK_DISTANCE_FRAMES = 9; // ~300ms at 30fps

function smooth(arr: number[], halfWin: number): number[] {
  return arr.map((_, i) => {
    const lo = Math.max(0, i - halfWin);
    const hi = Math.min(arr.length - 1, i + halfWin);
    let sum = 0;
    for (let j = lo; j <= hi; j++) sum += arr[j];
    return sum / (hi - lo + 1);
  });
}

function detectBpm(redBuf: number[], timeBuf: number[]): number | null {
  if (redBuf.length < 60) return null;

  const sig = smooth(redBuf, 4);
  const mean = sig.reduce((a, b) => a + b, 0) / sig.length;
  const max = Math.max(...sig);
  const threshold = mean + (max - mean) * 0.35;

  const peaks: number[] = [];
  for (let i = 1; i < sig.length - 1; i++) {
    if (
      sig[i] > threshold &&
      sig[i] >= sig[i - 1] &&
      sig[i] >= sig[i + 1]
    ) {
      if (peaks.length === 0 || i - peaks[peaks.length - 1] > MIN_PEAK_DISTANCE_FRAMES) {
        peaks.push(i);
      }
    }
  }

  if (peaks.length < 2) return null;

  const intervals: number[] = [];
  for (let i = 1; i < peaks.length; i++) {
    const dt = timeBuf[peaks[i]] - timeBuf[peaks[i - 1]];
    if (dt > 300 && dt < 1500) intervals.push(dt);
  }
  if (intervals.length < 1) return null;

  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const bpm = Math.round(60000 / avg);
  return bpm >= 40 && bpm <= 200 ? bpm : null;
}

export function useHeartRate() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const scCanvasRef = useRef<HTMLCanvasElement | null>(null); // sampling canvas

  const redBufRef = useRef<number[]>([]);
  const timeBufRef = useRef<number[]>([]);
  const lastUpdateRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const bpmRef = useRef<number | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [bpm, setBpm] = useState<number | null>(null);
  const [signal, setSignal] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [log, setLog] = useState<LogEntry[]>(() => {
    try {
      const raw = localStorage.getItem('hr-log');
      if (raw) {
        return (JSON.parse(raw) as LogEntry[]).map(e => ({
          ...e,
          timestamp: new Date(e.timestamp),
        }));
      }
    } catch { /* empty */ }
    return [];
  });

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    try {
      localStorage.setItem('hr-log', JSON.stringify(log));
    } catch { /* empty */ }
  }, [log]);

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(processFrame);
      return;
    }

    if (!scCanvasRef.current) {
      const c = document.createElement('canvas');
      c.width = 32;
      c.height = 32;
      scCanvasRef.current = c;
    }

    const sc = scCanvasRef.current;
    const ctx = sc.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(video, 0, 0, 32, 32);
    const { data } = ctx.getImageData(0, 0, 32, 32);

    let redSum = 0;
    for (let i = 0; i < data.length; i += 4) redSum += data[i];
    const avgRed = redSum / (32 * 32);

    const now = Date.now();
    redBufRef.current.push(avgRed);
    timeBufRef.current.push(now);

    if (redBufRef.current.length > BUFFER_SIZE) {
      redBufRef.current.shift();
      timeBufRef.current.shift();
    }

    if (now - lastUpdateRef.current > 150) {
      setSignal([...redBufRef.current]);

      const newBpm = detectBpm(redBufRef.current, timeBufRef.current);
      if (newBpm !== null) setBpm(newBpm);

      lastUpdateRef.current = now;
    }

    rafRef.current = requestAnimationFrame(processFrame);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setBpm(null);
    setSignal([]);
    redBufRef.current = [];
    timeBufRef.current = [];
    scCanvasRef.current = null;
    lastUpdateRef.current = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 320 },
          height: { ideal: 240 },
          frameRate: { ideal: 30 },
        },
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }

      const track = stream.getVideoTracks()[0];
      try {
        await track.applyConstraints({ advanced: [{ torch: true } as MediaTrackConstraintSet] });
        setTorchEnabled(true);
      } catch {
        setTorchEnabled(false);
      }

      startTimeRef.current = Date.now();
      setIsActive(true);
      rafRef.current = requestAnimationFrame(processFrame);
    } catch (err: unknown) {
      const e = err as DOMException;
      if (e.name === 'NotAllowedError') {
        setError('Vui lòng cấp quyền truy cập camera');
      } else if (e.name === 'NotFoundError') {
        setError('Không tìm thấy camera');
      } else {
        setError('Không thể khởi động camera');
      }
    }
  }, [processFrame]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;

    const currentBpm = bpmRef.current;
    if (currentBpm) {
      const entry: LogEntry = {
        id: Date.now().toString(),
        bpm: currentBpm,
        timestamp: new Date(),
        duration: Math.round((Date.now() - startTimeRef.current) / 1000),
      };
      setLog(prev => [entry, ...prev.slice(0, 49)]);
    }

    setIsActive(false);
    setTorchEnabled(false);
    setBpm(null);
    setSignal([]);
  }, []);

  const clearLog = useCallback(() => {
    setLog([]);
    localStorage.removeItem('hr-log');
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const fillRatio = Math.min(1, redBufRef.current.length / BUFFER_SIZE);
  const isReady = isActive && fillRatio >= 0.5;

  return {
    videoRef,
    isActive,
    isReady,
    bpm,
    signal,
    log,
    error,
    torchEnabled,
    start,
    stop,
    clearLog,
  };
}
