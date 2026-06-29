import { useRef, useEffect } from 'react';

interface Props {
  bpm: number | null;
  signal: number[];
  isActive: boolean;
}

export function WaveformCanvas({ bpm, signal, isActive }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  // Keep props fresh without restarting the draw loop
  const stateRef = useRef({ bpm, signal, isActive });

  useEffect(() => {
    stateRef.current = { bpm, signal, isActive };
  }, [bpm, signal, isActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const ctx = canvas.getContext('2d')!;

    const draw = () => {
      const { bpm: curBpm, signal: curSig, isActive: active } = stateRef.current;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = '#080812';
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40 * dpr) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 28 * dpr) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Center line
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4 * dpr, 8 * dpr]);
      ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
      ctx.setLineDash([]);

      if (active) {
        // Raw PPG signal trace (faint background)
        if (curSig.length > 10) {
          const min = Math.min(...curSig);
          const max = Math.max(...curSig);
          const range = max - min || 1;

          ctx.beginPath();
          ctx.strokeStyle = 'rgba(255,80,80,0.2)';
          ctx.lineWidth = 1.5 * dpr;
          for (let i = 0; i < curSig.length; i++) {
            const x = (i / (curSig.length - 1)) * w;
            const y = h - ((curSig[i] - min) / range) * h * 0.72 - h * 0.14;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }

        // Animated sine wave — scrolls left at the BPM rate
        const freq = curBpm ? curBpm / 60 : 0.8; // Hz
        const t = Date.now() / 1000;
        const timeWindow = 4; // seconds shown on screen
        const A = h * 0.34;

        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, 'rgba(255,60,60,0.05)');
        grad.addColorStop(0.15, 'rgba(255,80,80,0.95)');
        grad.addColorStop(0.5, 'rgba(255,140,60,1)');
        grad.addColorStop(0.85, 'rgba(255,80,80,0.95)');
        grad.addColorStop(1, 'rgba(255,60,60,0.05)');

        ctx.shadowBlur = 14 * dpr;
        ctx.shadowColor = 'rgba(255,70,70,0.55)';
        ctx.beginPath();
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.5 * dpr;

        // Each pixel x represents time: t - timeWindow + (x/w)*timeWindow
        for (let px = 0; px <= w; px++) {
          const sampleT = t - timeWindow + (px / w) * timeWindow;
          const y = h / 2 + A * Math.sin(2 * Math.PI * freq * sampleT);
          if (px === 0) ctx.moveTo(px, y); else ctx.lineTo(px, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Pulsing dot at the leading edge (rightmost, current time)
        const dotY = h / 2 + A * Math.sin(2 * Math.PI * freq * t);
        const pulse = 0.5 + 0.5 * Math.abs(Math.sin(Math.PI * freq * t));
        ctx.beginPath();
        ctx.arc(w - 2 * dpr, dotY, (4 + pulse * 3) * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,${Math.round(80 + pulse * 80)},80,${0.7 + pulse * 0.3})`;
        ctx.shadowBlur = (10 + pulse * 10) * dpr;
        ctx.shadowColor = '#ff4444';
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // Idle: flat line with very subtle slow wave
        const t = Date.now() / 1000;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,70,70,0.18)';
        ctx.lineWidth = 1.5 * dpr;
        for (let px = 0; px <= w; px++) {
          const y = h / 2 + h * 0.04 * Math.sin((px / w) * 2 * Math.PI + t * 0.4);
          if (px === 0) ctx.moveTo(px, y); else ctx.lineTo(px, y);
        }
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}
