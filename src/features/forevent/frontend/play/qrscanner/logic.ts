
// import jsQR from 'jsqr';

// export const scanFrameLogic = (
//   video: HTMLVideoElement, 
//   canvas: HTMLCanvasElement
// ): string | null => {
//   if (video.videoWidth === 0 || video.videoHeight === 0) return null;

//   const context = canvas.getContext('2d', { willReadFrequently: true });
//   if (!context) return null;

//   if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
//     canvas.width = video.videoWidth;
//     canvas.height = video.videoHeight;
//   }

//   context.drawImage(video, 0, 0, canvas.width, canvas.height);
//   const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  
//   const code = jsQR(imageData.data, imageData.width, imageData.height, {
//     inversionAttempts: "dontInvert", 
//   });

//   return code ? code.data : null;
// };



import jsQR from 'jsqr';

/**
 * Captures a frame from the video, draws it to a hidden canvas,
 * and uses jsQR to detect any QR code data.
 */
export const scanFrameLogic = (
  video: HTMLVideoElement, 
  canvas: HTMLCanvasElement
): string | null => {
  // Ensure the video has data before attempting to draw
  if (video.videoWidth === 0 || video.videoHeight === 0) return null;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;

  // Sync canvas size to video feed only if it changed
  if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }

  // Draw current video frame to canvas
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // Extract pixel data
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
  inversionAttempts: "attemptBoth", // was "dontInvert"
});
  // Return decoded string or null if no code found
  return code ? code.data : null;
};

