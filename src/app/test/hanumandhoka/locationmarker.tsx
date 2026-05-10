export interface Landmark {
  id: string;
  name: string;
  coordinates: [number, number];
  type: string;
  image: string;
}

export const landmarks: Landmark[] = [
  // --- Detailed Durbar Square & Surrounding Area ---
  { id: '1', name: "Location 1", coordinates: [85.30826996360138, 27.70374219046372], type: 'landmark', image: "/images/markers/view.png" },
  { id: '2', name: "Location 2", coordinates: [85.30757723848296, 27.70318358451511], type: 'temple', image: "/images/markers/temp.png" },
  { id: '3', name: "Location 3", coordinates: [85.30675864383633, 27.703766911756976], type: 'shrine', image: "/images/markers/book.png" },
  { id: '4', name: "Location 4", coordinates: [85.30651567823077, 27.70377327834262], type: 'bazaar', image: "/images/markers/cycle.png" },
  { id: '5', name: "Location 5", coordinates: [85.30583702133275, 27.703789617097254], type: 'stupa', image: "/images/markers/stupa.png" },
  { id: '6', name: "Location 6", coordinates: [85.30612888073, 27.704145448058007], type: 'garden', image: "/images/markers/flag.png" },
  { id: '7', name: "Location 7", coordinates: [85.30616396833928, 27.70447868249943], type: 'landmark', image: "/images/markers/view.png" },
  { id: '8', name: "Location 8", coordinates: [85.30647177458047, 27.704334657083763], type: 'temple', image: "/images/markers/temp.png" },
  { id: '9', name: "Location 9", coordinates: [85.30670940738065, 27.70448291854223], type: 'shrine', image: "/images/markers/book.png" },
  { id: '10', name: "Location 10", coordinates: [85.30690238435312, 27.704737080571324], type: 'bazaar', image: "/images/markers/cycle.png" },
  { id: '11', name: "Location 11", coordinates: [85.3071830781333, 27.70487263341218], type: 'stupa', image: "/images/markers/stupa.png" },
  { id: '12', name: "Location 12", coordinates: [85.3074892895235, 27.704931937725725], type: 'garden', image: "/images/markers/flag.png" },
  { id: '13', name: "Location 13", coordinates: [85.30798117491273, 27.704583546682986], type: 'landmark', image: "/images/markers/view.png" },
  { id: '14', name: "Location 14", coordinates: [85.30927590039124, 27.704984790008684], type: 'temple', image: "/images/markers/temp.png" },
  { id: '15', name: "Location 15", coordinates: [85.30918514095337, 27.70453729499488], type: 'shrine', image: "/images/markers/book.png" },
];
