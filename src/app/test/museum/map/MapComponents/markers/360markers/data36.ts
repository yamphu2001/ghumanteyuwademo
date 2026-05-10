// src/app/test/museum/map/MapComponents/markers/360markers/data36.ts

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
    "id": "Basantapur_001",
    "name": "Gaddhi Baithak",
    "description": "The neoclassical palace built during the Rana dynasty.",
    "coords": { "lat": 27.70396949335304, "lng": 85.30669503880824 },
    "images": ["/panoramas/gaddhi.JPG"]
  },
  {
    "id": "Basantapur_002",
    "name": "Nasal Chowk",
    "description": "Famed temple featuring the divine couple looking out from the upper window.",
    "coords": { "lat": 27.70414403545243, "lng": 85.30751713586815 },
    "images": ["/panoramas/nasal.JPG"]
  },
  {
    "id": "Basantapur_003",
    "name": "Loha Chowk",
    "description": "The residence of the Living Goddess of Kathmandu.",
    "coords": { "lat": 27.70397186807783, "lng": 85.30779072118676 },
    "images": ["/panoramas/loha.JPG"]
  },
  {
    "id": "Basantapur_004",
    "name": "Area 1",
    "description": "Dedicated to Vishnu, standing prominently in the square.",
    "coords": { "lat": 27.703857881252762, "lng": 85.30774110032071 },
    "images": ["/panoramas/area1.JPG"]
  },
  {
    "id": "Basantapur_006",
    "name": "Area 2",
    "description": "Site of the historic wooden pavilion that gave Kathmandu its name.",
    "coords": { "lat": 27.70401105102143, "lng": 85.30762844754372 },
    "images": ["/panoramas/area2.JPG"]
  },
  {
    "id": "Basantapur_007",
    "name": "Area 3",
    "description": "The massive stone relief of the fierce manifestation of Shiva.",
    "coords": { "lat": 27.704106039917246, "lng": 85.30779072118676 },
    "images": ["/panoramas/area3.JPG"]
  },
  {
    "id": "Basantapur_008",
    "name": "Nag Pokhari",
    "description": "Known for the intricate carvings on its roof struts.",
    "coords": { "lat": 27.70399885623589, "lng": 85.30812494614173 },
    "images": ["/panoramas/Nag.JPG"]
  },
  {
    "id": "Basantapur_009",
    "name": "Dahk Chowk",
    "description": "Entry point to the majestic temple dedicated to the royal deity.",
    "coords": { "lat": 27.704271045737418, "lng": 85.30718828574305 },
    "images": ["/panoramas/Dahk.JPG"]
  },
  {
    "id": "Basantapur_010",
    "name": "Nautale Durbar South",
    "description": "Early Malla period temple located in the palace complex.",
    "coords": { "lat": 27.70382917485332, "lng": 85.30750726882226 },
    "images": ["/panoramas/9story4.JPG"]
  },
  {
    "id": "Basantapur_011",
    "name": "Nautale Durbar West",
    "description": "The golden gate leading into the royal palace museum.",
    "coords": { "lat": 27.703882606206435, "lng": 85.30745161298601 },
    "images": ["/panoramas/9story3.JPG"]
  },
  {
    "id": "Basantapur_012",
    "name": "Nautale Durbar North",
    "description": "The main courtyard used for coronations and royal ceremonies.",
    "coords": { "lat": 27.703918820775343, "lng": 85.30752336207611 },
    "images": ["/panoramas/9story2.JPG"]
  },
  {
    "id": "Basantapur_013",
    "name": "Nautale Durbar East",
    "description": "The iconic Nine-Story Palace tower overlooking the valley.",
    "coords": { "lat": 27.703864795758314, "lng": 85.30757901791237 },
    "images": ["/panoramas/9story1.JPG"]
  }
];