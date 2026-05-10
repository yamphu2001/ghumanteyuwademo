import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { LocationData } from '@/features/forevent/frontend/play/Markers/SpecialMarkers/logic';

export async function fetchSpecialMarkers(): Promise<LocationData[]> {
  const snapshot = await getDocs(collection(db, 'specialmarkers'));

  return snapshot.docs.map(doc => {
    const data = doc.data();
    
    return {
      id: doc.id,
      name: data.name,
      popupText: data.popupText,
      type: data.type,
      image: data.image,
      // Flat properties for the interface
      lat: Number(data.lat), 
      lng: Number(data.lng),
      // The coordinates property expects an ARRAY [lat, lng]
      coordinates: [Number(data.lat), Number(data.lng)],
    } as LocationData;
  });
}