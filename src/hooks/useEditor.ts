import { useState, useCallback, useRef } from 'react';
import type { EditorState, Adjustments, Tool, Layer } from '../types/editor';
import { imageToCanvas, applyAdjustments, applyFilter, applySharpness } from '../utils/imageProcessing';
import { removeBackgroundAI, autoEnhanceAI, denoiseAI, upscaleAI, colorizeAI } from '../utils/aiProcessing';

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
  history: [],
  historyIndex: -1,
  selectedFilter: null,
  isProcessing: false,
  processingMessage: '',
};

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
        history: [],
        historyIndex: -1,
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
    const canvas = document.createElement('canvas');
    canvas.width = state.layers[0]?.canvas.width || 800;
    canvas.height = state.layers[0]?.canvas.height || 600;
    const ctx = canvas.getContext('2d')!;
    ctx.font = '48px Arial';
    ctx.fillStyle = state.brushColor;
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
    setState(prev => ({
      ...prev,
      layers: [...prev.layers, layer],
      activeLayerId: layer.id,
    }));
  }, [state.layers, state.brushColor]);

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
        layers: prev.layers.map(l =>
          l.id === prev.activeLayerId ? { ...l, canvas: result } : l
        ),
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
        layers: prev.layers.map(l =>
          l.id === prev.activeLayerId ? { ...l, canvas: result } : l
        ),
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
        layers: prev.layers.map(l =>
          l.id === prev.activeLayerId ? { ...l, canvas: result } : l
        ),
      }));
    } catch {
      setState(prev => ({ ...prev, isProcessing: false, processingMessage: '' }));
    }
  }, [state.layers, state.activeLayerId]);

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
        layers: prev.layers.map(l =>
          l.id === prev.activeLayerId ? { ...l, canvas: result } : l
        ),
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
    toggleLayerVisibility,
    setActiveLayer,
    addTextLayer,
    removeBackground: removeBackground_,
    autoEnhance: autoEnhance_,
    denoise: denoise_,
    upscale: upscale_,
    colorize: colorize_,
    getRenderedCanvas,
    getComposedCanvas,
  };
}
