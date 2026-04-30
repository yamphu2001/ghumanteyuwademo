// utils/location.ts
export const getCurrentLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) reject(new Error("No Geolocation"));
    navigator.geolocation.getCurrentPosition(resolve, reject, { 
      enableHighAccuracy: true 
    });
  });
};