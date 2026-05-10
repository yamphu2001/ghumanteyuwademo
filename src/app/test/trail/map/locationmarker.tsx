export interface Landmark {
  id: string;
  name: string;
  coordinates: [number, number];
  type: string;
  image: string;
  description: string;
}

export const landmarks: Landmark[] = [
  { 
    id: '1', 
    name: "Hanuman Dhoka Entrance", 
    coordinates: [85.30669503880824, 27.70396949335304], 
    type: 'landmark', 
    image: "https://lh3.googleusercontent.com/gps-cs-s/AHVAwepRS_LYM32_qXNOrUB_f5KmtR9W2ynVAkem9EKNs2PYAxVh4HpAEFiPY3EnAmideJfyVkjrEnc5WhjRJ9SUM2XudbuloS7bIaEXdSIkQhLS4gQv3hIT34Mm17NSb1XksKHC7ZHCyA=w408-h271-k-no",
    description: "The historic entrance to the ancient royal palace complex of the Malla kings."
  },
  { 
    id: '2', 
    name: "Taleju Temple Vicinity", 
    coordinates: [85.30751713586815, 27.70414403545243], 
    type: 'temple', 
    image: "/images/markers/temp.png",
    description: "A sacred area near the majestic Taleju Bhawani temple, towering over the square."
  },
  { 
    id: '3', 
    name: "Indra Chowk Corner", 
    coordinates: [85.30779072118676, 27.70397186807783], 
    type: 'shrine', 
    image: "/images/markers/book.png",
    description: "A bustling ceremonial crossroad known for its vibrant markets and ancient shrines."
  },
  { 
    id: '4', 
    name: "Akash Bhairav Path", 
    coordinates: [85.30774110032071, 27.703857881252762], 
    type: 'bazaar', 
    image: "/images/markers/cycle.png",
    description: "A path leading through the heart of the local bazaar towards the sky-god's temple."
  },
  { 
    id: '5', 
    name: "Makhan Tole Passage", 
    coordinates: [85.30775451136559, 27.703879253791523], 
    type: 'stupa', 
    image: "/images/markers/stupa.png",
    description: "A narrow alleyway rich with traditional architecture and small neighborhood stupas."
  },
  { 
    id: '6', 
    name: "Durbar Square Courtyard", 
    coordinates: [85.30762844754372, 27.70401105102143], 
    type: 'garden', 
    image: "/images/markers/flag.png",
    description: "An open space where local pigeons gather among the resting platforms of the old city."
  },
  { 
    id: '7', 
    name: "North Square Landmark", 
    coordinates: [85.30779072118676, 27.704106039917246], 
    type: 'landmark', 
    image: "/images/markers/view.png",
    description: "A strategic view of the northern restoration projects of the Kathmandu Durbar complex."
  },
  { 
    id: '8', 
    name: "New Road Gate", 
    coordinates: [85.30812494614173, 27.70399885623589], 
    type: 'temple', 
    image: "/images/markers/temp.png",
    description: "Where the historic old city meets the modern commercial hub of Kathmandu."
  },
  { 
    id: '9', 
    name: "Kot Square Area", 
    coordinates: [85.30718828574305, 27.704271045737418], 
    type: 'shrine', 
    image: "/images/markers/book.png",
    description: "Significant for its role in history, this area is home to ancient monuments and hidden courtyards."
  },
  { 
    id: '10', 
    name: "Gaddhi Baithak View", 
    coordinates: [85.30750726882226, 27.70382917485332], 
    type: 'bazaar', 
    image: "/images/markers/cycle.png",
    description: "Overlooking the neoclassical Gaddi Baithak palace, a unique architectural blend in the square."
  },
  { 
    id: '11', 
    name: "Temple of the Living Goddess", 
    coordinates: [85.30745161298601, 27.703882606206435], 
    type: 'stupa', 
    image: "/images/markers/stupa.png",
    description: "Near the Kumari Ghar, where the living goddess makes her rare and auspicious appearances."
  },
  { 
    id: '12', 
    name: "Shiva Parvati Temple", 
    coordinates: [85.30752336207611, 27.703918820775343], 
    type: 'garden', 
    image: "/images/markers/flag.png",
    description: "The spot where Shiva and Parvati look out from their window onto the daily life of the city."
  },
  { 
    id: '13', 
    name: "Ghumante Hub", 
    coordinates: [85.30757901791237, 27.703864795758314], 
    type: 'landmark', 
    image: "/images/markers/view.png",
    description: "The primary gathering point for the Ghumante Network. Stand here to synchronize your journey."
  },
  { 
    id: '14', 
    name: "Ghumante Hub", 
    coordinates: [85.30822070798342, 27.691973282748332, ], 
    type: 'landmark', 
    image: "/images/markers/view.png",
    description: "The primary gathering point for the Ghumante Network. Stand here to synchronize your journey."
  },
  { 
    id: '15', 
    name: "Ghumante Hub", 
    coordinates: [85.30706921498184,27.692022663067526], 
    type: 'landmark', 
    image: "/images/markers/view.png",
    description: "The primary gathering point for the Ghumante Network. Stand here to synchronize your journey."
  },
  { 
    id: '16', 
    name: "Ghumante Hub", 
    coordinates: [85.3059775676247, 27.6920865710326, ], 
    type: 'landmark', 
    image: "/images/markers/view.png",
    description: "The primary gathering point for the Ghumante Network. Stand here to synchronize your journey."
  },
  { 
    id: '17', 
    name: "Ghumante Hub", 
    coordinates: [85.29876297791638,27.69613707731338], 
    type: 'landmark', 
    image: "/images/markers/view.png",
    description: "The primary gathering point for the Ghumante Network. Stand here to synchronize your journey."
  },
  { 
    id: '18', 
    name: "Ghumante Hub", 
    coordinates: [85.3059775676247, 27.6920865710326, ], 
    type: 'landmark', 
    image: "/images/markers/view.png",
    description: "The primary gathering point for the Ghumante Network. Stand here to synchronize your journey."
  },
  { 
    id: '19', 
    name: "Ghumante Hub", 
    coordinates: [85.29876125238957, 27.69188683643989], 
    type: 'landmark', 
    image: "/images/markers/view.png",
    description: "The primary gathering point for the Ghumante Network. Stand here to synchronize your journey."
  },
  { 
    id: '19', 
    name: "Ghumante Hub", 
    coordinates: [85.29876125238957, 27.69188683643989], 
    type: 'landmark', 
    image: "/images/markers/view.png",
    description: "The primary gathering point for the Ghumante Network. Stand here to synchronize your journey."
  },
  { 
    id: '19', 
    name: "Ghumante Hub", 
    coordinates: [85.29876125238957, 27.69188683643989], 
    type: 'landmark', 
    image: "/images/markers/view.png",
    description: "The primary gathering point for the Ghumante Network. Stand here to synchronize your journey."
  },
  { 
    id: '20', 
    name: "Ghumante Hub", 
    coordinates: [85.29876125238957, 27.69188683643989], 
    type: 'landmark', 
    image: "/images/markers/view.png",
    description: "The primary gathering point for the Ghumante Network. Stand here to synchronize your journey."
  },
  { 
    id: '21', 
    name: "Ghumante Hub", 
    coordinates: [ 85.2998385258162, 27.69159126699275,], 
    type: 'landmark', 
    image: "/images/markers/view.png",
    description: "The primary gathering point for the Ghumante Network. Stand here to synchronize your journey."
  },
  { 
    id: '22', 
    name: "Ghumante Hub", 
    coordinates: [85.30149236811906, 27.691806226670014, ], 
    type: 'landmark', 
    image: "/images/markers/view.png",
    description: "The primary gathering point for the Ghumante Network. Stand here to synchronize your journey."
  },
  { 
    id: '23', 
    name: "Ghumante Hub", 
    coordinates: [85.29850331368179, 27.694157320507987, ], 
    type: 'landmark', 
    image: "/images/markers/view.png",
    description: "The primary gathering point for the Ghumante Network. Stand here to synchronize your journey."
  },
  

  
];