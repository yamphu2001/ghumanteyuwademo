import jsQR from 'jsqr';

/**
 * Processes a video frame to detect a QR code.
 */
export const scanFrameLogic = (
  video: HTMLVideoElement, 
  canvas: HTMLCanvasElement
): string | null => {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;

  // Set canvas size to match video feed
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // Draw current frame to canvas
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // Extract pixels
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  
  // Try to find a QR code
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "dontInvert",
  });

  return code ? code.data : null;
};

// ... keep your existing getLayout logic here too