
export type LandmarkType = 'temple' | 'stupa' | 'bazaar' | 'shrine' | 'landmark';

export interface Landmark {
  id: string;
  name: string;
  description: string;
  coordinates: [number, number]; 
  image: string;      // This is your pin/marker icon
  popupImage: string; // Add this for the actual photo in the popup
  type: string;
}