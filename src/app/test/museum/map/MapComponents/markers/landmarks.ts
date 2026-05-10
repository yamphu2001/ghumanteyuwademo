export interface Landmark {
  id: string;
  name: string;
  description: string;
  // Updated from [number, number] to an object to match your new data
  coords: {
    lat: number;
    lng: number;
  };
  type?: string;     // Optional if not present in new data
  images?: string[]; // Optional if not present in new data
}

export const landmarks: Landmark[] = [
  {
    "id": "marker_001",
    "name": "Central Plaza",
    "description": "The main entry point for the 360 tour.",
    "coords": { "lat": 27.70396949335304, "lng": 85.30669503880824 }
  },
  {
    "id": "marker_002",
    "name": "North Walkway",
    "description": "Path leading toward the heritage site.",
    "coords": { "lat": 27.70414403545243, "lng": 85.30751713586815 }
  },
  {
    "id": "marker_003",
    "name": "East Gate",
    "description": "Secondary entrance with floral displays.",
    "coords": { "lat": 27.70397186807783, "lng": 85.30779072118676 }
  },
  {
    "id": "marker_004",
    "name": "Info Kiosk",
    "description": "Digital directory for visitors.",
    "coords": { "lat": 27.703857881252762, "lng": 85.30774110032071 }
  },
  {
    "id": "marker_005",
    "name": "Rest Area A",
    "description": "Benches located near the fountain.",
    "coords": { "lat": 27.703879253791523, "lng": 85.30775451136559 }
  },
  {
    "id": "marker_006",
    "name": "Observation Point",
    "description": "Best view of the skyline.",
    "coords": { "lat": 27.70401105102143, "lng": 85.30762844754372 }
  },
  {
    "id": "marker_007",
    "name": "Heritage Monument",
    "description": "Historical statue and plaque.",
    "coords": { "lat": 27.704106039917246, "lng": 85.30779072118676 }
  },
  {
    "id": "marker_008",
    "name": "Garden Corner",
    "description": "Quiet zone with local flora.",
    "coords": { "lat": 27.70399885623589, "lng": 85.30812494614173 }
  },
  {
    "id": "marker_009",
    "name": "North-West Terrace",
    "description": "Overlook point for the lower gardens.",
    "coords": { "lat": 27.704271045737418, "lng": 85.30718828574305 }
  },
  {
    "id": "marker_010",
    "name": "South Junction",
    "description": "Intersection of three walking paths.",
    "coords": { "lat": 27.70382917485332, "lng": 85.30750726882226 }
  },
  {
    "id": "marker_011",
    "name": "Coffee Stall",
    "description": "Popular refreshment spot.",
    "coords": { "lat": 27.703882606206435, "lng": 85.30745161298601 }
  },
  {
    "id": "marker_012",
    "name": "The Courtyard",
    "description": "Open space for public gatherings.",
    "coords": { "lat": 27.703918820775343, "lng": 85.30752336207611 }
  },
  {
    "id": "marker_013",
    "name": "Exhibit Hall Entrance",
    "description": "Entry to the indoor gallery.",
    "coords": { "lat": 27.703864795758314, "lng": 85.30757901791237 }
  }
];