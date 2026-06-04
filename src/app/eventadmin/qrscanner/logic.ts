
import jsQR from "jsqr";

export function scanFrameLogic(video: HTMLVideoElement, canvas: HTMLCanvasElement): string | null {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  // Draw current frame onto our dynamically sized matching canvas surface map
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Extract raw pixel arrays directly out of the matched layout boundaries
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "attemptBoth",
  });

  return code ? code.data : null;
}