import { useRef, useEffect, useCallback, useState } from 'react';
import type { Tool } from '../types/editor';

interface CanvasProps {
  renderedCanvas: HTMLCanvasElement | null;
  baseCanvas: HTMLCanvasElement | null;
  zoom: number;
  panX: number;
  panY: number;
  activeTool: Tool;
  brushSize: number;
  brushColor: string;
  brushOpacity: number;
  onZoomChange: (zoom: number) => void;
  onPanChange: (x: number, y: number) => void;
  onDrawCommit?: (canvas: HTMLCanvasElement) => void;
  onCropComplete?: (x: number, y: number, w: number, h: number) => void;
}

export function Canvas({
  renderedCanvas,
  baseCanvas,
  zoom,
  panX,
  panY,
  activeTool,
  brushSize,
  brushColor,
  brushOpacity,
  onZoomChange,
  onPanChange,
  onDrawCommit,
  onCropComplete,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPainting = useRef(false);
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const cropStart = useRef({ x: 0, y: 0 });
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  // brushOverlay: transparent canvas with strokes only (drawn on top of renderedCanvas)
  // replaceImage: full replacement canvas (for eraser preview)
  const renderDisplay = useCallback((opts?: {
    brushOverlay?: HTMLCanvasElement | null;
    replaceImage?: HTMLCanvasElement | null;
  }) => {
    const displayCanvas = displayCanvasRef.current;
    const container = containerRef.current;
    if (!displayCanvas || !container) return;

    const ctx = displayCanvas.getContext('2d')!;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    if (displayCanvas.width !== cw) displayCanvas.width = cw;
    if (displayCanvas.height !== ch) displayCanvas.height = ch;

    ctx.clearRect(0, 0, cw, ch);

    // Checkerboard background
    const tileSize = 16;
    for (let y = 0; y < ch; y += tileSize) {
      for (let x = 0; x < cw; x += tileSize) {
        const isEven = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0;
        ctx.fillStyle = isEven ? '#2a2a3e' : '#252538';
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }

    const mainSrc = opts?.replaceImage || renderedCanvas;
    if (!mainSrc) return;

    const imgW = mainSrc.width * zoom;
    const imgH = mainSrc.height * zoom;
    const drawX = cw / 2 - imgW / 2 + panX;
    const drawY = ch / 2 - imgH / 2 + panY;

    ctx.imageSmoothingEnabled = zoom < 1;
    ctx.drawImage(mainSrc, drawX, drawY, imgW, imgH);

    if (opts?.brushOverlay) {
      ctx.drawImage(opts.brushOverlay, drawX, drawY, imgW, imgH);
    }

    // Crop overlay
    if (cropRect && activeTool === 'crop') {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, cw, drawY + cropRect.y * zoom);
      ctx.fillRect(0, drawY + (cropRect.y + cropRect.h) * zoom, cw, ch);
      ctx.fillRect(0, drawY + cropRect.y * zoom, drawX + cropRect.x * zoom, cropRect.h * zoom);
      ctx.fillRect(
        drawX + (cropRect.x + cropRect.w) * zoom,
        drawY + cropRect.y * zoom,
        cw,
        cropRect.h * zoom
      );
      ctx.strokeStyle = '#6c63ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        drawX + cropRect.x * zoom,
        drawY + cropRect.y * zoom,
        cropRect.w * zoom,
        cropRect.h * zoom
      );
    }
  }, [renderedCanvas, zoom, panX, panY, cropRect, activeTool]);

  useEffect(() => {
    renderDisplay();
  }, [renderDisplay]);

  const getImageCoords = useCallback((e: React.MouseEvent | MouseEvent): { x: number; y: number } => {
    const container = containerRef.current;
    const canvas = renderedCanvas;
    if (!container || !canvas) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const imgW = canvas.width * zoom;
    const imgH = canvas.height * zoom;
    const drawX = cw / 2 - imgW / 2 + panX;
    const drawY = ch / 2 - imgH / 2 + panY;
    return {
      x: (cx - drawX) / zoom,
      y: (cy - drawY) / zoom,
    };
  }, [renderedCanvas, zoom, panX, panY]);

  const paintDot = (dc: HTMLCanvasElement, pos: { x: number; y: number }, tool: Tool) => {
    const ctx = dc.getContext('2d')!;
    ctx.globalAlpha = brushOpacity / 100;
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = brushColor;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  const paintLine = (dc: HTMLCanvasElement, from: { x: number; y: number }, to: { x: number; y: number }, tool: Tool) => {
    const ctx = dc.getContext('2d')!;
    ctx.globalAlpha = brushOpacity / 100;
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!renderedCanvas) return;
    const pos = getImageCoords(e);

    if (activeTool === 'pan' || e.button === 1) {
      isPanning.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (activeTool === 'zoom') {
      onZoomChange(e.button === 2 ? zoom / 1.5 : zoom * 1.5);
      return;
    }

    if (activeTool === 'crop') {
      setIsCropping(true);
      cropStart.current = pos;
      setCropRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
      return;
    }

    if (activeTool === 'brush' || activeTool === 'eraser') {
      isPainting.current = true;
      lastPos.current = pos;

      if (!drawingCanvasRef.current) {
        const src = baseCanvas || renderedCanvas;
        const dc = document.createElement('canvas');
        dc.width = src.width;
        dc.height = src.height;
        if (activeTool === 'eraser') {
          // Eraser needs the base pixels to remove
          dc.getContext('2d')!.drawImage(src, 0, 0);
        }
        drawingCanvasRef.current = dc;
      }

      paintDot(drawingCanvasRef.current, pos, activeTool);

      if (activeTool === 'brush') {
        renderDisplay({ brushOverlay: drawingCanvasRef.current });
      } else {
        renderDisplay({ replaceImage: drawingCanvasRef.current });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool, renderedCanvas, baseCanvas, getImageCoords, zoom, onZoomChange, brushSize, brushColor, brushOpacity, renderDisplay]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning.current) {
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      onPanChange(panX + dx, panY + dy);
      lastPos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const pos = getImageCoords(e);

    if (activeTool === 'crop' && isCropping) {
      const x = Math.min(pos.x, cropStart.current.x);
      const y = Math.min(pos.y, cropStart.current.y);
      const w = Math.abs(pos.x - cropStart.current.x);
      const h = Math.abs(pos.y - cropStart.current.y);
      setCropRect({ x, y, w, h });
      return;
    }

    if (isPainting.current && drawingCanvasRef.current && (activeTool === 'brush' || activeTool === 'eraser')) {
      paintLine(drawingCanvasRef.current, lastPos.current, pos, activeTool);
      lastPos.current = pos;

      if (activeTool === 'brush') {
        renderDisplay({ brushOverlay: drawingCanvasRef.current });
      } else {
        renderDisplay({ replaceImage: drawingCanvasRef.current });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool, isCropping, panX, panY, getImageCoords, onPanChange, brushSize, brushColor, brushOpacity, renderDisplay]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    isPanning.current = false;

    if (activeTool === 'crop' && isCropping && cropRect) {
      setIsCropping(false);
      if (cropRect.w > 10 && cropRect.h > 10) {
        onCropComplete?.(
          Math.max(0, Math.round(cropRect.x)),
          Math.max(0, Math.round(cropRect.y)),
          Math.round(cropRect.w),
          Math.round(cropRect.h)
        );
      }
    }

    if (isPainting.current && drawingCanvasRef.current) {
      isPainting.current = false;
      const dc = drawingCanvasRef.current;
      drawingCanvasRef.current = null;

      // For brush: merge strokes onto base canvas and commit
      // For eraser: dc already contains the erased result
      if (activeTool === 'brush' && (baseCanvas || renderedCanvas)) {
        const src = baseCanvas || renderedCanvas!;
        const merged = document.createElement('canvas');
        merged.width = src.width;
        merged.height = src.height;
        const ctx = merged.getContext('2d')!;
        ctx.drawImage(src, 0, 0);
        ctx.drawImage(dc, 0, 0);
        onDrawCommit?.(merged);
      } else {
        onDrawCommit?.(dc);
      }
    }

    void e;
  }, [activeTool, isCropping, cropRect, onCropComplete, baseCanvas, renderedCanvas, onDrawCommit]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    onZoomChange(zoom * delta);
  }, [zoom, onZoomChange]);

  const getCursor = () => {
    switch (activeTool) {
      case 'pan': return 'grab';
      case 'zoom': return 'zoom-in';
      case 'crop': return 'crosshair';
      case 'brush': return 'crosshair';
      case 'eraser': return 'cell';
      case 'eyedropper': return 'crosshair';
      case 'text': return 'text';
      default: return 'default';
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        cursor: getCursor(),
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={e => e.preventDefault()}
    >
      <canvas ref={displayCanvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />

      {!renderedCanvas && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#606080',
          gap: 16,
        }}>
          <div style={{ fontSize: 64 }}>🖼</div>
          <div style={{ fontSize: 20, color: '#9090b0', fontWeight: 500 }}>Open an image to start editing</div>
          <div style={{ fontSize: 14, color: '#606080' }}>Drag & drop or use File → Open</div>
        </div>
      )}

      {renderedCanvas && (
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          background: 'rgba(26,26,46,0.8)',
          color: '#9090b0',
          padding: '4px 10px',
          borderRadius: 4,
          fontSize: 12,
          border: '1px solid #3a3a5c',
        }}>
          {Math.round(zoom * 100)}%
        </div>
      )}

      {renderedCanvas && (
        <div style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          background: 'rgba(26,26,46,0.8)',
          color: '#9090b0',
          padding: '4px 10px',
          borderRadius: 4,
          fontSize: 12,
          border: '1px solid #3a3a5c',
        }}>
          {renderedCanvas.width} × {renderedCanvas.height}
        </div>
      )}
    </div>
  );
}
