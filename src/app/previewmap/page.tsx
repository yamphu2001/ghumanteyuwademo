
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

// interface BoundaryCoord { lat: number; lng: number; }

// interface EventData {
//   id: string;
//   eventName?: string;
//   boundaryCoords: BoundaryCoord[];
//   serviceBoundaries?: any[];
//   stallMarkers?: any[];
// }

// const MAP_PITCH = 45; // single source of truth for pitch

// export default function EventBlueprint() {
//   const mapContainer = useRef<HTMLDivElement>(null);
//   const map          = useRef<maplibregl.Map | null>(null);
//   const router       = useRouter();

//   const [events,          setEvents         ] = useState<EventData[]>([]);
//   const [selectedEventId, setSelectedEventId] = useState('');
//   const [mapInstance,     setMapInstance    ] = useState<maplibregl.Map | null>(null);
//   const [showMap,         setShowMap        ] = useState(false);

//   const [selectedServices,  setSelectedServices ] = useState<any[]>([]);
//   const [selectedStalls,    setSelectedStalls   ] = useState<any[]>([]);
//   const [selectedBoundaries,setSelectedBoundaries] = useState<BoundaryCoord[]>([]);

//   // ── Fetch event list once on mount ──────────────────────────────────────────
//   useEffect(() => {
//     (async () => {
//       try {
//         const snap = await getDocs(collection(db, 'events'));
//         setEvents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EventData[]);
//       } catch (err) {
//         console.error('Firebase Fetch Error:', err);
//       }
//     })();
//   }, []);

//   // ── Initialize map when showMap becomes true ─────────────────────────────────
// useEffect(() => {
//   if (!showMap || map.current || !mapContainer.current) return;

//   map.current = new maplibregl.Map({
//     container: mapContainer.current,
//     style: 'https://tiles.openfreemap.org/styles/liberty',
//     center: [85.3540, 27.6862],
//     zoom: 17,
//     minZoom: 16,   // Setting minimum zoom (world view)
//     maxZoom: 20,  // Setting maximum zoom (street detail)
//     pitch: MAP_PITCH,
//     bearing: 0,
//   });

//   map.current.on('load', () => {
//     console.log('[Map] Style loaded ✅');
//     setMapInstance(map.current);
//   });

//   return () => {
//     map.current?.remove();
//     map.current = null;
//     setMapInstance(null);
//   };
// }, [showMap]);

//   // ── Event selection ──────────────────────────────────────────────────────────
//   const handleEventChange = (id: string) => {
//     if (!id) return;
//     setSelectedEventId(id);
//     setShowMap(true);

//     const event = events.find(e => e.id === id);
//     if (!event) return;

//     setSelectedServices(event.serviceBoundaries || []);
//     setSelectedStalls(event.stallMarkers || []);
//     setSelectedBoundaries(event.boundaryCoords || []);

//     if (!event.boundaryCoords?.length) return;

//     const [first] = event.boundaryCoords;

//     // flyTo: MUST include pitch so 3D extrusions stay visible
//     const fly = () => {
//       if (map.current?.loaded()) {
//         map.current.flyTo({
//           center: [first.lng, first.lat],
//           zoom: 17,
//           pitch: MAP_PITCH,   // ← keeps extrusions visible after the fly
//           essential: true,
//         });
//       } else {
//         setTimeout(fly, 150);
//       }
//     };
//     fly();
//   };

//   return (
//     <div style={{
//       position: 'relative', width: '100%', height: '100vh',
//       display: 'flex', justifyContent: 'center', alignItems: 'center',
//       background: '#f5f5f5',
//     }}>

//       {/* ── Control panel ────────────────────────────────────────────────────── */}
//       <div style={{
//         position: showMap ? 'absolute' : 'relative',
//         top: showMap ? 20 : 'auto',
//         left: showMap ? 20 : 'auto',
//         zIndex: 100,
//         background: 'white', padding: '24px', borderRadius: '12px',
//         boxShadow: '0 4px 15px rgba(0,0,0,0.1)', border: '1px solid #eee',
//         textAlign: 'center', minWidth: '300px',
//       }}>
//         <h2 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#333' }}>
//           {showMap ? 'Event Loaded' : 'Welcome! Please Select an Event'}
//         </h2>

//         <select
//           value={selectedEventId}
//           onChange={(e) => handleEventChange(e.target.value)}
//           style={{ padding: '12px', borderRadius: '8px', width: '100%', cursor: 'pointer', color: 'black', border: '1px solid #ccc' }}
//         >
//           <option value="">Select Event ID</option>
//           {events.map(ev => (
//             <option key={ev.id} value={ev.id}>{ev.eventName || ev.id}</option>
//           ))}
//         </select>

//         {showMap && (
//           <button
//             onClick={() => router.push('/login')}
//             style={{
//               marginTop: '15px', display: 'block', width: '100%', padding: '10px',
//               background: '#007bff', color: 'white', border: 'none',
//               borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
//             }}
//           >
//             Lets Play!
//           </button>
//         )}
//       </div>

//       {/* ── Map + overlays ────────────────────────────────────────────────────── */}
//       {showMap && (
//         <div style={{ position: 'absolute', inset: 0 }}>
//           <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

//           {/* All overlays receive the live MapLibre instance via mapInstance state */}
//           <EventArea        map={mapInstance} boundaryCoords={selectedBoundaries} />
//           <LocationMarkers  map={mapInstance} eventId={selectedEventId} />
//           <QRCodeMarkers    map={mapInstance} eventId={selectedEventId} />
//           <ServiceBoundaries map={mapInstance} services={selectedServices} />
//           <StallMarkers     map={mapInstance} stalls={selectedStalls} />
//           <ThreeDMarker     map={mapInstance} eventId={selectedEventId} />
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

const MAP_PITCH = 45;

export default function EventBlueprint() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const router = useRouter();

  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [isListVisible, setIsListVisible] = useState(false);

  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [selectedStalls, setSelectedStalls] = useState<any[]>([]);
  const [selectedBoundaries, setSelectedBoundaries] = useState<BoundaryCoord[]>([]);

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

  useEffect(() => {
    if (!showMap || map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [85.3540, 27.6862],
      zoom: 17,
      minZoom: 16,
      maxZoom: 20,
      pitch: MAP_PITCH,
      bearing: 0,
    });

    map.current.on('load', () => {
      setMapInstance(map.current);
    });

    return () => {
      map.current?.remove();
      map.current = null;
      setMapInstance(null);
    };
  }, [showMap]);

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
    const fly = () => {
      if (map.current?.loaded()) {
        map.current.flyTo({
          center: [first.lng, first.lat],
          zoom: 17,
          pitch: MAP_PITCH,
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
      background: '#f5f5f5', overflow: 'hidden'
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

      {/* ── List Toggle Button ─────────────────────────────────────────────── */}
      {showMap && (
        <button
          onClick={() => setIsListVisible(!isListVisible)}
          style={{
            position: 'absolute', top: 20, right: 20, zIndex: 110,
            padding: '12px 20px', background: '#333', color: 'white',
            border: 'none', borderRadius: '30px', cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)', fontWeight: 'bold'
          }}
        >
          {isListVisible ? '✖ Close List' : '📋 View Objects List'}
        </button>
      )}

      {/* ── List Sidebar Overlay (Updated to match image_94621a.png) ────────── */}
      {showMap && isListVisible && (
        <div style={{
          position: 'absolute', top: 80, right: 20, zIndex: 105,
          width: '300px', maxHeight: '70vh', background: 'white',
          borderRadius: '16px', padding: '24px', overflowY: 'auto',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #eee',
          color: 'black', fontFamily: 'sans-serif'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 'bold' }}>Map Objects</h3>
          <div style={{ height: '1px', background: '#eee', marginBottom: '20px' }}></div>
          
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ color: '#007bff', fontSize: '15px', fontWeight: '600', marginBottom: '12px', textTransform: 'uppercase' }}>
              3D STALLS ({selectedStalls.length})
            </h4>
            {selectedStalls.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedStalls.map((s, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px' }}>
                    <span style={{ color: '#e91e63' }}>📍</span> 
                    <span style={{ color: '#333' }}>{s.name || `Stall ${idx + 1}`}</span>
                  </div>
                ))}
              </div>
            ) : <p style={{ fontSize: '14px', color: '#999' }}>No stalls found</p>}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#28a745', fontSize: '15px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>
              SERVICES ({selectedServices.length})
            </h4>
            {selectedServices.length === 0 && (
              <p style={{ fontSize: '14px', color: '#999' }}>No services found</p>
            )}
          </div>

          <p style={{ fontSize: '12px', color: '#ccc', textAlign: 'center', marginTop: '16px' }}>
            Live Event ID: {selectedEventId}
          </p>
        </div>
      )}

      {/* ── Map + overlays ────────────────────────────────────────────────────── */}
      {showMap && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
          <EventArea map={mapInstance} boundaryCoords={selectedBoundaries} />
          <LocationMarkers map={mapInstance} eventId={selectedEventId} />
          <QRCodeMarkers map={mapInstance} eventId={selectedEventId} />
          <ServiceBoundaries map={mapInstance} services={selectedServices} />
          <StallMarkers map={mapInstance} stalls={selectedStalls} />
          <ThreeDMarker map={mapInstance} eventId={selectedEventId} />
        </div>
      )}
    </div>
  );
}