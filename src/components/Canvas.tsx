import { useRef, useEffect, useCallback, useState } from 'react';
import type { Tool, ShapeType } from '../types/editor';

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
  shapeType: ShapeType;
  shapeFilled: boolean;
  onZoomChange: (zoom: number) => void;
  onPanChange: (x: number, y: number) => void;
  onDrawCommit?: (canvas: HTMLCanvasElement, label?: string) => void;
  onCropComplete?: (x: number, y: number, w: number, h: number) => void;
  onColorPick?: (color: string) => void;
  onAddText?: (text: string, x: number, y: number) => void;
}

function drawShapePreview(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  type: ShapeType,
  filled: boolean,
  color: string,
  lineWidth: number,
  opacityPct: number
) {
  ctx.globalAlpha = opacityPct / 100;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const x = Math.min(from.x, to.x);
  const y = Math.min(from.y, to.y);
  const w = Math.abs(to.x - from.x);
  const h = Math.abs(to.y - from.y);
  ctx.beginPath();
  if (type === 'rectangle') {
    ctx.rect(x, y, w, h);
  } else if (type === 'ellipse') {
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  } else {
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
  }
  if (type === 'line') {
    ctx.stroke();
  } else if (filled) {
    ctx.fill();
  } else {
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function stampClone(
  dest: HTMLCanvasElement,
  sample: HTMLCanvasElement,
  pos: { x: number; y: number },
  offset: { x: number; y: number },
  size: number,
  opacityPct: number
) {
  const ctx = dest.getContext('2d')!;
  const sampleX = pos.x - offset.x;
  const sampleY = pos.y - offset.y;
  ctx.save();
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.globalAlpha = opacityPct / 100;
  ctx.drawImage(sample, sampleX - size / 2, sampleY - size / 2, size, size, pos.x - size / 2, pos.y - size / 2, size, size);
  ctx.restore();
}

function stampHeal(
  dest: HTMLCanvasElement,
  sample: HTMLCanvasElement,
  pos: { x: number; y: number },
  offset: { x: number; y: number },
  size: number,
  opacityPct: number
) {
  const ctx = dest.getContext('2d')!;
  const sampleX = pos.x - offset.x;
  const sampleY = pos.y - offset.y;
  const steps = 4;
  for (let i = steps; i >= 1; i--) {
    const r = (size / 2) * (i / steps);
    ctx.save();
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalAlpha = (opacityPct / 100) * (1 / steps) * 1.5;
    ctx.drawImage(sample, sampleX - size / 2, sampleY - size / 2, size, size, pos.x - size / 2, pos.y - size / 2, size, size);
    ctx.restore();
  }
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
  shapeType,
  shapeFilled,
  onZoomChange,
  onPanChange,
  onDrawCommit,
  onCropComplete,
  onColorPick,
  onAddText,
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
  const shapeStart = useRef({ x: 0, y: 0 });
  const isDrawingShape = useRef(false);
  const shapeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cloneSource = useRef<{ x: number; y: number } | null>(null);
  const cloneOffset = useRef<{ x: number; y: number } | null>(null);
  const cloneSampleCanvas = useRef<HTMLCanvasElement | null>(null);
  const [textInput, setTextInput] = useState<{ x: number; y: number; screenX: number; screenY: number; value: string } | null>(null);

  // Reset tool-specific transient state when switching tools
  useEffect(() => {
    cloneSource.current = null;
    cloneOffset.current = null;
    cloneSampleCanvas.current = null;
    isDrawingShape.current = false;
    shapeCanvasRef.current = null;
    if (activeTool !== 'text') setTextInput(null);
  }, [activeTool]);

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

    if (activeTool === 'eyedropper') {
      const src = baseCanvas || renderedCanvas;
      const x = Math.round(pos.x);
      const y = Math.round(pos.y);
      if (x < 0 || y < 0 || x >= src.width || y >= src.height) return;
      const ctx = src.getContext('2d')!;
      const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
      const hex = `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
      onColorPick?.(hex);
      return;
    }

    if (activeTool === 'text') {
      e.preventDefault();
      const rect = containerRef.current!.getBoundingClientRect();
      if (textInput && textInput.value.trim()) {
        onAddText?.(textInput.value, textInput.x, textInput.y);
      }
      setTextInput({ x: pos.x, y: pos.y, screenX: e.clientX - rect.left, screenY: e.clientY - rect.top, value: '' });
      return;
    }

    if (activeTool === 'shape') {
      isDrawingShape.current = true;
      shapeStart.current = pos;
      const src = baseCanvas || renderedCanvas;
      const sc = document.createElement('canvas');
      sc.width = src.width;
      sc.height = src.height;
      shapeCanvasRef.current = sc;
      return;
    }

    if (activeTool === 'clone' || activeTool === 'heal') {
      if (e.altKey) {
        cloneSource.current = pos;
        return;
      }
      if (!cloneSource.current) return;
      cloneOffset.current = { x: pos.x - cloneSource.current.x, y: pos.y - cloneSource.current.y };
      const src = baseCanvas || renderedCanvas;
      const sample = document.createElement('canvas');
      sample.width = src.width;
      sample.height = src.height;
      sample.getContext('2d')!.drawImage(src, 0, 0);
      cloneSampleCanvas.current = sample;
      const dc = document.createElement('canvas');
      dc.width = src.width;
      dc.height = src.height;
      dc.getContext('2d')!.drawImage(src, 0, 0);
      drawingCanvasRef.current = dc;
      isPainting.current = true;
      lastPos.current = pos;
      const stamp = activeTool === 'clone' ? stampClone : stampHeal;
      stamp(dc, sample, pos, cloneOffset.current, brushSize, brushOpacity);
      renderDisplay({ replaceImage: dc });
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
  }, [activeTool, renderedCanvas, baseCanvas, getImageCoords, zoom, onZoomChange, brushSize, brushColor, brushOpacity, renderDisplay, onColorPick, onAddText, textInput]);

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

    if (activeTool === 'shape' && isDrawingShape.current && shapeCanvasRef.current) {
      const sc = shapeCanvasRef.current;
      const ctx = sc.getContext('2d')!;
      ctx.clearRect(0, 0, sc.width, sc.height);
      drawShapePreview(ctx, shapeStart.current, pos, shapeType, shapeFilled, brushColor, brushSize, brushOpacity);
      renderDisplay({ brushOverlay: sc });
      return;
    }

    if (
      isPainting.current &&
      drawingCanvasRef.current &&
      (activeTool === 'clone' || activeTool === 'heal') &&
      cloneOffset.current &&
      cloneSampleCanvas.current
    ) {
      const stamp = activeTool === 'clone' ? stampClone : stampHeal;
      stamp(drawingCanvasRef.current, cloneSampleCanvas.current, pos, cloneOffset.current, brushSize, brushOpacity);
      lastPos.current = pos;
      renderDisplay({ replaceImage: drawingCanvasRef.current });
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
  }, [activeTool, isCropping, panX, panY, getImageCoords, onPanChange, brushSize, brushColor, brushOpacity, renderDisplay, shapeType, shapeFilled]);

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

    if (activeTool === 'shape' && isDrawingShape.current) {
      isDrawingShape.current = false;
      const sc = shapeCanvasRef.current;
      shapeCanvasRef.current = null;
      if (sc && (baseCanvas || renderedCanvas)) {
        const src = baseCanvas || renderedCanvas!;
        const merged = document.createElement('canvas');
        merged.width = src.width;
        merged.height = src.height;
        const ctx = merged.getContext('2d')!;
        ctx.drawImage(src, 0, 0);
        ctx.drawImage(sc, 0, 0);
        onDrawCommit?.(merged, 'Shape');
      } else {
        renderDisplay();
      }
    }

    if (isPainting.current && drawingCanvasRef.current) {
      isPainting.current = false;
      const dc = drawingCanvasRef.current;
      drawingCanvasRef.current = null;
      cloneOffset.current = null;
      cloneSampleCanvas.current = null;

      const label = activeTool === 'eraser' ? 'Eraser'
        : activeTool === 'clone' ? 'Clone Stamp'
        : activeTool === 'heal' ? 'Healing Brush'
        : 'Brush';

      // For brush: merge strokes onto base canvas and commit
      // For eraser/clone/heal: dc already contains the full replacement result
      if (activeTool === 'brush' && (baseCanvas || renderedCanvas)) {
        const src = baseCanvas || renderedCanvas!;
        const merged = document.createElement('canvas');
        merged.width = src.width;
        merged.height = src.height;
        const ctx = merged.getContext('2d')!;
        ctx.drawImage(src, 0, 0);
        ctx.drawImage(dc, 0, 0);
        onDrawCommit?.(merged, label);
      } else {
        onDrawCommit?.(dc, label);
      }
    }

    void e;
  }, [activeTool, isCropping, cropRect, onCropComplete, baseCanvas, renderedCanvas, onDrawCommit, renderDisplay]);

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
      case 'shape': return 'crosshair';
      case 'clone': case 'heal': return 'copy';
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

      {textInput && (
        <input
          autoFocus
          value={textInput.value}
          onChange={e => setTextInput({ ...textInput, value: e.target.value })}
          onMouseDown={e => e.stopPropagation()}
          onKeyDown={e => {
            e.stopPropagation();
            if (e.key === 'Enter') {
              if (textInput.value.trim()) onAddText?.(textInput.value, textInput.x, textInput.y);
              setTextInput(null);
            } else if (e.key === 'Escape') {
              setTextInput(null);
            }
          }}
          onBlur={() => {
            if (textInput.value.trim()) onAddText?.(textInput.value, textInput.x, textInput.y);
            setTextInput(null);
          }}
          placeholder="Type text…"
          style={{
            position: 'absolute',
            left: textInput.screenX,
            top: textInput.screenY - 22,
            background: 'rgba(26,26,46,0.92)',
            border: '1px solid #6c63ff',
            borderRadius: 4,
            color: brushColor,
            fontSize: Math.max(14, Math.min(48, brushSize)),
            padding: '4px 8px',
            outline: 'none',
            zIndex: 10,
            minWidth: 140,
          }}
        />
      )}

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
