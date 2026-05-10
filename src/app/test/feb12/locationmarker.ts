export interface Landmark {
  id: string;
  name: string;
  coordinates: [number, number];
  type: string;
  image: string;
  description?: string;
}

export const landmarks: Landmark[] = [
  // --- NEW MUSEUM CHOWKS (Museum Demo Primary) ---
  { 
    id: 'm1', 
    name: "Nucha Chowk", 
    coordinates: [85.30678419983714, 27.704099570908326], 
    type: 'museum-wing', 
    image: "https://images.unsplash.com/photo-1623492701902-47dc207df5dc?q=80&w=800&auto=format&fit=crop",
    description: "A private residential courtyard of the Malla kings. Known for its intimate scale and the intricate wood-carved windows that exemplify Newari craftsmanship."
  },
  { 
    id: 'm2', 
    name: "Lohan Chowk", 
    coordinates: [85.30782472712883, 27.704010418460857], 
    type: 'museum-wing', 
    image: "https://images.unsplash.com/photo-1582650629119-c6bbef5df0ce?q=80&w=800&auto=format&fit=crop",
    description: "The 'Stone Courtyard.' It is the architectural heart of the palace, surrounded by four magnificent towers representing the four ancient cities of the valley."
  },
  { 
    id: 'm3', 
    name: "Dakh Chowk", 
    coordinates: [85.30715110434379, 27.70428094980068], 
    type: 'museum-wing', 
    image: "https://images.unsplash.com/photo-1518105570919-4590372df58b?q=80&w=800&auto=format&fit=crop",
    description: "Historically used for sacred rituals and tantric performances. This courtyard remains a key site for understanding the religious history of the Hanuman Dhoka complex."
  },
  { 
    id: 'm4', 
    name: "Lam Chowk", 
    coordinates: [85.30712448351207, 27.704023740095572], 
    type: 'museum-wing', 
    image: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?q=80&w=800&auto=format&fit=crop",
    description: "The 'Long Courtyard,' characterized by its unique rectangular proportions. It served as a functional space for palace administration and guards."
  },

  // --- MAJOR MUSEUM ATTRACTIONS ---
  { 
    id: 'm-throne', 
    name: "The Royal Throne", 
    coordinates: [85.3075, 27.7041], 
    type: 'artifact', 
    image: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=800&auto=format&fit=crop",
    description: "The centerpiece of the museum gallery. This golden throne was used during coronations and represents the absolute sovereignty of the Gorkhali monarchs."
  },
  { 
    id: 'm-kal', 
    name: "Kal Bhairav", 
    coordinates: [85.3064, 27.7042], 
    type: 'landmark', 
    image: "https://images.unsplash.com/photo-1545153997-4b9a486d3025?q=80&w=800&auto=format&fit=crop",
    description: "The 17th-century stone monolith of the fierce manifestation of Shiva. It remains one of the most active ritual sites within the palace square."
  },

  // --- EXISTING LANDMARKS ---
  { id: '1', name: "Location 1", coordinates: [85.30826996360138, 27.70374219046372], type: 'landmark', image: "/images/markers/view.png" },
  { id: '2', name: "Location 2", coordinates: [85.30757723848296, 27.70318358451511], type: 'temple', image: "/images/markers/temp.png" },
  { id: '3', name: "Location 3", coordinates: [85.30675864383633, 27.703766911756976], type: 'shrine', image: "/images/markers/book.png" },
  { id: '4', name: "Location 4", coordinates: [85.30651567823077, 27.70377327834262], type: 'bazaar', image: "/images/markers/cycle.png" },
  { id: '5', name: "Location 5", coordinates: [85.30583702133275, 27.703789617097254], type: 'stupa', image: "/images/markers/stupa.png" }
];