export interface UserDeviceData {
  identity: {
    os: 'ios' | 'android' | 'desktop' | 'unknown';
    browser: string;
    pixelRatio: number;
    isPWA: boolean;
  };
  location: {
    lat: number | null;
    lng: number | null;
    altitude: number | null;
    heading: number | null;
    speed: number | null;
    accuracy: number | null;
  };
  hardware: {
    gpu: string;
    ram: number | 'unknown';
    cores: number;
    canVibrate: boolean;
    hasCamera: boolean; // New field
  };
  session: {
    startTime: string;
    timezone: string;
    language: string;
    isOnline: boolean;
  };
}

const STORAGE_KEY = 'user_device_data_cache';

export const getFullDeviceData = async (requestPermissions = false): Promise<UserDeviceData> => {
  const ua = navigator.userAgent;

  // 1. Detect OS
  let os: UserDeviceData['identity']['os'] = 'unknown';
  if (/android/i.test(ua)) os = 'android';
  else if (/iPad|iPhone|iPod/.test(ua)) os = 'ios';
  else if (!/Mobi|Android/i.test(ua)) os = 'desktop';

  // 2. Location Logic (Conditional Prompt)
  let locationData: UserDeviceData['location'] = { lat: null, lng: null, altitude: null, heading: null, speed: null, accuracy: null };
  
  if (requestPermissions && "geolocation" in navigator) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 });
      });
      locationData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        altitude: position.coords.altitude,
        heading: position.coords.heading,
        speed: position.coords.speed,
        accuracy: position.coords.accuracy,
      };
    } catch (e) {
      console.warn("Location access denied or timed out.");
    }
  }

  // 3. Camera Check (Conditional Prompt)
  let hasCamera = false;
  if (requestPermissions && navigator.mediaDevices?.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      hasCamera = true;
      // Immediately stop the stream to turn off the camera light
      stream.getTracks().forEach(track => track.stop());
    } catch (e) {
      console.warn("Camera access denied.");
    }
  }

  // 4. Hardware & GPU
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl');
  const debugInfo = gl?.getExtension('WEBGL_debug_renderer_info');
  const gpu = debugInfo ? gl?.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "Unknown GPU";

  const data: UserDeviceData = {
    identity: {
      os,
      browser: navigator.vendor || 'Unknown Browser',
      pixelRatio: window.devicePixelRatio || 1,
      isPWA: window.matchMedia('(display-mode: standalone)').matches,
    },
    location: locationData,
    hardware: {
      gpu,
      ram: (navigator as any).deviceMemory || 'unknown',
      cores: navigator.hardwareConcurrency || 0,
      canVibrate: typeof navigator.vibrate === 'function',
      hasCamera,
    },
    session: {
      startTime: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      isOnline: navigator.onLine,
    }
  };

  // 5. Save to Local Storage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  return data;
};

// Helper to retrieve the last saved data without re-prompting
export const getCachedDeviceData = (): UserDeviceData | null => {
  const cached = localStorage.getItem(STORAGE_KEY);
  return cached ? JSON.parse(cached) : null;
};