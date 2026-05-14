// // 'use client';

// // import React, { useEffect, useRef, useState } from 'react';
// // import maplibregl from 'maplibre-gl';
// // import 'maplibre-gl/dist/maplibre-gl.css';
// // import { db } from '@/lib/firebase'; 
// // import { collection, getDocs } from 'firebase/firestore';

// // import LocationMarkers from './components/LocationMarkers';
// // import QRCodeMarkers from './components/QRCodeMarkers';
// // import ServiceBoundaries from './components/ServiceBoundaries';
// // import StallMarkers from './components/StallMarkers';
// // import EventArea from './components/EventArea'; // Import new component

// // interface BoundaryCoord {
// //   lat: number;
// //   lng: number;
// // }

// // interface EventData {
// //   id: string;
// //   eventName?: string;
// //   boundaryCoords: BoundaryCoord[];
// //   serviceBoundaries?: any[]; 
// //   stallMarkers?: any[]; 
// // }

// // export default function EventBlueprint() {
// //   const mapContainer = useRef<HTMLDivElement>(null);
// //   const map = useRef<maplibregl.Map | null>(null);
  
// //   const [events, setEvents] = useState<EventData[]>([]);
// //   const [selectedEventId, setSelectedEventId] = useState<string>('');
// //   const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  
// //   const [selectedServices, setSelectedServices] = useState<any[]>([]);
// //   const [selectedStalls, setSelectedStalls] = useState<any[]>([]);
// //   const [selectedBoundaries, setSelectedBoundaries] = useState<BoundaryCoord[]>([]); // New state

// //   useEffect(() => {
// //     if (map.current || !mapContainer.current) return;

// //     map.current = new maplibregl.Map({
// //       container: mapContainer.current,
// //       style: 'https://tiles.openfreemap.org/styles/liberty',
// //       center: [85.3474, 27.7202], 
// //       zoom: 15,
// //       pitch: 45,
// //     });

// //     map.current.on('load', () => {
// //       setMapInstance(map.current);
// //       fetchEventList();
// //     });

// //     return () => map.current?.remove();
// //   }, []);

// //   const fetchEventList = async () => {
// //     try {
// //       const querySnapshot = await getDocs(collection(db, "events"));
// //       const eventData = querySnapshot.docs.map(doc => ({ 
// //         id: doc.id, 
// //         ...doc.data() 
// //       })) as EventData[];
// //       setEvents(eventData);
// //     } catch (err) {
// //       console.error("Firebase Fetch Error:", err);
// //     }
// //   };

// //   const handleEventChange = (id: string) => {
// //     setSelectedEventId(id);
// //     const event = events.find(e => e.id === id);
    
// //     if (!event || !map.current) return;

// //     setSelectedServices(event.serviceBoundaries || []);
// //     setSelectedStalls(event.stallMarkers || []);
// //     setSelectedBoundaries(event.boundaryCoords || []); // Pass to EventArea state

// //     if (event.boundaryCoords && event.boundaryCoords.length > 0) {
// //         map.current.flyTo({
// //           center: [event.boundaryCoords[0].lng, event.boundaryCoords[0].lat],
// //           zoom: 16,
// //           essential: true
// //         });
// //     }
// //   };

// //   return (
// //     <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
// //       <div style={{
// //         position: 'absolute', top: 20, left: 20, zIndex: 10,
// //         background: 'white', padding: '16px', borderRadius: '12px', 
// //         boxShadow: '0 4px 15px rgba(0,0,0,0.1)', border: '1px solid #eee'
// //       }}>
// //         <h2 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Blueprint Preview</h2>
// //         <select 
// //           value={selectedEventId} 
// //           onChange={(e) => handleEventChange(e.target.value)}
// //           style={{ padding: '10px', borderRadius: '8px', width: '220px', cursor: 'pointer', color: 'black' }}
// //         >
// //           <option value="">Select Event ID</option>
// //           {events.map(ev => (
// //             <option key={ev.id} value={ev.id}>{ev.id}</option>
// //           ))}
// //         </select>
// //       </div>

// //       <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

// //       <EventArea map={mapInstance} boundaryCoords={selectedBoundaries} />
// //       <LocationMarkers map={mapInstance} eventId={selectedEventId} />
// //       <QRCodeMarkers map={mapInstance} eventId={selectedEventId} />
// //       <ServiceBoundaries map={mapInstance} services={selectedServices} />
// //       <StallMarkers map={mapInstance} stalls={selectedStalls} />
// //     </div>
// //   );
// // }



// 'use client';

// import React, { useEffect, useRef, useState } from 'react';
// import maplibregl from 'maplibre-gl';
// import 'maplibre-gl/dist/maplibre-gl.css';
// import { db } from '@/lib/firebase'; 
// import { collection, getDocs } from 'firebase/firestore';
// import { useRouter } from 'next/navigation';

// import LocationMarkers from './components/LocationMarkers';
// import QRCodeMarkers from './components/QRCodeMarkers';
// import ServiceBoundaries from './components/ServiceBoundaries';
// import StallMarkers from './components/StallMarkers';
// import EventArea from './components/EventArea'; 
// import ThreeDMarker from './components/3DMarker'; 

// interface BoundaryCoord {
//   lat: number;
//   lng: number;
// }

// interface EventData {
//   id: string;
//   eventName?: string;
//   boundaryCoords: BoundaryCoord[];
//   serviceBoundaries?: any[]; 
//   stallMarkers?: any[]; 
// }

// export default function EventBlueprint() {
//   const mapContainer = useRef<HTMLDivElement>(null);
//   const map = useRef<maplibregl.Map | null>(null);
//   const router = useRouter();
  
//   const [events, setEvents] = useState<EventData[]>([]);
//   const [selectedEventId, setSelectedEventId] = useState<string>('');
//   const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
//   const [showMap, setShowMap] = useState(false);
  
//   const [selectedServices, setSelectedServices] = useState<any[]>([]);
//   const [selectedStalls, setSelectedStalls] = useState<any[]>([]);
//   const [selectedBoundaries, setSelectedBoundaries] = useState<BoundaryCoord[]>([]);

//   // 1. Fetch data IMMEDIATELY on component mount (Fixes image_46f595.png)
//   useEffect(() => {
//     fetchEventList();
//   }, []);

//   // 2. Map initialization (Only runs when showMap is true)
//   useEffect(() => {
//     if (!showMap || map.current || !mapContainer.current) return;

//     map.current = new maplibregl.Map({
//       container: mapContainer.current,
//       style: 'https://tiles.openfreemap.org/styles/liberty',
//       center: [85.3474, 27.7202], 
//       zoom: 15,
//       pitch: 45,
//     });

//     map.current.on('load', () => {
//     console.log("Map Style Loaded");
//     setMapInstance(map.current);
//   });

//     return () => {
//       map.current?.remove();
//       map.current = null;
//     };
//   }, [showMap]);

//   const fetchEventList = async () => {
//     try {
//       const querySnapshot = await getDocs(collection(db, "events"));
//       const eventData = querySnapshot.docs.map(doc => ({ 
//         id: doc.id, 
//         ...doc.data() 
//       })) as EventData[];
//       setEvents(eventData);
//     } catch (err) {
//       console.error("Firebase Fetch Error:", err);
//     }
//   };

//   const handleEventChange = (id: string) => {
//     if (!id) return;
    
//     setSelectedEventId(id);
//     setShowMap(true); 
    
//     const event = events.find(e => e.id === id);
//     if (!event) return;

//     setSelectedServices(event.serviceBoundaries || []);
//     setSelectedStalls(event.stallMarkers || []);
//     setSelectedBoundaries(event.boundaryCoords || []);

//     // Wait for map to exist before flying
//     const checkMapAndFly = () => {
//       if (map.current && map.current.loaded()) {
//         map.current.flyTo({
//           center: [event.boundaryCoords[0].lng, event.boundaryCoords[0].lat],
//           zoom: 16,
//           essential: true
//         });
//       } else {
//         setTimeout(checkMapAndFly, 100);
//       }
//     };
//     checkMapAndFly();
//   };

//   return (
//     <div style={{ position: 'relative', width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f5f5f5' }}>
      
//       <div style={{
//         position: showMap ? 'absolute' : 'relative', 
//         top: showMap ? 20 : 'auto', 
//         left: showMap ? 20 : 'auto', 
//         zIndex: 100,
//         background: 'white', padding: '24px', borderRadius: '12px', 
//         boxShadow: '0 4px 15px rgba(0,0,0,0.1)', border: '1px solid #eee',
//         textAlign: 'center',
//         minWidth: '300px'
//       }}>
//         <h2 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#333' }}>
//             {showMap ? "Event Loaded" : "Welcome! Please Select an Event"}
//         </h2>
//         <select 
//           value={selectedEventId} 
//           onChange={(e) => handleEventChange(e.target.value)}
//           style={{ padding: '12px', borderRadius: '8px', width: '100%', cursor: 'pointer', color: 'black', border: '1px solid #ccc' }}
//         >
//           <option value="">Select Event ID</option>
//           {events.map(ev => (
//             <option key={ev.id} value={ev.id}>{ev.id}</option>
//           ))}
//         </select>

//         {showMap && (
//           <button 
//             onClick={() => router.push('/login')}
//             style={{
//                 marginTop: '15px',
//                 display: 'block',
//                 width: '100%',
//                 padding: '10px',
//                 background: '#007bff',
//                 color: 'white',
//                 border: 'none',
//                 borderRadius: '8px',
//                 cursor: 'pointer',
//                 fontWeight: 'bold'
//             }}
//           >
//             Lets Play!
//           </button>
//         )}
//       </div>

//       {showMap && (
//         <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
//             <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
//             <EventArea map={mapInstance} boundaryCoords={selectedBoundaries} />
//             <LocationMarkers map={mapInstance} eventId={selectedEventId} />
//             <QRCodeMarkers map={mapInstance} eventId={selectedEventId} />
//             <ServiceBoundaries map={mapInstance} services={selectedServices} />
//             <StallMarkers map={mapInstance} stalls={selectedStalls} />
//             <ThreeDMarker map={mapInstance} eventId={selectedEventId} />
//         </div>
//       )}
//     </div>
//   );
// }



'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

import LocationMarkers from './components/LocationMarkers';
import QRCodeMarkers from './components/QRCodeMarkers';
import ServiceBoundaries from './components/ServiceBoundaries';
import StallMarkers from './components/StallMarkers';
import EventArea from './components/EventArea';
import ThreeDMarker from './components/3DMarker';

interface BoundaryCoord { lat: number; lng: number; }

interface EventData {
  id: string;
  eventName?: string;
  boundaryCoords: BoundaryCoord[];
  serviceBoundaries?: any[];
  stallMarkers?: any[];
}

const MAP_PITCH = 45; // single source of truth for pitch

export default function EventBlueprint() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map          = useRef<maplibregl.Map | null>(null);
  const router       = useRouter();

  const [events,          setEvents         ] = useState<EventData[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [mapInstance,     setMapInstance    ] = useState<maplibregl.Map | null>(null);
  const [showMap,         setShowMap        ] = useState(false);

  const [selectedServices,  setSelectedServices ] = useState<any[]>([]);
  const [selectedStalls,    setSelectedStalls   ] = useState<any[]>([]);
  const [selectedBoundaries,setSelectedBoundaries] = useState<BoundaryCoord[]>([]);

  // ── Fetch event list once on mount ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'events'));
        setEvents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EventData[]);
      } catch (err) {
        console.error('Firebase Fetch Error:', err);
      }
    })();
  }, []);

  // ── Initialize map when showMap becomes true ─────────────────────────────────
  useEffect(() => {
    if (!showMap || map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [85.3540, 27.6862],   // closer to the event area from the start
      zoom: 15,
      pitch: MAP_PITCH,             // 3D extrusions need pitch > 0
      bearing: 0,
    });

    map.current.on('load', () => {
      console.log('[Map] Style loaded ✅');
      // Pass the live instance into state so child components re-render
      setMapInstance(map.current);
    });

    return () => {
      map.current?.remove();
      map.current = null;
      setMapInstance(null);
    };
  }, [showMap]);

  // ── Event selection ──────────────────────────────────────────────────────────
  const handleEventChange = (id: string) => {
    if (!id) return;
    setSelectedEventId(id);
    setShowMap(true);

    const event = events.find(e => e.id === id);
    if (!event) return;

    setSelectedServices(event.serviceBoundaries || []);
    setSelectedStalls(event.stallMarkers || []);
    setSelectedBoundaries(event.boundaryCoords || []);

    if (!event.boundaryCoords?.length) return;

    const [first] = event.boundaryCoords;

    // flyTo: MUST include pitch so 3D extrusions stay visible
    const fly = () => {
      if (map.current?.loaded()) {
        map.current.flyTo({
          center: [first.lng, first.lat],
          zoom: 17,
          pitch: MAP_PITCH,   // ← keeps extrusions visible after the fly
          essential: true,
        });
      } else {
        setTimeout(fly, 150);
      }
    };
    fly();
  };

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100vh',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      background: '#f5f5f5',
    }}>

      {/* ── Control panel ────────────────────────────────────────────────────── */}
      <div style={{
        position: showMap ? 'absolute' : 'relative',
        top: showMap ? 20 : 'auto',
        left: showMap ? 20 : 'auto',
        zIndex: 100,
        background: 'white', padding: '24px', borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)', border: '1px solid #eee',
        textAlign: 'center', minWidth: '300px',
      }}>
        <h2 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#333' }}>
          {showMap ? 'Event Loaded' : 'Welcome! Please Select an Event'}
        </h2>

        <select
          value={selectedEventId}
          onChange={(e) => handleEventChange(e.target.value)}
          style={{ padding: '12px', borderRadius: '8px', width: '100%', cursor: 'pointer', color: 'black', border: '1px solid #ccc' }}
        >
          <option value="">Select Event ID</option>
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.eventName || ev.id}</option>
          ))}
        </select>

        {showMap && (
          <button
            onClick={() => router.push('/login')}
            style={{
              marginTop: '15px', display: 'block', width: '100%', padding: '10px',
              background: '#007bff', color: 'white', border: 'none',
              borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
            }}
          >
            Lets Play!
          </button>
        )}
      </div>

      {/* ── Map + overlays ────────────────────────────────────────────────────── */}
      {showMap && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

          {/* All overlays receive the live MapLibre instance via mapInstance state */}
          <EventArea        map={mapInstance} boundaryCoords={selectedBoundaries} />
          <LocationMarkers  map={mapInstance} eventId={selectedEventId} />
          <QRCodeMarkers    map={mapInstance} eventId={selectedEventId} />
          <ServiceBoundaries map={mapInstance} services={selectedServices} />
          <StallMarkers     map={mapInstance} stalls={selectedStalls} />
          <ThreeDMarker     map={mapInstance} eventId={selectedEventId} />
        </div>
      )}
    </div>
  );
}