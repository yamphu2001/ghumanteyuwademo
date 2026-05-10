// export type MarkerType =
//   | 'temple'
//   | 'stupa'
//   | 'bazaar'
//   | 'shrine'
//   | 'landmark'
//   ;

// export interface LocationData {
//   id: string;
//   name: string;
//   coordinates: [number, number];
//   type: MarkerType;
//   image: string;
//   status: 'active' | 'inactive'; // Added
//   eventlocation: string;        // Added
// }


export type MarkerType =
  | 'temple'
  | 'stupa'
  | 'bazaar'
  | 'shrine'
  | 'landmark'
  ;

export interface LocationData {
  id: string;
  name: string;
  coordinates: [number, number];
  type: MarkerType;
  image: string;
  status: 'active' | 'inactive'; 
  eventlocation: string;
  eventId: string; // Add this to your logic interface
}