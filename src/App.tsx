import { useEffect, useRef, useState } from 'react';
import './App.css';
import { useEditor } from './hooks/useEditor';
import { Toolbar } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { RightPanel } from './components/RightPanel';
import { MenuBar } from './components/MenuBar';
import { BrushOptions } from './components/BrushOptions';

function App() {
  const {
    state,
    loadImage,
    setTool,
    setAdjustment,
    resetAdjustments,
    setFilter,
    setZoom,
    setPan,
    setBrushSize,
    setBrushColor,
    setBrushOpacity,
    toggleLayerVisibility,
    setActiveLayer,
    removeBackground,
    getRenderedCanvas,
    getComposedCanvas,
  } = useEditor();

  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      switch (e.key.toLowerCase()) {
        case 'v': setTool('select'); break;
        case 'c': setTool('crop'); break;
        case 'b': setTool('brush'); break;
        case 'e': setTool('eraser'); break;
        case 't': setTool('text'); break;
        case 'z': setTool('zoom'); break;
        case 'h': setTool('pan'); break;
        case 'i': setTool('eyedropper'); break;
        case '+': case '=': setZoom(state.zoom * 1.2); break;
        case '-': setZoom(state.zoom / 1.2); break;
        case '0': setZoom(1); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [setTool, setZoom, state.zoom]);

  // Drag & drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    dragCounter.current = 0;
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      loadImage(file);
    }
  };

  const handleMenuAction = (action: string) => {
    switch (action) {
      case 'zoom-in': setZoom(state.zoom * 1.5); break;
      case 'zoom-out': setZoom(state.zoom / 1.5); break;
      case 'zoom-fit': setZoom(1); setPan(0, 0); break;
      case 'zoom-100': setZoom(1); break;
      case 'reset': resetAdjustments(); break;
      case 'flip-h': handleFlip('h'); break;
      case 'flip-v': handleFlip('v'); break;
      case 'rotate-cw': handleRotate(90); break;
      case 'rotate-ccw': handleRotate(-90); break;
    }
  };

  const handleFlip = (direction: 'h' | 'v') => {
    const layer = state.layers.find(l => l.id === state.activeLayerId);
    if (!layer) return;
    const out = document.createElement('canvas');
    out.width = layer.canvas.width;
    out.height = layer.canvas.height;
    const ctx = out.getContext('2d')!;
    ctx.save();
    if (direction === 'h') {
      ctx.translate(out.width, 0);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(0, out.height);
      ctx.scale(1, -1);
    }
    ctx.drawImage(layer.canvas, 0, 0);
    ctx.restore();
    layer.canvas.getContext('2d')!.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
    layer.canvas.getContext('2d')!.drawImage(out, 0, 0);
  };

  const handleRotate = (degrees: number) => {
    const layer = state.layers.find(l => l.id === state.activeLayerId);
    if (!layer) return;
    const rad = (degrees * Math.PI) / 180;
    const ow = layer.canvas.width;
    const oh = layer.canvas.height;
    const nw = Math.abs(ow * Math.cos(rad)) + Math.abs(oh * Math.sin(rad));
    const nh = Math.abs(ow * Math.sin(rad)) + Math.abs(oh * Math.cos(rad));
    const out = document.createElement('canvas');
    out.width = Math.round(nw);
    out.height = Math.round(nh);
    const ctx = out.getContext('2d')!;
    ctx.translate(nw / 2, nh / 2);
    ctx.rotate(rad);
    ctx.drawImage(layer.canvas, -ow / 2, -oh / 2);
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = out.width;
    tmpCanvas.height = out.height;
    tmpCanvas.getContext('2d')!.drawImage(out, 0, 0);
    Object.assign(layer, { canvas: tmpCanvas });
  };

  const handleAutoEnhance = () => {
    setAdjustment('brightness', 10);
    setAdjustment('contrast', 15);
    setAdjustment('saturation', 20);
    setAdjustment('vibrance', 30);
    setAdjustment('sharpness', 20);
  };

  const handleUpscale = () => {
    const layer = state.layers.find(l => l.id === state.activeLayerId);
    if (!layer) return;
    const factor = 2;
    const out = document.createElement('canvas');
    out.width = layer.canvas.width * factor;
    out.height = layer.canvas.height * factor;
    const ctx = out.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(layer.canvas, 0, 0, out.width, out.height);
    layer.canvas.width = out.width;
    layer.canvas.height = out.height;
    layer.canvas.getContext('2d')!.drawImage(out, 0, 0);
  };

  const handleDenoise = () => {
    setAdjustment('noiseReduction', 50);
  };

  const handleColorize = () => {
    setAdjustment('saturation', 60);
    setAdjustment('vibrance', 50);
  };

  const renderedCanvas = getRenderedCanvas();
  const composedCanvas = getComposedCanvas();
  const showBrushOptions = state.activeTool === 'brush' || state.activeTool === 'eraser';

  return (
    <div
      style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#1e1e2e' }}
      onDragEnter={handleDragEnter}
      onDragOver={e => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Menu bar */}
      <MenuBar
        hasImage={!!state.image}
        onOpenFile={loadImage}
        onExport={handleMenuAction}
        getRenderedCanvas={getRenderedCanvas}
      />

      {/* Brush options bar */}
      {showBrushOptions && (
        <BrushOptions
          brushSize={state.brushSize}
          brushColor={state.brushColor}
          brushOpacity={state.brushOpacity}
          onSizeChange={setBrushSize}
          onColorChange={setBrushColor}
          onOpacityChange={setBrushOpacity}
        />
      )}

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left toolbar */}
        <Toolbar
          activeTool={state.activeTool}
          onToolChange={setTool}
          onUndo={() => {}}
          onRedo={() => {}}
          canUndo={false}
          canRedo={false}
        />

        {/* Canvas */}
        <Canvas
          renderedCanvas={renderedCanvas}
          baseCanvas={composedCanvas}
          zoom={state.zoom}
          panX={state.panX}
          panY={state.panY}
          activeTool={state.activeTool}
          brushSize={state.brushSize}
          brushColor={state.brushColor}
          brushOpacity={state.brushOpacity}
          onZoomChange={setZoom}
          onPanChange={setPan}
        />

        {/* Right panel */}
        <RightPanel
          adjustments={state.adjustments}
          onAdjustmentChange={setAdjustment}
          onResetAdjustments={resetAdjustments}
          onAutoEnhance={handleAutoEnhance}
          sourceCanvas={composedCanvas}
          selectedFilter={state.selectedFilter}
          onFilterSelect={setFilter}
          layers={state.layers}
          activeLayerId={state.activeLayerId}
          onSelectLayer={setActiveLayer}
          onToggleLayerVisibility={toggleLayerVisibility}
          hasImage={!!state.image}
          isProcessing={state.isProcessing}
          processingMessage={state.processingMessage}
          onRemoveBackground={removeBackground}
          onUpscale={handleUpscale}
          onDenoise={handleDenoise}
          onColorize={handleColorize}
        />
      </div>

      {/* Drag overlay */}
      {isDragging && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(108,99,255,0.15)',
          border: '3px dashed #6c63ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          pointerEvents: 'none',
        }}>
          <div style={{ textAlign: 'center', color: '#6c63ff' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>📂</div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>Drop image to open</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
