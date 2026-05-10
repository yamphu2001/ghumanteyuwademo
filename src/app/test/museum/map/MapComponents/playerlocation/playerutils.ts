// Location Tracking
export function startLocationTracking(
  useTestLocation: boolean,
  onLocation: (coords: [number, number]) => void
): () => void {
  if (useTestLocation) {
    onLocation([85.3072909247585, 27.703773862811907]);
    return () => {};
  }

  if (!navigator.geolocation) {
    console.error("Geolocation not supported");
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      onLocation([position.coords.longitude, position.coords.latitude]);
    },
    (error) => console.error("Location error:", error),
    { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
  );

  return () => navigator.geolocation.clearWatch(watchId);
}

// Orientation Tracking
interface DeviceOrientationEventExtended extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

export function startOrientationTracking(
  onHeading: (heading: number) => void
): () => void {
  const handler = (event: DeviceOrientationEventExtended) => {
    if (event.alpha === null) return;
    const heading = event.webkitCompassHeading ?? event.alpha;
    onHeading(heading);
  };

  const start = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === "granted") {
          window.addEventListener("deviceorientation", handler as EventListener, true);
        }
      } catch (err) {
        console.error("Orientation permission error:", err);
      }
    } else {
      window.addEventListener("deviceorientation", handler as EventListener, true);
    }
  };

  start();

  return () => {
    window.removeEventListener("deviceorientation", handler as EventListener, true);
  };
}