import type { Adjustments } from '../types/editor';

export function applyAdjustments(
  sourceCanvas: HTMLCanvasElement,
  adjustments: Adjustments
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(sourceCanvas, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] / 255;
    let g = data[i + 1] / 255;
    let b = data[i + 2] / 255;

    // Exposure
    const expFactor = Math.pow(2, adjustments.exposure / 100);
    r *= expFactor;
    g *= expFactor;
    b *= expFactor;

    // Brightness
    const bright = adjustments.brightness / 100;
    r += bright;
    g += bright;
    b += bright;

    // Temperature (warm/cool)
    const temp = adjustments.temperature / 200;
    r += temp;
    b -= temp;

    // Tint
    const tintVal = adjustments.tint / 200;
    g += tintVal;

    // Highlights & Shadows
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const highlightFactor = adjustments.highlights / 200;
    const shadowFactor = adjustments.shadows / 200;
    if (lum > 0.5) {
      const hl = (lum - 0.5) * 2;
      r += hl * highlightFactor;
      g += hl * highlightFactor;
      b += hl * highlightFactor;
    } else {
      const sl = (0.5 - lum) * 2;
      r += sl * shadowFactor;
      g += sl * shadowFactor;
      b += sl * shadowFactor;
    }

    // Contrast
    const contrastFactor = (adjustments.contrast + 100) / 100;
    r = (r - 0.5) * contrastFactor + 0.5;
    g = (g - 0.5) * contrastFactor + 0.5;
    b = (b - 0.5) * contrastFactor + 0.5;

    // Saturation & Vibrance
    const grayR = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const satFactor = 1 + adjustments.saturation / 100;
    const vibFactor = adjustments.vibrance / 100;
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const chromaVal = maxC - minC;
    const vibMask = 1 - chromaVal;
    r = grayR + (r - grayR) * (satFactor + vibFactor * vibMask);
    g = grayR + (g - grayR) * (satFactor + vibFactor * vibMask);
    b = grayR + (b - grayR) * (satFactor + vibFactor * vibMask);

    // Whites & Blacks
    const whiteFactor = adjustments.whites / 200;
    const blackFactor = adjustments.blacks / 200;
    r = r + (1 - r) * whiteFactor + r * blackFactor * -1;
    g = g + (1 - g) * whiteFactor + g * blackFactor * -1;
    b = b + (1 - b) * whiteFactor + b * blackFactor * -1;

    // Hue rotation (simple RGB approximation)
    if (adjustments.hue !== 0) {
      const hueShift = adjustments.hue / 180 * Math.PI;
      const cosH = Math.cos(hueShift);
      const sinH = Math.sin(hueShift);
      const rNew = r * (0.299 + cosH * 0.701 - sinH * 0.168)
        + g * (0.587 - cosH * 0.587 - sinH * 0.330)
        + b * (0.114 - cosH * 0.114 + sinH * 0.498);
      const gNew = r * (0.299 - cosH * 0.299 + sinH * 0.328)
        + g * (0.587 + cosH * 0.413 + sinH * 0.035)
        + b * (0.114 - cosH * 0.114 - sinH * 0.292);
      const bNew = r * (0.299 - cosH * 0.299 - sinH * 0.900)
        + g * (0.587 - cosH * 0.587 + sinH * 0.430)
        + b * (0.114 + cosH * 0.886 + sinH * 0.015);
      r = rNew; g = gNew; b = bNew;
    }

    // Clamp and write
    data[i] = Math.round(Math.min(255, Math.max(0, r * 255)));
    data[i + 1] = Math.round(Math.min(255, Math.max(0, g * 255)));
    data[i + 2] = Math.round(Math.min(255, Math.max(0, b * 255)));
  }

  ctx.putImageData(imageData, 0, 0);

  // Vignette
  if (adjustments.vignette !== 0) {
    const vCtx = canvas.getContext('2d')!;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r2 = Math.sqrt(cx * cx + cy * cy);
    const gradient = vCtx.createRadialGradient(cx, cy, r2 * 0.3, cx, cy, r2);
    const vigStrength = adjustments.vignette / 100;
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(0,0,0,${Math.abs(vigStrength) * 0.9})`);
    vCtx.globalCompositeOperation = vigStrength > 0 ? 'multiply' : 'screen';
    vCtx.fillStyle = gradient;
    vCtx.fillRect(0, 0, canvas.width, canvas.height);
    vCtx.globalCompositeOperation = 'source-over';
  }

  return canvas;
}

export function applyFilter(canvas: HTMLCanvasElement, filterType: string): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext('2d')!;
  ctx.drawImage(canvas, 0, 0);
  const imageData = ctx.getImageData(0, 0, out.width, out.height);
  const data = imageData.data;

  switch (filterType) {
    case 'grayscale':
      for (let i = 0; i < data.length; i += 4) {
        const avg = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        data[i] = data[i + 1] = data[i + 2] = avg;
      }
      break;

    case 'sepia':
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
        data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
        data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
      }
      break;

    case 'vivid':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.3);
        data[i + 1] = Math.min(255, data[i + 1] * 1.2);
        data[i + 2] = Math.min(255, data[i + 2] * 1.2);
      }
      break;

    case 'cool':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.max(0, data[i] - 20);
        data[i + 2] = Math.min(255, data[i + 2] + 30);
      }
      break;

    case 'warm':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] + 30);
        data[i + 1] = Math.min(255, data[i + 1] + 10);
        data[i + 2] = Math.max(0, data[i + 2] - 20);
      }
      break;

    case 'vintage':
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        data[i] = Math.min(255, r * 0.9 + 40);
        data[i + 1] = Math.min(255, g * 0.85 + 20);
        data[i + 2] = Math.min(255, b * 0.7 + 10);
      }
      break;

    case 'noir':
      for (let i = 0; i < data.length; i += 4) {
        const avg = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        const contrasted = ((avg / 255 - 0.5) * 2 + 0.5) * 255;
        data[i] = data[i + 1] = data[i + 2] = Math.min(255, Math.max(0, contrasted));
      }
      break;

    case 'fade':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i] * 0.85 + 30;
        data[i + 1] = data[i + 1] * 0.85 + 30;
        data[i + 2] = data[i + 2] * 0.85 + 30;
      }
      break;

    case 'chrome':
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        data[i] = Math.min(255, r * 1.1 + 10);
        data[i + 1] = Math.min(255, g * 1.05);
        data[i + 2] = Math.min(255, b * 0.9 + 20);
      }
      break;

    case 'lomo':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.2);
        data[i + 1] = Math.max(0, data[i + 1] * 0.9);
        data[i + 2] = Math.min(255, data[i + 2] * 1.1);
      }
      break;
  }

  ctx.putImageData(imageData, 0, 0);
  return out;
}

export function applySharpness(canvas: HTMLCanvasElement, amount: number): HTMLCanvasElement {
  if (amount === 0) return canvas;
  const out = document.createElement('canvas');
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext('2d')!;
  ctx.drawImage(canvas, 0, 0);

  const src = ctx.getImageData(0, 0, out.width, out.height);
  const dst = ctx.createImageData(out.width, out.height);
  const srcData = src.data;
  const dstData = dst.data;
  const w = out.width;
  const h = out.height;
  const k = amount / 100;

  const kernel = [
    0, -k, 0,
    -k, 1 + 4 * k, -k,
    0, -k, 0
  ];

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        let val = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const kidx = ((y + ky) * w + (x + kx)) * 4 + c;
            val += srcData[kidx] * kernel[(ky + 1) * 3 + (kx + 1)];
          }
        }
        dstData[idx + c] = Math.min(255, Math.max(0, val));
      }
      dstData[idx + 3] = srcData[idx + 3];
    }
  }

  ctx.putImageData(dst, 0, 0);
  return out;
}

export function removeBackground(imageCanvas: HTMLCanvasElement): Promise<HTMLCanvasElement> {
  return new Promise((resolve) => {
    const out = document.createElement('canvas');
    out.width = imageCanvas.width;
    out.height = imageCanvas.height;
    const ctx = out.getContext('2d')!;
    ctx.drawImage(imageCanvas, 0, 0);
    const imageData = ctx.getImageData(0, 0, out.width, out.height);
    const data = imageData.data;
    const w = out.width;
    const h = out.height;

    // Simple edge-based background removal (color distance from corners)
    const cornerColors: number[][] = [];
    const corners = [
      [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
      [Math.floor(w / 2), 0], [0, Math.floor(h / 2)],
      [w - 1, Math.floor(h / 2)], [Math.floor(w / 2), h - 1]
    ];

    for (const [cx, cy] of corners) {
      const idx = (cy * w + cx) * 4;
      cornerColors.push([data[idx], data[idx + 1], data[idx + 2]]);
    }

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2];

        let minDist = Infinity;
        for (const [cr, cg, cb] of cornerColors) {
          const dist = Math.sqrt((r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2);
          minDist = Math.min(minDist, dist);
        }

        // Threshold-based alpha
        const threshold = 60;
        const feather = 30;
        if (minDist < threshold) {
          data[idx + 3] = Math.round(Math.max(0, (minDist - (threshold - feather)) / feather) * 255);
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    resolve(out);
  });
}

export function imageToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  return canvas;
}

export function cloneCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  canvas.getContext('2d')!.drawImage(source, 0, 0);
  return canvas;
}

export function canvasToDataURL(canvas: HTMLCanvasElement, format = 'image/png'): string {
  return canvas.toDataURL(format, 0.95);
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string, format = 'image/png') {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvasToDataURL(canvas, format);
  link.click();
}
