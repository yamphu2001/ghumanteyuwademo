
export type MarkerType = 'special';

export interface LocationData {
  id: string;
  name: string;
  popupText: string;
  lat: number;
  lng: number;
  type: string;
  image?: string;
  coordinates: [number, number]; 
  points?: number;
}