import { useState, useCallback, useRef } from 'react';
import type { EditorState, Adjustments, Tool, Layer, ShapeType, HistoryEntry } from '../types/editor';
import { imageToCanvas, applyAdjustments, applyFilter, applySharpness, cloneCanvas } from '../utils/imageProcessing';
import { removeBackgroundAI, autoEnhanceAI, denoiseAI, upscaleAI, colorizeAI, restorePhotoAI } from '../utils/aiProcessing';
import { faceSwapAI } from '../utils/faceSwapProcessing';

function snapshotLayers(layers: Layer[]): Layer[] {
  return layers.map(l => ({ ...l, canvas: cloneCanvas(l.canvas) }));
}

// Builds the layers/history/activeLayerId fields for a setState updater after a
// destructive edit, trimming any "future" redo entries past the current index.
function withHistory(
  prev: EditorState,
  newLayers: Layer[],
  label: string,
  newActiveLayerId?: string
): Pick<EditorState, 'layers' | 'activeLayerId' | 'history' | 'historyIndex'> {
  const entry: HistoryEntry = {
    id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label,
    timestamp: Date.now(),
    layers: snapshotLayers(newLayers),
    activeLayerId: newActiveLayerId ?? prev.activeLayerId,
  };
  const history = [...prev.history.slice(0, prev.historyIndex + 1), entry];
  return {
    layers: newLayers,
    activeLayerId: newActiveLayerId ?? prev.activeLayerId,
    history,
    historyIndex: history.length - 1,
  };
}

const defaultAdjustments: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  clarity: 0,
  vibrance: 0,
  temperature: 0,
  tint: 0,
  sharpness: 0,
  noiseReduction: 0,
  vignette: 0,
};

const initialState: EditorState = {
  image: null,
  layers: [],
  activeLayerId: null,
  activeTool: 'select',
  adjustments: defaultAdjustments,
  zoom: 1,
  panX: 0,
  panY: 0,
  brushSize: 20,
  brushColor: '#ffffff',
  brushOpacity: 100,
  shapeType: 'rectangle',
  shapeFilled: false,
  history: [],
  historyIndex: -1,
  selectedFilter: null,
  isProcessing: false,
  processingMessage: '',
};

function fileToCanvas(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext('2d')!.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(c);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function useEditor() {
  const [state, setState] = useState<EditorState>(initialState);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const loadImage = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = imageToCanvas(img);
      originalCanvasRef.current = canvas;
      const layer: Layer = {
        id: 'bg-layer',
        name: 'Background',
        visible: true,
        locked: false,
        opacity: 100,
        blendMode: 'normal',
        canvas,
        type: 'image',
      };
      const initialEntry: HistoryEntry = {
        id: `h-${Date.now()}`,
        label: 'Open Image',
        timestamp: Date.now(),
        layers: snapshotLayers([layer]),
        activeLayerId: layer.id,
      };
      setState(prev => ({
        ...prev,
        image: img,
        layers: [layer],
        activeLayerId: layer.id,
        adjustments: defaultAdjustments,
        selectedFilter: null,
        zoom: 1,
        panX: 0,
        panY: 0,
        history: [initialEntry],
        historyIndex: 0,
      }));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, []);

  const setTool = useCallback((tool: Tool) => {
    setState(prev => ({ ...prev, activeTool: tool }));
  }, []);

  const setAdjustment = useCallback((key: keyof Adjustments, value: number) => {
    setState(prev => ({ ...prev, adjustments: { ...prev.adjustments, [key]: value } }));
  }, []);

  const resetAdjustments = useCallback(() => {
    setState(prev => ({ ...prev, adjustments: defaultAdjustments, selectedFilter: null }));
  }, []);

  const setFilter = useCallback((filterId: string | null) => {
    setState(prev => ({ ...prev, selectedFilter: filterId }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({ ...prev, zoom: Math.max(0.1, Math.min(10, zoom)) }));
  }, []);

  const setPan = useCallback((panX: number, panY: number) => {
    setState(prev => ({ ...prev, panX, panY }));
  }, []);

  const setBrushSize = useCallback((size: number) => {
    setState(prev => ({ ...prev, brushSize: size }));
  }, []);

  const setBrushColor = useCallback((color: string) => {
    setState(prev => ({ ...prev, brushColor: color }));
  }, []);

  const setBrushOpacity = useCallback((opacity: number) => {
    setState(prev => ({ ...prev, brushOpacity: opacity }));
  }, []);

  const setShapeType = useCallback((shapeType: ShapeType) => {
    setState(prev => ({ ...prev, shapeType }));
  }, []);

  const setShapeFilled = useCallback((filled: boolean) => {
    setState(prev => ({ ...prev, shapeFilled: filled }));
  }, []);

  const toggleLayerVisibility = useCallback((layerId: string) => {
    setState(prev => ({
      ...prev,
      layers: prev.layers.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l),
    }));
  }, []);

  const setActiveLayer = useCallback((layerId: string) => {
    setState(prev => ({ ...prev, activeLayerId: layerId }));
  }, []);

  const addTextLayer = useCallback((text: string, x: number, y: number) => {
    setState(prev => {
      const base = prev.layers[0]?.canvas;
      const canvas = document.createElement('canvas');
      canvas.width = base?.width || 800;
      canvas.height = base?.height || 600;
      const ctx = canvas.getContext('2d')!;
      const fontSize = Math.max(14, prev.brushSize * 2);
      ctx.font = `${fontSize}px Arial`;
      ctx.fillStyle = prev.brushColor;
      ctx.textBaseline = 'top';
      ctx.fillText(text, x, y);
      const layer: Layer = {
        id: `text-${Date.now()}`,
        name: `Text: ${text.slice(0, 10)}`,
        visible: true,
        locked: false,
        opacity: 100,
        blendMode: 'normal',
        canvas,
        type: 'text',
      };
      const newLayers = [...prev.layers, layer];
      return { ...prev, ...withHistory(prev, newLayers, 'Add Text', layer.id) };
    });
  }, []);

  const cropImage = useCallback((x: number, y: number, w: number, h: number) => {
    setState(prev => {
      if (!prev.layers.length) return prev;
      const newLayers = prev.layers.map(l => {
        const out = document.createElement('canvas');
        out.width = w;
        out.height = h;
        out.getContext('2d')!.drawImage(l.canvas, -x, -y);
        return { ...l, canvas: out };
      });
      return {
        ...prev,
        panX: 0,
        panY: 0,
        ...withHistory(prev, newLayers, 'Crop'),
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex <= 0) return prev;
      const idx = prev.historyIndex - 1;
      const entry = prev.history[idx];
      return {
        ...prev,
        layers: snapshotLayers(entry.layers),
        activeLayerId: entry.activeLayerId,
        historyIndex: idx,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex >= prev.history.length - 1) return prev;
      const idx = prev.historyIndex + 1;
      const entry = prev.history[idx];
      return {
        ...prev,
        layers: snapshotLayers(entry.layers),
        activeLayerId: entry.activeLayerId,
        historyIndex: idx,
      };
    });
  }, []);

  const removeBackground_ = useCallback(async () => {
    const activeLayer = state.layers.find(l => l.id === state.activeLayerId);
    if (!activeLayer) return;
    setState(prev => ({ ...prev, isProcessing: true, processingMessage: 'Loading AI model...' }));
    try {
      const result = await removeBackgroundAI(activeLayer.canvas, (msg) => {
        setState(prev => ({ ...prev, processingMessage: msg }));
      });
      setState(prev => ({
        ...prev,
        isProcessing: false,
        processingMessage: '',
        ...withHistory(prev, prev.layers.map(l =>
          l.id === prev.activeLayerId ? { ...l, canvas: result } : l
        ), 'Remove Background'),
      }));
    } catch {
      setState(prev => ({ ...prev, isProcessing: false, processingMessage: '' }));
    }
  }, [state.layers, state.activeLayerId]);

  const autoEnhance_ = useCallback(() => {
    const composed = (() => {
      if (!state.layers.length) return null;
      const base = state.layers[0];
      const c = document.createElement('canvas');
      c.width = base.canvas.width;
      c.height = base.canvas.height;
      const ctx = c.getContext('2d')!;
      for (const layer of state.layers) {
        if (!layer.visible) continue;
        ctx.drawImage(layer.canvas, 0, 0);
      }
      return c;
    })();
    if (!composed) return;
    const suggested = autoEnhanceAI(composed);
    setState(prev => ({
      ...prev,
      adjustments: {
        ...prev.adjustments,
        brightness: suggested.brightness,
        contrast: suggested.contrast,
        saturation: suggested.saturation,
        vibrance: suggested.vibrance,
        sharpness: suggested.sharpness,
        highlights: suggested.highlights,
        shadows: suggested.shadows,
      },
    }));
  }, [state.layers]);

  const denoise_ = useCallback(async () => {
    const activeLayer = state.layers.find(l => l.id === state.activeLayerId);
    if (!activeLayer) return;
    setState(prev => ({ ...prev, isProcessing: true, processingMessage: 'Applying bilateral filter...' }));
    try {
      const result = denoiseAI(activeLayer.canvas, 0.5);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        processingMessage: '',
        ...withHistory(prev, prev.layers.map(l =>
          l.id === prev.activeLayerId ? { ...l, canvas: result } : l
        ), 'Denoise'),
      }));
    } catch {
      setState(prev => ({ ...prev, isProcessing: false, processingMessage: '' }));
    }
  }, [state.layers, state.activeLayerId]);

  const upscale_ = useCallback(async () => {
    const activeLayer = state.layers.find(l => l.id === state.activeLayerId);
    if (!activeLayer) return;
    setState(prev => ({ ...prev, isProcessing: true, processingMessage: 'Upscaling with bicubic interpolation...' }));
    try {
      const result = upscaleAI(activeLayer.canvas, 2);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        processingMessage: '',
        ...withHistory(prev, prev.layers.map(l =>
          l.id === prev.activeLayerId ? { ...l, canvas: result } : l
        ), 'Upscale'),
      }));
    } catch {
      setState(prev => ({ ...prev, isProcessing: false, processingMessage: '' }));
    }
  }, [state.layers, state.activeLayerId]);

  const commitDraw_ = useCallback((canvas: HTMLCanvasElement, label = 'Draw') => {
    setState(prev => ({
      ...prev,
      ...withHistory(prev, prev.layers.map(l =>
        l.id === prev.activeLayerId ? { ...l, canvas } : l
      ), label),
    }));
  }, []);

  const colorize_ = useCallback(() => {
    const activeLayer = state.layers.find(l => l.id === state.activeLayerId);
    if (!activeLayer) return;
    setState(prev => ({ ...prev, isProcessing: true, processingMessage: 'Colorizing...' }));
    try {
      const result = colorizeAI(activeLayer.canvas);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        processingMessage: '',
        ...withHistory(prev, prev.layers.map(l =>
          l.id === prev.activeLayerId ? { ...l, canvas: result } : l
        ), 'Colorize'),
      }));
    } catch {
      setState(prev => ({ ...prev, isProcessing: false, processingMessage: '' }));
    }
  }, [state.layers, state.activeLayerId]);

  const faceSwap_ = useCallback(async (sourceFile: File) => {
    const activeLayer = state.layers.find(l => l.id === state.activeLayerId);
    if (!activeLayer) return;
    setState(prev => ({ ...prev, isProcessing: true, processingMessage: 'Đang chuẩn bị...' }));
    try {
      const sourceCanvas = await fileToCanvas(sourceFile);
      const result = await faceSwapAI(activeLayer.canvas, sourceCanvas, (msg) => {
        setState(prev => ({ ...prev, processingMessage: msg }));
      });
      setState(prev => ({
        ...prev,
        isProcessing: false,
        processingMessage: '',
        ...withHistory(prev, prev.layers.map(l =>
          l.id === prev.activeLayerId ? { ...l, canvas: result } : l
        ), 'Face Swap'),
      }));
    } catch (err: any) {
      console.error('Face swap error:', err);
      alert(err?.message || 'Face swap thất bại. Hãy thử ảnh có khuôn mặt rõ hơn.');
      setState(prev => ({ ...prev, isProcessing: false, processingMessage: '' }));
    }
  }, [state.layers, state.activeLayerId]);

  const restorePhoto_ = useCallback(async () => {
    const activeLayer = state.layers.find(l => l.id === state.activeLayerId);
    if (!activeLayer) return;
    setState(prev => ({ ...prev, isProcessing: true, processingMessage: 'Đang khởi động model...' }));
    try {
      const result = await restorePhotoAI(activeLayer.canvas, (msg) => {
        setState(prev => ({ ...prev, processingMessage: msg }));
      });
      setState(prev => ({
        ...prev,
        isProcessing: false,
        processingMessage: '',
        ...withHistory(prev, prev.layers.map(l =>
          l.id === prev.activeLayerId ? { ...l, canvas: result } : l
        ), 'Restore Photo'),
      }));
    } catch {
      setState(prev => ({ ...prev, isProcessing: false, processingMessage: '' }));
    }
  }, [state.layers, state.activeLayerId]);

  const getComposedCanvas = useCallback((): HTMLCanvasElement | null => {
    if (!state.layers.length) return null;
    const base = state.layers[0];
    const canvas = document.createElement('canvas');
    canvas.width = base.canvas.width;
    canvas.height = base.canvas.height;
    const ctx = canvas.getContext('2d')!;

    for (const layer of state.layers) {
      if (!layer.visible) continue;
      ctx.globalAlpha = layer.opacity / 100;
      ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;
      ctx.drawImage(layer.canvas, 0, 0);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    return canvas;
  }, [state.layers]);

  const getRenderedCanvas = useCallback((): HTMLCanvasElement | null => {
    const composed = getComposedCanvas();
    if (!composed) return null;

    let result = composed;

    if (state.selectedFilter) {
      result = applyFilter(result, state.selectedFilter);
    }

    const hasAdjustment = Object.entries(state.adjustments).some(([k, v]) => {
      if (k === 'sharpness') return false;
      return v !== 0;
    });

    if (hasAdjustment) {
      result = applyAdjustments(result, state.adjustments);
    }

    if (state.adjustments.sharpness !== 0) {
      result = applySharpness(result, state.adjustments.sharpness);
    }

    return result;
  }, [getComposedCanvas, state.selectedFilter, state.adjustments]);

  return {
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
    setShapeType,
    setShapeFilled,
    toggleLayerVisibility,
    setActiveLayer,
    addText: addTextLayer,
    cropImage,
    undo,
    redo,
    removeBackground: removeBackground_,
    autoEnhance: autoEnhance_,
    denoise: denoise_,
    upscale: upscale_,
    colorize: colorize_,
    restorePhoto: restorePhoto_,
    faceSwap: faceSwap_,
    commitDraw: commitDraw_,
    getRenderedCanvas,
    getComposedCanvas,
  };
}
