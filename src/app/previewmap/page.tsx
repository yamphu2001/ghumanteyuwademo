
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
// import MapLegend from './components/MapLegend';

// interface BoundaryCoord { lat: number; lng: number; }

// interface EventData {
//   id: string;
//   eventName?: string;
//   boundaryCoords: BoundaryCoord[];
//   serviceBoundaries?: any[];
//   stallMarkers?: any[];
// }

// const MAP_PITCH = 45;

// export default function EventBlueprint() {
//   const mapContainer = useRef<HTMLDivElement>(null);
//   const map          = useRef<maplibregl.Map | null>(null);
//   const router       = useRouter();

//   const [events,           setEvents          ] = useState<EventData[]>([]);
//   const [selectedEventId,  setSelectedEventId ] = useState('');
//   const [mapInstance,      setMapInstance     ] = useState<maplibregl.Map | null>(null);
//   const [showMap,          setShowMap         ] = useState(false);
//   const [isMobile,         setIsMobile        ] = useState(false);

//   const [selectedServices,   setSelectedServices  ] = useState<any[]>([]);
//   const [selectedStalls,     setSelectedStalls    ] = useState<any[]>([]);
//   const [selectedBoundaries, setSelectedBoundaries] = useState<BoundaryCoord[]>([]);

//   // ── Detect mobile ──────────────────────────────────────────────────────────
//   useEffect(() => {
//     const check = () => setIsMobile(window.innerWidth < 768);
//     check();
//     window.addEventListener('resize', check);
//     return () => window.removeEventListener('resize', check);
//   }, []);

//   // ── Fetch event list ───────────────────────────────────────────────────────
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

//   // ── Initialize map ─────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!showMap || map.current || !mapContainer.current) return;

//     map.current = new maplibregl.Map({
//       container: mapContainer.current,
//       style: 'https://tiles.openfreemap.org/styles/bright',
//       center: [85.3540, 27.6862],
//       zoom: 17,
//       minZoom: 16,
//       maxZoom: 20,
//       pitch: MAP_PITCH,
//       bearing: 0,
//     });

//     map.current.on('load', () => {
//       console.log('[Map] Style loaded ✅');
//       setMapInstance(map.current);
//     });

//     return () => {
//       map.current?.remove();
//       map.current = null;
//       setMapInstance(null);
//     };
//   }, [showMap]);

//   // ── Event selection ────────────────────────────────────────────────────────
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

//     // Fly to centroid of the full event boundary so the whole area is centred
//     const coords = event.boundaryCoords;
//     const centerLat = coords.reduce((sum, c) => sum + c.lat, 0) / coords.length;
//     const centerLng = coords.reduce((sum, c) => sum + c.lng, 0) / coords.length;

//     const fly = () => {
//       if (map.current?.loaded()) {
//         map.current.flyTo({
//           center: [centerLng, centerLat],
//           zoom: 17,
//           pitch: MAP_PITCH,
//           essential: true,
//           speed: 1.2,
//         });
//       } else {
//         setTimeout(fly, 150);
//       }
//     };
//     fly();
//   };

//   // ── Control panel styles ───────────────────────────────────────────────────
//   const panelStyle: React.CSSProperties = showMap
//     ? {
//         position: 'absolute',
//         // Mobile: top bar full-width; Desktop: top-left card
//         top: isMobile ? 0 : 20,
//         left: isMobile ? 0 : 20,
//         right: isMobile ? 0 : 'auto',
//         zIndex: 100,
//         background: 'white',
//         padding: isMobile ? '12px 16px' : '24px',
//         borderRadius: isMobile ? '0 0 12px 12px' : '12px',
//         boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
//         border: isMobile ? 'none' : '1px solid #eee',
//         borderBottom: isMobile ? '1px solid #eee' : undefined,
//         display: 'flex',
//         flexDirection: isMobile ? 'row' : 'column',
//         alignItems: isMobile ? 'center' : 'stretch',
//         gap: isMobile ? '10px' : '0',
//         minWidth: isMobile ? 'unset' : '300px',
//       }
//     : {
//         position: 'relative',
//         background: 'white',
//         padding: '24px',
//         borderRadius: '12px',
//         boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
//         border: '1px solid #eee',
//         textAlign: 'center',
//         width: isMobile ? 'calc(100vw - 40px)' : '300px',
//         maxWidth: '360px',
//       };

//   return (
//     <div style={{
//       position: 'relative', width: '100%', height: '100vh',
//       display: 'flex', justifyContent: 'center', alignItems: 'center',
//       background: '#f5f5f5',
//     }}>

//       {/* ── Control panel ──────────────────────────────────────────────────── */}
//       <div style={panelStyle}>
//         {/* Title — hidden on mobile when map is shown */}
//         {(!isMobile || !showMap) && (
//           <h2 style={{
//             margin: isMobile ? 0 : '0 0 15px 0',
//             fontSize: isMobile && showMap ? '14px' : '18px',
//             color: '#333',
//             whiteSpace: 'nowrap',
//           }}>
//             {showMap ? 'Event Loaded' : 'Welcome! Select an Event'}
//           </h2>
//         )}

//         <select
//           value={selectedEventId}
//           onChange={(e) => handleEventChange(e.target.value)}
//           style={{
//             padding: isMobile && showMap ? '8px 10px' : '12px',
//             borderRadius: '8px',
//             width: isMobile && showMap ? 'auto' : '100%',
//             flex: isMobile && showMap ? 1 : undefined,
//             cursor: 'pointer',
//             color: 'black',
//             border: '1px solid #ccc',
//             fontSize: isMobile ? '14px' : '16px',
//           }}
//         >
//           <option value="">Select Event</option>
//           {events.map(ev => (
//             <option key={ev.id} value={ev.id}>{ev.eventName || ev.id}</option>
//           ))}
//         </select>

//         {showMap && (
//           <button
//             onClick={() => router.push('/login')}
//             style={{
//               marginTop: isMobile ? 0 : '15px',
//               display: 'block',
//               width: isMobile ? 'auto' : '100%',
//               padding: isMobile ? '8px 14px' : '10px',
//               background: '#007bff',
//               color: 'white',
//               border: 'none',
//               borderRadius: '8px',
//               cursor: 'pointer',
//               fontWeight: 'bold',
//               fontSize: isMobile ? '13px' : '15px',
//               whiteSpace: 'nowrap',
//             }}
//           >
//             {isMobile ? '▶ Play' : 'Lets Play!'}
//           </button>
//         )}
//       </div>

//       {/* ── Map + overlays ─────────────────────────────────────────────────── */}
//       {showMap && (
//         <div style={{ position: 'absolute', inset: 0 }}>
//           <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

//           <EventArea         map={mapInstance} boundaryCoords={selectedBoundaries} />
//           <LocationMarkers   map={mapInstance} eventId={selectedEventId} />
//           <QRCodeMarkers     map={mapInstance} eventId={selectedEventId} />
//           <ServiceBoundaries map={mapInstance} services={selectedServices} />
//           <StallMarkers      map={mapInstance} stalls={selectedStalls} />
//           <ThreeDMarker      map={mapInstance} eventId={selectedEventId} />

//           <MapLegend
//             eventId={selectedEventId}
//             services={selectedServices}
//             stalls={selectedStalls}
//             boundaryCoords={selectedBoundaries}
//             map={mapInstance}
//             isMobile={isMobile}
//           />
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
import MapLegend from './components/MapLegend';

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
  const map          = useRef<maplibregl.Map | null>(null);
  const router       = useRouter();

  const [events,           setEvents          ] = useState<EventData[]>([]);
  const [selectedEventId,  setSelectedEventId ] = useState('');
  const [mapInstance,      setMapInstance     ] = useState<maplibregl.Map | null>(null);
  const [showMap,          setShowMap         ] = useState(false);
  const [isMobile,         setIsMobile        ] = useState(false);

  const [selectedServices,   setSelectedServices  ] = useState<any[]>([]);
  const [selectedStalls,     setSelectedStalls    ] = useState<any[]>([]);
  const [selectedBoundaries, setSelectedBoundaries] = useState<BoundaryCoord[]>([]);

  // ── Detect mobile ──────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Fetch event list ───────────────────────────────────────────────────────
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

  // ── Initialize map ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!showMap || map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: [85.3540, 27.6862],
      zoom: 17,
      minZoom: 16,
      maxZoom: 20,
      pitch: MAP_PITCH,
      bearing: 0,
    });

    map.current.on('load', () => {
      console.log('[Map] Style loaded ✅');
      setMapInstance(map.current);
    });

    return () => {
      map.current?.remove();
      map.current = null;
      setMapInstance(null);
    };
  }, [showMap]);

  // ── Event selection ────────────────────────────────────────────────────────
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

    // Fly to centroid of the full event boundary so the whole area is centred
    const coords = event.boundaryCoords;
    const centerLat = coords.reduce((sum, c) => sum + c.lat, 0) / coords.length;
    const centerLng = coords.reduce((sum, c) => sum + c.lng, 0) / coords.length;

    const fly = () => {
      if (map.current?.loaded()) {
        map.current.flyTo({
          center: [centerLng, centerLat],
          zoom: 17,
          pitch: MAP_PITCH,
          essential: true,
          speed: 1.2,
        });
      } else {
        setTimeout(fly, 150);
      }
    };
    fly();
  };

  // ── Control panel styles ───────────────────────────────────────────────────
  // ── Control panel styles ───────────────────────────────────────────────────
  const panelStyle: React.CSSProperties = showMap
    ? {
        position: 'absolute',
        top: isMobile ? 0 : 20,
        left: isMobile ? 0 : 20,
        right: isMobile ? 0 : 'auto',
        zIndex: 100,
        background: 'white',
        padding: isMobile ? '12px 16px' : '24px',
        borderRadius: isMobile ? '0 0 12px 12px' : '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
        
        // FIX: Use longhand properties to avoid shorthand conflicts
        borderStyle: 'solid',
        borderLeftWidth: isMobile ? 0 : 1,
        borderRightWidth: isMobile ? 0 : 1,
        borderTopWidth: isMobile ? 0 : 1,
        borderBottomWidth: 1, // Always 1px in this state
        borderColor: '#eee',

        display: 'flex',
        flexDirection: isMobile ? 'row' : 'column',
        alignItems: isMobile ? 'center' : 'stretch',
        gap: isMobile ? '10px' : '0',
        minWidth: isMobile ? 'unset' : '300px',
      }
    : {
        position: 'relative',
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        
        // FIX: Consistently use longhand here too
        borderStyle: 'solid',
        borderWidth: '1px',
        borderColor: '#eee',

        textAlign: 'center',
        width: isMobile ? 'calc(100vw - 40px)' : '300px',
        maxWidth: '360px',
      };

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100vh',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      background: '#f5f5f5',
    }}>

      {/* ── Control panel ──────────────────────────────────────────────────── */}
      <div style={panelStyle}>
        {/* Title — hidden on mobile when map is shown */}
        {(!isMobile || !showMap) && (
          <h2 style={{
            margin: isMobile ? 0 : '0 0 15px 0',
            fontSize: isMobile && showMap ? '14px' : '18px',
            color: '#333',
            whiteSpace: 'nowrap',
          }}>
            {showMap ? 'Event Loaded' : 'Welcome! Select an Event'}
          </h2>
        )}

        <select
          value={selectedEventId}
          onChange={(e) => handleEventChange(e.target.value)}
          style={{
            padding: isMobile && showMap ? '8px 10px' : '12px',
            borderRadius: '8px',
            width: isMobile && showMap ? 'auto' : '100%',
            flex: isMobile && showMap ? 1 : undefined,
            cursor: 'pointer',
            color: 'black',
            border: '1px solid #ccc',
            fontSize: isMobile ? '14px' : '16px',
          }}
        >
          <option value="">Select Event</option>
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.eventName || ev.id}</option>
          ))}
        </select>

        {showMap && (
          <button
            onClick={() => {
              // Unmount map overlays first so 3DMarker cleanup runs while
              // the map is still alive, then navigate after React flushes.
              setShowMap(false);
              setTimeout(() => router.push('/login'), 50);
            }}
            style={{
              marginTop: isMobile ? 0 : '15px',
              display: 'block',
              width: isMobile ? 'auto' : '100%',
              padding: isMobile ? '8px 14px' : '10px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: isMobile ? '13px' : '15px',
              whiteSpace: 'nowrap',
            }}
          >
            {isMobile ? '▶ Play' : 'Lets Play!'}
          </button>
        )}
      </div>

      {/* ── Map + overlays ─────────────────────────────────────────────────── */}
      {showMap && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

          <EventArea         map={mapInstance} boundaryCoords={selectedBoundaries} />
          <LocationMarkers   map={mapInstance} eventId={selectedEventId} />
          <QRCodeMarkers     map={mapInstance} eventId={selectedEventId} />
          <ServiceBoundaries map={mapInstance} services={selectedServices} />
          <StallMarkers      map={mapInstance} stalls={selectedStalls} />
          <ThreeDMarker      map={mapInstance} eventId={selectedEventId} />

          <MapLegend
            eventId={selectedEventId}
            services={selectedServices}
            stalls={selectedStalls}
            boundaryCoords={selectedBoundaries}
            map={mapInstance}
            isMobile={isMobile}
          />
        </div>
      )}
    </div>
  );
}