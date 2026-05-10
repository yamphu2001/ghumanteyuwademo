// lib/permissions.ts

export const requestPermissions = {
  /**
   * Requests Camera Access
   * Includes a fallback mechanism for different hardware types
   */
  async camera() {
    console.log("System: Initializing Camera Request...");

    // 1. Check for Secure Context / API support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMsg = "Camera API not available. Ensure you are on HTTPS or localhost.";
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      // 2. Attempt standard video request
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 } }, 
        audio: false 
      });
      
      // Immediately shut down the stream to turn the light off
      stream.getTracks().forEach(track => track.stop());
      
      console.log("System: Camera Access Granted.");
      return { success: true };

    } catch (primaryError: any) {
      console.warn(`System: Primary camera request failed (${primaryError.name}). Trying fallback...`);

      try {
        // 3. Fallback: Request "any" video device with zero constraints
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        fallbackStream.getTracks().forEach(track => track.stop());
        
        console.log("System: Camera Access Granted via Fallback.");
        return { success: true };

      } catch (fallbackError: any) {
        // 4. Handle specific error types for better UI feedback
        let userMessage = "Camera access failed.";
        
        if (fallbackError.name === 'NotAllowedError' || fallbackError.name === 'PermissionDeniedError') {
          userMessage = "Permission denied. Please enable camera access in your browser settings.";
        } else if (fallbackError.name === 'NotFoundError' || fallbackError.name === 'DevicesNotFoundError') {
          userMessage = "No camera hardware detected. Plug in a camera and try again.";
        } else if (fallbackError.name === 'NotReadableError' || fallbackError.name === 'TrackStartError') {
          userMessage = "Camera is already in use by another application.";
        }

        console.error("System: Final Camera Error:", fallbackError.name, fallbackError.message);
        return { success: false, error: userMessage };
      }
    }
  },

  /**
   * Requests Geolocation Access
   * Includes a timeout to prevent the promise from hanging indefinitely
   */
  async location() {
    console.log("System: Initializing Location Request...");

    if (!navigator.geolocation) {
      const errorMsg = "Geolocation is not supported by this browser.";
      return { success: false, error: errorMsg };
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("System: Location Access Granted.");
          resolve({ 
            success: true, 
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            } 
          });
        },
        (error) => {
          let userMessage = "Location access failed.";
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              userMessage = "User denied the request for Geolocation.";
              break;
            case error.POSITION_UNAVAILABLE:
              userMessage = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              userMessage = "The request to get user location timed out.";
              break;
          }

          console.error("System: Location Error:", error.message);
          resolve({ success: false, error: userMessage });
        },
        { 
          enableHighAccuracy: true, 
          timeout: 10000, // 10 seconds
          maximumAge: 0 
        }
      );
    });
  }
};