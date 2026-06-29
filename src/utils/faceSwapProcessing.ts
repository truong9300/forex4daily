// Face swap using MediaPipe FaceMesh (TF.js) + canvas affine transform + alpha blending

let faceModel: any = null;
let faceModelLoading = false;

// MediaPipe FaceMesh key landmark indices
const LEFT_EYE_CENTER = 468;   // refined left eye center (with refineLandmarks)
const RIGHT_EYE_CENTER = 473;  // refined right eye center
const LEFT_EYE_FALLBACK = 33;
const RIGHT_EYE_FALLBACK = 263;
const NOSE_TIP = 1;

// Face oval indices for mask
const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
  397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
  172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10
];

async function getFaceModel(onProgress?: (msg: string) => void): Promise<any> {
  if (faceModel) return faceModel;
  if (faceModelLoading) {
    while (faceModelLoading) await new Promise(r => setTimeout(r, 100));
    return faceModel;
  }
  faceModelLoading = true;
  try {
    onProgress?.('Đang tải face detection model (~3MB)...');
    const tf = await import('@tensorflow/tfjs');
    await import('@tensorflow/tfjs-backend-webgl');
    await tf.setBackend('webgl');
    await tf.ready();

    const faceLandmarks = await import('@tensorflow-models/face-landmarks-detection');
    faceModel = await faceLandmarks.createDetector(
      faceLandmarks.SupportedModels.MediaPipeFaceMesh,
      { runtime: 'tfjs' as any, maxFaces: 1, refineLandmarks: true }
    );
    onProgress?.('Model đã tải xong');
  } catch (e) {
    console.error('Face model load failed:', e);
    faceModel = null;
  } finally {
    faceModelLoading = false;
  }
  return faceModel;
}

interface Point { x: number; y: number }

function getEyeCenters(kps: Point[], refined: boolean): { left: Point; right: Point; nose: Point } {
  if (refined && kps.length > 473) {
    return {
      left: kps[LEFT_EYE_CENTER],
      right: kps[RIGHT_EYE_CENTER],
      nose: kps[NOSE_TIP],
    };
  }
  // Fallback: average of eye corner landmarks
  return {
    left: kps[LEFT_EYE_FALLBACK],
    right: kps[RIGHT_EYE_FALLBACK],
    nose: kps[NOSE_TIP],
  };
}

// Draw warped source face onto result canvas using affine canvas transform
function warpFaceOnto(
  result: HTMLCanvasElement,
  source: HTMLCanvasElement,
  srcLeft: Point, srcRight: Point,
  dstLeft: Point, dstRight: Point
): HTMLCanvasElement {
  const ctx = result.getContext('2d')!;

  // Eye distance and angle in source
  const srcDx = srcRight.x - srcLeft.x;
  const srcDy = srcRight.y - srcLeft.y;
  const srcDist = Math.hypot(srcDx, srcDy);
  const srcAngle = Math.atan2(srcDy, srcDx);

  // Eye distance and angle in target
  const dstDx = dstRight.x - dstLeft.x;
  const dstDy = dstRight.y - dstLeft.y;
  const dstDist = Math.hypot(dstDx, dstDy);
  const dstAngle = Math.atan2(dstDy, dstDx);

  const scale = dstDist / (srcDist || 1);
  const angle = dstAngle - srcAngle;

  // Transform: translate src left eye to origin, scale+rotate, translate to dst left eye
  ctx.save();
  ctx.translate(dstLeft.x, dstLeft.y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.translate(-srcLeft.x, -srcLeft.y);
  ctx.drawImage(source, 0, 0);
  ctx.restore();

  return result;
}

// Create a smooth face mask using the face oval landmarks
function createFaceMask(
  width: number,
  height: number,
  keypoints: Point[],
  feather: number = 20
): HTMLCanvasElement {
  const mask = document.createElement('canvas');
  mask.width = width;
  mask.height = height;
  const ctx = mask.getContext('2d')!;

  // Draw face oval path
  ctx.beginPath();
  const pts = FACE_OVAL.map(i => keypoints[i]).filter(Boolean);
  if (pts.length < 3) {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    return mask;
  }
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fillStyle = 'white';
  ctx.fill();

  // Feather: shrink slightly and re-draw with blur effect via shadow
  // Simulated feather via multiple strokes with decreasing alpha
  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';
  for (let i = 0; i < feather; i++) {
    const alpha = i / feather;
    ctx.strokeStyle = `rgba(0,0,0,${1 - alpha})`;
    ctx.lineWidth = (feather - i) * 2;
    ctx.stroke();
  }
  ctx.restore();

  return mask;
}

// Match average color of warped face to target face region
function colorCorrect(
  warped: HTMLCanvasElement,
  target: HTMLCanvasElement,
  mask: HTMLCanvasElement
): HTMLCanvasElement {
  const wCtx = warped.getContext('2d')!;
  const tCtx = target.getContext('2d')!;
  const mCtx = mask.getContext('2d')!;

  const w = warped.width, h = warped.height;
  const wData = wCtx.getImageData(0, 0, w, h);
  const tData = tCtx.getImageData(0, 0, w, h);
  const mData = mCtx.getImageData(0, 0, w, h);

  // Compute average color in masked region for both
  let wR = 0, wG = 0, wB = 0, wCount = 0;
  let tR = 0, tG = 0, tB = 0, tCount = 0;

  for (let i = 0; i < w * h; i++) {
    const alpha = mData.data[i * 4] / 255; // mask R channel
    if (alpha > 0.5) {
      wR += wData.data[i * 4];
      wG += wData.data[i * 4 + 1];
      wB += wData.data[i * 4 + 2];
      wCount++;
      tR += tData.data[i * 4];
      tG += tData.data[i * 4 + 1];
      tB += tData.data[i * 4 + 2];
      tCount++;
    }
  }

  if (wCount === 0 || tCount === 0) return warped;

  const rScale = (tR / tCount) / ((wR / wCount) || 1);
  const gScale = (tG / tCount) / ((wG / wCount) || 1);
  const bScale = (tB / tCount) / ((wB / wCount) || 1);

  // Clamp scales to reasonable range (avoid extreme corrections)
  const clamp = (v: number) => Math.max(0.5, Math.min(2.0, v));
  const rs = clamp(rScale), gs = clamp(gScale), bs = clamp(bScale);

  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const outCtx = out.getContext('2d')!;
  const outData = outCtx.createImageData(w, h);

  for (let i = 0; i < w * h; i++) {
    outData.data[i * 4] = Math.min(255, wData.data[i * 4] * rs);
    outData.data[i * 4 + 1] = Math.min(255, wData.data[i * 4 + 1] * gs);
    outData.data[i * 4 + 2] = Math.min(255, wData.data[i * 4 + 2] * bs);
    outData.data[i * 4 + 3] = wData.data[i * 4 + 3];
  }

  outCtx.putImageData(outData, 0, 0);
  return out;
}

// Final blend: paste corrected warped face onto target using smooth mask
function blendWithMask(
  target: HTMLCanvasElement,
  warped: HTMLCanvasElement,
  mask: HTMLCanvasElement
): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = target.width;
  out.height = target.height;
  const ctx = out.getContext('2d')!;

  // 1. Draw target background
  ctx.drawImage(target, 0, 0);

  // 2. Draw warped face, clipped to mask
  // Create a temp canvas with warped * mask
  const tmp = document.createElement('canvas');
  tmp.width = target.width;
  tmp.height = target.height;
  const tCtx = tmp.getContext('2d')!;
  tCtx.drawImage(warped, 0, 0);
  tCtx.globalCompositeOperation = 'destination-in';
  tCtx.drawImage(mask, 0, 0);

  ctx.drawImage(tmp, 0, 0);
  return out;
}

export async function faceSwapAI(
  targetCanvas: HTMLCanvasElement,
  sourceCanvas: HTMLCanvasElement,
  onProgress?: (msg: string) => void
): Promise<HTMLCanvasElement> {
  const model = await getFaceModel(onProgress);

  if (!model) throw new Error('Không thể tải face model. Vui lòng thử lại.');

  onProgress?.('Đang phát hiện khuôn mặt...');

  const [targetFaces, sourceFaces] = await Promise.all([
    model.estimateFaces(targetCanvas),
    model.estimateFaces(sourceCanvas),
  ]);

  if (targetFaces.length === 0) throw new Error('Không tìm thấy khuôn mặt trong ảnh đích!');
  if (sourceFaces.length === 0) throw new Error('Không tìm thấy khuôn mặt trong ảnh nguồn!');

  const tKps: Point[] = targetFaces[0].keypoints;
  const sKps: Point[] = sourceFaces[0].keypoints;
  const refined = tKps.length > 467;

  const { left: dstLeft, right: dstRight } = getEyeCenters(tKps, refined);
  const { left: srcLeft, right: srcRight } = getEyeCenters(sKps, refined);

  onProgress?.('Đang căn chỉnh khuôn mặt...');

  // Warp source face onto a blank canvas the same size as target
  const warpedCanvas = document.createElement('canvas');
  warpedCanvas.width = targetCanvas.width;
  warpedCanvas.height = targetCanvas.height;
  warpFaceOnto(warpedCanvas, sourceCanvas, srcLeft, srcRight, dstLeft, dstRight);

  onProgress?.('Đang tạo mask khuôn mặt...');
  const mask = createFaceMask(targetCanvas.width, targetCanvas.height, tKps);

  onProgress?.('Đang chỉnh màu...');
  const correctedWarped = colorCorrect(warpedCanvas, targetCanvas, mask);

  onProgress?.('Đang ghép khuôn mặt...');
  const result = blendWithMask(targetCanvas, correctedWarped, mask);

  return result;
}
