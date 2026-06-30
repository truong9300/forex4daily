export type Tool =
  | 'select'
  | 'crop'
  | 'brush'
  | 'eraser'
  | 'text'
  | 'shape'
  | 'eyedropper'
  | 'zoom'
  | 'pan'
  | 'heal'
  | 'clone';

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: BlendMode;
  canvas: HTMLCanvasElement;
  type: 'image' | 'adjustment' | 'text' | 'shape';
}

export interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  exposure: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  clarity: number;
  vibrance: number;
  temperature: number;
  tint: number;
  sharpness: number;
  noiseReduction: number;
  vignette: number;
}

export interface Filter {
  id: string;
  name: string;
  thumbnail: string;
  apply: (imageData: ImageData) => ImageData;
}

export interface HistoryEntry {
  id: string;
  label: string;
  timestamp: number;
  layers: Layer[];
  activeLayerId: string | null;
}

export type ShapeType = 'rectangle' | 'ellipse' | 'line';

export interface EditorState {
  image: HTMLImageElement | null;
  layers: Layer[];
  activeLayerId: string | null;
  activeTool: Tool;
  adjustments: Adjustments;
  zoom: number;
  panX: number;
  panY: number;
  brushSize: number;
  brushColor: string;
  brushOpacity: number;
  shapeType: ShapeType;
  shapeFilled: boolean;
  history: HistoryEntry[];
  historyIndex: number;
  selectedFilter: string | null;
  isProcessing: boolean;
  processingMessage: string;
}
