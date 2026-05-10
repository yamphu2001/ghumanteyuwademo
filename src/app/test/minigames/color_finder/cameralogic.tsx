/**
 * cameralogic.ts
 */

export interface CaptureConfig {
  x: number;          // Percentage 0-100
  y: number;          // Percentage 0-100
  size: number;       // Base size in pixels
  rotation: number;   // Degrees
  aspectRatio: 'portrait' | 'landscape' | 'square';
  isFront: boolean;
}

/**
 * 1. Process the video frame and sticker into a high-res Blob
 */
export const processAndCapture = async (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  stickerImg: HTMLImageElement | null,
  config: CaptureConfig
): Promise<Blob | null> => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const dpr = window.devicePixelRatio || 2;
  const nativeW = video.videoWidth;
  const nativeH = video.videoHeight;

  let drawW = nativeW;
  let drawH = nativeH;

  if (config.aspectRatio === 'portrait') {
    drawW = nativeH * (9 / 16);
  } else if (config.aspectRatio === 'landscape') {
    drawH = nativeW * (9 / 16);
  } else if (config.aspectRatio === 'square') {
    const size = Math.min(nativeW, nativeH);
    drawW = size;
    drawH = size;
  }

  canvas.width = drawW * dpr;
  canvas.height = drawH * dpr;
  ctx.scale(dpr, dpr);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const offsetX = (nativeW - drawW) / 2;
  const offsetY = (nativeH - drawH) / 2;

  ctx.save();
  if (config.isFront) {
    ctx.translate(drawW, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, offsetX, offsetY, drawW, drawH, 0, 0, drawW, drawH);
  ctx.restore();

  if (stickerImg) {
    const xPx = (config.x / 100) * drawW;
    const yPx = (config.y / 100) * drawH;
    const previewWidth = video.clientWidth;
    const resolutionScale = drawW / previewWidth;
    
    const finalStickerW = config.size * resolutionScale;
    const finalStickerH = (stickerImg.naturalHeight / stickerImg.naturalWidth) * finalStickerW;

    ctx.save();
    ctx.translate(xPx, yPx);
    ctx.rotate((config.rotation * Math.PI) / 180);
    ctx.drawImage(stickerImg, -finalStickerW / 2, -finalStickerH / 2, finalStickerW, finalStickerH);
    ctx.restore();
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
};

/**
 * 2. Triggers the Native Phone Share/Save Sheet
 */
export const saveToPhoneGallery = async (blob: Blob, fileName: string = 'yuwa_memory.png') => {
  if (!blob) return;

  const file = new File([blob], fileName, { type: 'image/png' });

  // Web Share API triggers the "Save Image" menu on iOS/Android
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'Ghumante Yuwa Capture',
      });
    } catch (err) {
      console.warn('Share menu dismissed');
    }
  } else {
    // Desktop Fallback: Downloads the file
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};