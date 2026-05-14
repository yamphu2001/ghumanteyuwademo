
// import { create } from 'zustand';
// import { db } from "@/lib/firebase"; 
// import { doc, setDoc, deleteDoc } from "firebase/firestore";
// import * as turf from '@turf/turf';

// export type ShapeType = 'rect' | 'circle' | 'hexagon';
// export type SidePlacement = 'left' | 'on' | 'right';
// export type ColorMode = 'uniform' | 'random' | 'individual';

// export interface StallItem {
//   id: string;
//   name: string;
//   rotation: number;
//   color: string;
//   description: string;
// }

// export interface StallCollection {
//   id: string;
//   eventId: string; 
//   name: string;
//   stalls: number;
//   width: number;
//   length: number;
//   height: number;
//   gap: number;
//   offset: number;
//   isCurved: boolean;
//   colorMode: ColorMode;
//   baseColor: string;
//   side: SidePlacement;
//   shapeType: ShapeType;
//   coordinates: [number, number][]; // [lng, lat]
//   items: StallItem[];
//   calculatedPolygons?: { stallId: string; path: { lat: number; lng: number }[] }[];
// }

// interface AppState {
//   collections: StallCollection[];
//   addCollection: (col: Omit<StallCollection, 'id' | 'items'>) => void;
//   updateCollection: (id: string, updates: Partial<StallCollection>) => void;
//   removeCollection: (id: string) => void;
// }

// /**
//  * Calculates 3D box corners while ensuring shapes don't exceed the line length.
//  */
// const generateStallPolygons = (col: StallCollection) => {
//   if (col.coordinates.length < 2) return [];

//   try {
//     const line = turf.lineString(col.coordinates);
//     const totalLineLength = turf.length(line, { units: 'meters' });
//     const polygons = [];

//     for (let i = 0; i < col.stalls; i++) {
//       // Calculate the start and end points of the stall on the line
//       const startDistance = i * (col.width + col.gap) + col.offset;
//       const endDistance = startDistance + col.width;

//       // BOUNDARY CHECK: If the end of the stall is beyond the line length, stop here.
//       if (endDistance > totalLineLength) {
//         break; 
//       }

//       const centerDistance = startDistance + (col.width / 2);
//       const center = turf.along(line, centerDistance, { units: 'meters' });
      
//       // Determine direction (bearing)
//       const sampleDist = Math.min(centerDistance + 0.1, totalLineLength);
//       const nextPoint = turf.along(line, sampleDist, { units: 'meters' });
//       const bearing = turf.bearing(center, nextPoint);

//       // Lateral Offset (Left/Right/On)
//       let lateralShift = 0;
//       if (col.side === 'left') lateralShift = -col.length / 2;
//       if (col.side === 'right') lateralShift = col.length / 2;

//       const placedCenter = lateralShift !== 0 
//         ? turf.transformTranslate(center, lateralShift, bearing + 90, { units: 'meters' })
//         : center;

//       // Construct Rectangle: West to East line buffered by length
//       const west = turf.transformTranslate(placedCenter, -col.width / 2, bearing, { units: 'meters' });
//       const east = turf.transformTranslate(placedCenter, col.width / 2, bearing, { units: 'meters' });
      
//       const widthLine = turf.lineString([
//         west.geometry.coordinates,
//         east.geometry.coordinates
//       ]);
      
//       const bufferedRect = turf.buffer(widthLine, col.length / 2, { units: 'meters' });

//       if (bufferedRect && bufferedRect.geometry) {
//         polygons.push({
//           stallId: col.items[i]?.id || crypto.randomUUID(),
//           path: bufferedRect.geometry.coordinates[0].map((coord: any) => ({
//             lng: coord[0],
//             lat: coord[1]
//           }))
//         });
//       }
//     }
//     return polygons;
//   } catch (error) {
//     console.error("Geometry error:", error);
//     return [];
//   }
// };

// const makeItem = (i: number): StallItem => ({
//   id: crypto.randomUUID(),
//   name: `Stall ${i + 1}`,
//   rotation: 0,
//   color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
//   description: '',
// });

// export const useStore = create<AppState>((set, get) => ({
//   collections: [],

//   addCollection: (col) =>
//     set((state) => {
//       const id = crypto.randomUUID();
//       const items = Array.from({ length: col.stalls }, (_, i) => makeItem(i));
      
//       const newCol: StallCollection = {
//         ...col,
//         id,
//         items,
//         offset: col.offset ?? 0,
//         side: col.side ?? 'left',
//         shapeType: col.shapeType ?? 'rect',
//       };

//       const polygons = generateStallPolygons(newCol);
//       newCol.calculatedPolygons = polygons;

//       const firestoreData = {
//         ...newCol,
//         coordinates: newCol.coordinates.map(([lng, lat]) => ({ lng, lat })),
//         calculatedPolygons: polygons 
//       };

//       setDoc(doc(db, "events", col.eventId, "3dmarker", id), firestoreData);

//       return { collections: [...state.collections, newCol] };
//     }),

//   updateCollection: (id, updates) =>
//     set((state) => {
//       const updatedCollections = state.collections.map((col) => {
//         if (col.id !== id) return col;

//         let updatedItems = updates.items ? [...updates.items] : [...col.items];
        
//         if (updates.stalls !== undefined && !updates.items) {
//           if (updates.stalls > col.items.length) {
//             const newItems = Array.from(
//               { length: updates.stalls - col.items.length },
//               (_, i) => makeItem(col.items.length + i)
//             );
//             updatedItems = [...col.items, ...newItems];
//           } else {
//             updatedItems = col.items.slice(0, updates.stalls);
//           }
//         }

//         const finalCol = { ...col, ...updates, items: updatedItems };

//         // Generate polygons (will only include those that fit)
//         const polygons = generateStallPolygons(finalCol);
//         finalCol.calculatedPolygons = polygons;

//         const firestoreData = {
//           ...finalCol,
//           coordinates: finalCol.coordinates.map(([lng, lat]) => ({ lng, lat })),
//           calculatedPolygons: polygons 
//         };

//         setDoc(doc(db, "events", col.eventId, "3dmarker", id), firestoreData, { merge: true });

//         return finalCol;
//       });

//       return { collections: updatedCollections };
//     }),

//   removeCollection: (id) =>
//     set((state) => {
//       const collectionToDelete = state.collections.find((c) => c.id === id);
//       if (collectionToDelete) {
//         deleteDoc(doc(db, "events", collectionToDelete.eventId, "3dmarker", id));
//       }
//       return { collections: state.collections.filter((c) => c.id !== id) };
//     }),
// }));



import { create } from 'zustand';
import { db } from "@/lib/firebase"; 
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import * as turf from '@turf/turf';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShapeType = 'rect' | 'circle' | 'hexagon';
export type SidePlacement = 'left' | 'on' | 'right';
export type ColorMode = 'uniform' | 'random' | 'individual';

export interface StallItem {
  id: string;
  name: string;
  rotation: number;
  color: string;
  description: string;
}

export interface StallCollection {
  id: string;
  eventId: string; 
  name: string;
  stalls: number;
  width: number;
  length: number;
  height: number;
  gap: number;
  offset: number;
  isCurved: boolean;
  colorMode: ColorMode;
  baseColor: string;
  side: SidePlacement;
  shapeType: ShapeType;
  coordinates: [number, number][]; // [lng, lat]
  items: StallItem[];
  calculatedPolygons?: { stallId: string; path: { lat: number; lng: number }[] }[];
}

interface AppState {
  collections: StallCollection[];
  addCollection: (col: Omit<StallCollection, 'id' | 'items'>) => void;
  updateCollection: (id: string, updates: Partial<StallCollection>) => void;
  removeCollection: (id: string) => void;
}

// ─── Logic ───────────────────────────────────────────────────────────────────

/**
 * Calculates 4-cornered sharp rectangles instead of rounded buffers.
 */
const generateStallPolygons = (col: StallCollection) => {
  if (col.coordinates.length < 2) return [];

  try {
    const line = turf.lineString(col.coordinates);
    const totalLineLength = turf.length(line, { units: 'meters' });
    const polygons = [];

    for (let i = 0; i < col.stalls; i++) {
      // 1. Determine position along the line
      const startDistance = i * (col.width + col.gap) + col.offset;
      const endDistance = startDistance + col.width;

      if (endDistance > totalLineLength) break; 

      const centerDistance = startDistance + (col.width / 2);
      const center = turf.along(line, centerDistance, { units: 'meters' });
      
      // 2. Get the direction (bearing) of the line at this point
      const sampleDist = Math.min(centerDistance + 0.1, totalLineLength);
      const nextPoint = turf.along(line, sampleDist, { units: 'meters' });
      const bearing = turf.bearing(center, nextPoint);

      // 3. Shift the center point laterally (Left/Right/On)
      let lateralShift = 0;
      if (col.side === 'left') lateralShift = -col.length / 2;
      if (col.side === 'right') lateralShift = col.length / 2;

      const placedCenter = lateralShift !== 0 
        ? turf.transformTranslate(center, lateralShift, bearing + 90, { units: 'meters' })
        : center;

      // 4. Calculate SHARP CORNERS (no buffer)
      // Get the "West" and "East" edges along the line orientation
      const westMid = turf.transformTranslate(placedCenter, -col.width / 2, bearing, { units: 'meters' });
      const eastMid = turf.transformTranslate(placedCenter, col.width / 2, bearing, { units: 'meters' });
      
      // Offset those edges perpendicular (90 degrees) to get the 4 corners
      const p1 = turf.transformTranslate(westMid, col.length / 2, bearing + 90, { units: 'meters' });
      const p2 = turf.transformTranslate(eastMid, col.length / 2, bearing + 90, { units: 'meters' });
      const p3 = turf.transformTranslate(eastMid, -col.length / 2, bearing + 90, { units: 'meters' });
      const p4 = turf.transformTranslate(westMid, -col.length / 2, bearing + 90, { units: 'meters' });

      // 5. Build the path (5 points: 4 corners + 1 to close)
      const sharpPath = [p1, p2, p3, p4, p1].map((p: any) => ({
        lng: p.geometry.coordinates[0],
        lat: p.geometry.coordinates[1]
      }));

      polygons.push({
        stallId: col.items[i]?.id || crypto.randomUUID(),
        path: sharpPath
      });
    }
    return polygons;
  } catch (error) {
    console.error("Geometry error:", error);
    return [];
  }
};

const makeItem = (i: number): StallItem => ({
  id: crypto.randomUUID(),
  name: `Stall ${i + 1}`,
  rotation: 0,
  color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
  description: '',
});

// ─── Store ───────────────────────────────────────────────────────────────────

export const useStore = create<AppState>((set, get) => ({
  collections: [],

  addCollection: (col) =>
    set((state) => {
      const id = crypto.randomUUID();
      const items = Array.from({ length: col.stalls }, (_, i) => makeItem(i));
      
      const newCol: StallCollection = {
        ...col,
        id,
        items,
        offset: col.offset ?? 0,
        side: col.side ?? 'left',
        shapeType: col.shapeType ?? 'rect',
      };

      const polygons = generateStallPolygons(newCol);
      newCol.calculatedPolygons = polygons;

      const firestoreData = {
        ...newCol,
        coordinates: newCol.coordinates.map(([lng, lat]) => ({ lng, lat })),
        calculatedPolygons: polygons 
      };

      setDoc(doc(db, "events", col.eventId, "3dmarker", id), firestoreData);

      return { collections: [...state.collections, newCol] };
    }),

  updateCollection: (id, updates) =>
    set((state) => {
      const updatedCollections = state.collections.map((col) => {
        if (col.id !== id) return col;

        let updatedItems = updates.items ? [...updates.items] : [...col.items];
        
        if (updates.stalls !== undefined && !updates.items) {
          if (updates.stalls > col.items.length) {
            const newItems = Array.from(
              { length: updates.stalls - col.items.length },
              (_, i) => makeItem(col.items.length + i)
            );
            updatedItems = [...col.items, ...newItems];
          } else {
            updatedItems = col.items.slice(0, updates.stalls);
          }
        }

        const finalCol = { ...col, ...updates, items: updatedItems };
        const polygons = generateStallPolygons(finalCol);
        finalCol.calculatedPolygons = polygons;

        const firestoreData = {
          ...finalCol,
          coordinates: finalCol.coordinates.map(([lng, lat]) => ({ lng, lat })),
          calculatedPolygons: polygons 
        };

        setDoc(doc(db, "events", col.eventId, "3dmarker", id), firestoreData, { merge: true });

        return finalCol;
      });

      return { collections: updatedCollections };
    }),

  removeCollection: (id) =>
    set((state) => {
      const collectionToDelete = state.collections.find((c) => c.id === id);
      if (collectionToDelete) {
        deleteDoc(doc(db, "events", collectionToDelete.eventId, "3dmarker", id));
      }
      return { collections: state.collections.filter((c) => c.id !== id) };
    }),
}));