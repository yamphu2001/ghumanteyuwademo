export interface Landmark {
  id: string;
  name: string;
  description: string;
  coords: {
    lat: number;
    lng: number;
  };
  type?: string;
  images?: string[];
}

export const landmarks: Landmark[] = [
  {
    "id": "marker_001",
    "name": "Hanuman Dhoka Entrance",
    "description": "The golden gate guarded by the statue of Hanuman, leading into the royal palace complex.",
    "coords": { "lat": 27.70415, "lng": 85.30685 },
    "images": ["/panorama/360images/9story1.JPG"]
  },
  {
    "id": "marker_002",
    "name": "Nasal Chowk",
    "description": "The main courtyard used for royal coronations. It houses the coronation platform and fine wood carvings.",
    "coords": { "lat": 27.70417, "lng": 85.30720 },
    "images": ["https://images.unsplash.com/photo-1544735716-392fe2489ffa"]
  },
  {
    "id": "marker_003",
    "name": "Mul Chowk",
    "description": "The central religious courtyard dedicated to Taleju Bhawani, the tutelary goddess of the Malla kings.",
    "coords": { "lat": 27.70445, "lng": 85.30740 },
    "images": ["https://images.unsplash.com/photo-1518391846015-55a9cc003b25"]
  },
  {
    "id": "marker_004",
    "name": "Sundari Chowk",
    "description": "The 'Beautiful Courtyard,' famous for its Tusha Hiti (sunken bath) with 72 carved deities.",
    "coords": { "lat": 27.70472, "lng": 85.30720 },
    "images": ["https://images.unsplash.com/photo-1449034446853-66c86144b0ad"]
  },
  {
    "id": "marker_005",
    "name": "Mohan Chowk",
    "description": "The residential courtyard of the Malla kings, featuring a golden waterspout at its center.",
    "coords": { "lat": 27.70455, "lng": 85.30700 },
    "images": ["https://images.unsplash.com/photo-1477959858617-67f85cf4f1df"]
  },
  {
    "id": "marker_006",
    "name": "Tribhuvan Museum",
    "description": "A gallery showcasing royal memorabilia, including personal items of King Tribhuvan.",
    "coords": { "lat": 27.70390, "lng": 85.30710 },
    "images": ["https://images.unsplash.com/photo-1514565131-fce0801e5785"]
  },
  {
    "id": "marker_007",
    "name": "Nine-Story Basantapur Tower",
    "description": "A massive pagoda-style tower offering a panoramic view of the Kathmandu valley and the palace.",
    "coords": { "lat": 27.70385, "lng": 85.30745 },
    "images": ["https://images.unsplash.com/photo-1524492412937-b28074a5d7da"]
  },
  {
    "id": "marker_008",
    "name": "Panch Mukhi Hanuman Temple",
    "description": "A unique five-roofed circular temple in the corner of Nasal Chowk dedicated to the five-faced Hanuman.",
    "coords": { "lat": 27.70430, "lng": 85.30735 },
    "images": ["https://images.unsplash.com/photo-1548013146-72479768bbaa"]
  },
  {
    "id": "marker_009",
    "name": "Gaddi Baithak Interior",
    "description": "Inside the neoclassical hall where royal audiences were held during the Rana and Shah periods.",
    "coords": { "lat": 27.70400, "lng": 85.30630 },
    "images": ["https://images.unsplash.com/photo-1503177119275-0aa32b3a9368"]
  },
  {
    "id": "marker_010",
    "name": "Bhandarkhal Garden",
    "description": "The royal garden located on the eastern side of the palace, once used as a private retreat.",
    "coords": { "lat": 27.70450, "lng": 85.30780 },
    "images": ["https://images.unsplash.com/photo-1523544545175-92e04b96d26b"]
  }
];