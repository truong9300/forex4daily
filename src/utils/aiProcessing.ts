// Real AI processing using TensorFlow.js + smart algorithms

let segmenter: any = null;
let segmenterLoading = false;

async function getSegmenter() {
  if (segmenter) return segmenter;
  if (segmenterLoading) {
    // Wait for it to load
    while (segmenterLoading) await new Promise(r => setTimeout(r, 100));
    return segmenter;
  }
  segmenterLoading = true;
  try {
    const tf = await import('@tensorflow/tfjs');
    await import('@tensorflow/tfjs-backend-webgl');
    await tf.setBackend('webgl');
    await tf.ready();

    const bodySegmentation = await import('@tensorflow-models/body-segmentation');
    const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;
    segmenter = await bodySegmentation.createSegmenter(model, {
      runtime: 'tfjs' as any,
    });
  } catch (e) {
    console.error('Failed to load segmentation model:', e);
    segmenter = null;
  } finally {
    segmenterLoading = false;
  }
  return segmenter;
}

// Real AI background removal using MediaPipe Selfie Segmentation
export async function removeBackgroundAI(
  canvas: HTMLCanvasElement,
  onProgress?: (msg: string) => void
): Promise<HTMLCanvasElement> {
  onProgress?.('Loading AI model...');

  const seg = await getSegmenter();

  const out = document.createElement('canvas');
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext('2d')!;
  ctx.drawImage(canvas, 0, 0);

  if (!seg) {
    // Fallback to improved color-distance algorithm
    onProgress?.('Using smart background removal...');
    return removeBackgroundSmart(canvas);
  }

  onProgress?.('Analyzing image with AI...');

  try {
    const segmentation = await seg.segmentPeople(canvas, {
      multiSegmentation: false,
      segmentBodyParts: false,
    });

    if (!segmentation || segmentation.length === 0) {
      return removeBackgroundSmart(canvas);
    }

    onProgress?.('Applying mask...');

    const maskData = await segmentation[0].mask.toImageData();
    const imgData = ctx.getImageData(0, 0, out.width, out.height);

    for (let i = 0; i < maskData.data.length / 4; i++) {
      const alpha = maskData.data[i * 4 + 3];
      // Person pixels have high alpha in mask - keep them, remove background
      imgData.data[i * 4 + 3] = alpha;
    }

    ctx.putImageData(imgData, 0, 0);
    return out;
  } catch (e) {
    console.error('AI segmentation failed, using fallback:', e);
    return removeBackgroundSmart(canvas);
  }
}

// Smart fallback: improved color-distance with edge feathering
function removeBackgroundSmart(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext('2d')!;
  ctx.drawImage(canvas, 0, 0);

  const imageData = ctx.getImageData(0, 0, out.width, out.height);
  const data = imageData.data;
  const w = out.width;
  const h = out.height;

  // Sample background from border pixels (more samples = better)
  const bgColors: [number, number, number][] = [];
  const sampleStep = Math.max(1, Math.floor(Math.min(w, h) / 20));

  for (let x = 0; x < w; x += sampleStep) {
    const i0 = x * 4;
    const i1 = ((h - 1) * w + x) * 4;
    bgColors.push([data[i0], data[i0 + 1], data[i0 + 2]]);
    bgColors.push([data[i1], data[i1 + 1], data[i1 + 2]]);
  }
  for (let y = 0; y < h; y += sampleStep) {
    const i0 = y * w * 4;
    const i1 = (y * w + w - 1) * 4;
    bgColors.push([data[i0], data[i0 + 1], data[i0 + 2]]);
    bgColors.push([data[i1], data[i1 + 1], data[i1 + 2]]);
  }

  const threshold = 55;
  const feather = 25;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];

      let minDist = Infinity;
      for (const [cr, cg, cb] of bgColors) {
        const dist = Math.sqrt((r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2);
        if (dist < minDist) minDist = dist;
      }

      if (minDist < threshold) {
        const alpha = Math.round(Math.max(0, (minDist - (threshold - feather)) / feather) * 255);
        data[idx + 3] = alpha;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return out;
}

// Real Auto Enhance: histogram-based analysis
export function autoEnhanceAI(canvas: HTMLCanvasElement): {
  brightness: number;
  contrast: number;
  saturation: number;
  vibrance: number;
  sharpness: number;
  highlights: number;
  shadows: number;
} {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const histR = new Uint32Array(256);
  const histG = new Uint32Array(256);
  const histB = new Uint32Array(256);
  const histL = new Uint32Array(256);

  let totalSaturation = 0;
  let pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    histR[r]++;
    histG[g]++;
    histB[b]++;

    // Luminance
    const lum = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    histL[lum]++;

    // Saturation in HSL
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    const sat = max === 0 ? 0 : (max - min) / max;
    totalSaturation += sat;
  }

  // Find percentile values for auto levels
  const p1 = findPercentile(histL, pixelCount, 0.01);
  const p99 = findPercentile(histL, pixelCount, 0.99);

  // Calculate adjustments
  const range = p99 - p1;
  const idealRange = 200;
  const contrastAdjust = range < idealRange ? Math.round((idealRange / range - 1) * 40) : 0;

  const midpoint = (p1 + p99) / 2;
  const brightnessAdjust = Math.round((127 - midpoint) / 127 * 30);

  const avgSaturation = totalSaturation / pixelCount;
  const saturationAdjust = avgSaturation < 0.3 ? Math.round((0.3 - avgSaturation) * 80) : 0;

  // Shadows/highlights based on histogram distribution
  const shadowPixels = histL.slice(0, 64).reduce((a, b) => a + b, 0) / pixelCount;
  const highlightPixels = histL.slice(192, 256).reduce((a, b) => a + b, 0) / pixelCount;
  const shadowsAdjust = shadowPixels > 0.3 ? Math.round(shadowPixels * 30) : 0;
  const highlightsAdjust = highlightPixels > 0.3 ? -Math.round(highlightPixels * 20) : 0;

  return {
    brightness: Math.max(-50, Math.min(50, brightnessAdjust)),
    contrast: Math.max(0, Math.min(60, contrastAdjust)),
    saturation: Math.max(0, Math.min(60, saturationAdjust)),
    vibrance: Math.max(0, Math.min(40, saturationAdjust > 0 ? 30 : 10)),
    sharpness: 15,
    highlights: Math.max(-40, Math.min(0, highlightsAdjust)),
    shadows: Math.max(0, Math.min(40, shadowsAdjust)),
  };
}

function findPercentile(hist: Uint32Array, total: number, p: number): number {
  const target = total * p;
  let cumulative = 0;
  for (let i = 0; i < 256; i++) {
    cumulative += hist[i];
    if (cumulative >= target) return i;
  }
  return 255;
}

// Real Denoise: Bilateral Filter (edge-preserving noise reduction)
export function denoiseAI(canvas: HTMLCanvasElement, strength: number = 0.5): HTMLCanvasElement {
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

  const radius = Math.round(2 + strength * 3);       // 2–5px
  const sigmaS = 3 + strength * 5;                   // spatial sigma
  const sigmaR = 20 + strength * 40;                 // range sigma (color)

  const sigmaS2 = 2 * sigmaS * sigmaS;
  const sigmaR2 = 2 * sigmaR * sigmaR;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ci = (y * w + x) * 4;
      const cr = srcData[ci], cg = srcData[ci + 1], cb = srcData[ci + 2];

      let sumR = 0, sumG = 0, sumB = 0, sumW = 0;

      for (let ky = -radius; ky <= radius; ky++) {
        const ny = Math.min(h - 1, Math.max(0, y + ky));
        for (let kx = -radius; kx <= radius; kx++) {
          const nx = Math.min(w - 1, Math.max(0, x + kx));
          const ni = (ny * w + nx) * 4;
          const nr = srcData[ni], ng = srcData[ni + 1], nb = srcData[ni + 2];

          const spatialDist2 = kx * kx + ky * ky;
          const colorDist2 = (nr - cr) ** 2 + (ng - cg) ** 2 + (nb - cb) ** 2;

          const w_ = Math.exp(-spatialDist2 / sigmaS2 - colorDist2 / sigmaR2);
          sumR += nr * w_;
          sumG += ng * w_;
          sumB += nb * w_;
          sumW += w_;
        }
      }

      dstData[ci] = Math.round(sumR / sumW);
      dstData[ci + 1] = Math.round(sumG / sumW);
      dstData[ci + 2] = Math.round(sumB / sumW);
      dstData[ci + 3] = srcData[ci + 3];
    }
  }

  ctx.putImageData(dst, 0, 0);
  return out;
}

// Real Upscale: Bicubic interpolation (much better than browser bilinear)
export function upscaleAI(canvas: HTMLCanvasElement, factor: number = 2): HTMLCanvasElement {
  const sw = canvas.width;
  const sh = canvas.height;
  const dw = Math.round(sw * factor);
  const dh = Math.round(sh * factor);

  const src = canvas.getContext('2d')!.getImageData(0, 0, sw, sh);
  const srcData = src.data;

  const out = document.createElement('canvas');
  out.width = dw;
  out.height = dh;
  const dstCtx = out.getContext('2d')!;
  const dst = dstCtx.createImageData(dw, dh);
  const dstData = dst.data;

  function cubic(t: number): number {
    const a = -0.5;
    const at = Math.abs(t);
    if (at <= 1) return (a + 2) * at ** 3 - (a + 3) * at ** 2 + 1;
    if (at <= 2) return a * at ** 3 - 5 * a * at ** 2 + 8 * a * at - 4 * a;
    return 0;
  }

  function getSample(x: number, y: number, c: number): number {
    const xi = Math.min(sw - 1, Math.max(0, Math.round(x)));
    const yi = Math.min(sh - 1, Math.max(0, Math.round(y)));
    return srcData[(yi * sw + xi) * 4 + c];
  }

  for (let dy = 0; dy < dh; dy++) {
    for (let dx = 0; dx < dw; dx++) {
      const sx = (dx / factor);
      const sy = (dy / factor);
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      const fx = sx - x0;
      const fy = sy - y0;

      const di = (dy * dw + dx) * 4;

      for (let c = 0; c < 3; c++) {
        let val = 0;
        for (let m = -1; m <= 2; m++) {
          const wy = cubic(fy - m);
          for (let n = -1; n <= 2; n++) {
            const wx = cubic(fx - n);
            val += getSample(x0 + n, y0 + m, c) * wx * wy;
          }
        }
        dstData[di + c] = Math.min(255, Math.max(0, Math.round(val)));
      }
      dstData[di + 3] = getSample(x0, y0, 3);
    }
  }

  dstCtx.putImageData(dst, 0, 0);
  return out;
}

// Colorize: enhance colors of desaturated image intelligently
export function colorizeAI(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext('2d')!;
  ctx.drawImage(canvas, 0, 0);

  const imageData = ctx.getImageData(0, 0, out.width, out.height);
  const data = imageData.data;

  // Check if image is grayscale
  let isGrayscale = true;
  for (let i = 0; i < Math.min(data.length, 10000); i += 4) {
    if (Math.abs(data[i] - data[i + 1]) > 8 || Math.abs(data[i + 1] - data[i + 2]) > 8) {
      isGrayscale = false;
      break;
    }
  }

  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];

    if (isGrayscale) {
      // For B&W images: add warm tones to highlights, cool to shadows
      if (lum > 180) {
        // Highlights → warm golden
        data[i] = Math.min(255, data[i] + 15);
        data[i + 1] = Math.min(255, data[i + 1] + 8);
        data[i + 2] = Math.max(0, data[i + 2] - 10);
      } else if (lum > 80) {
        // Midtones → slight warm
        data[i] = Math.min(255, data[i] + 8);
        data[i + 2] = Math.max(0, data[i + 2] - 5);
      } else {
        // Shadows → cool blue
        data[i] = Math.max(0, data[i] - 5);
        data[i + 2] = Math.min(255, data[i + 2] + 12);
      }
    } else {
      // For color images: boost saturation intelligently
      const max = Math.max(data[i], data[i + 1], data[i + 2]);
      const min = Math.min(data[i], data[i + 1], data[i + 2]);
      const chroma = max - min;
      if (chroma < 60) {
        // Low saturation → boost
        const boost = 1 + (60 - chroma) / 60 * 0.6;
        data[i] = Math.min(255, Math.round(lum + (data[i] - lum) * boost));
        data[i + 1] = Math.min(255, Math.round(lum + (data[i + 1] - lum) * boost));
        data[i + 2] = Math.min(255, Math.round(lum + (data[i + 2] - lum) * boost));
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return out;
}
