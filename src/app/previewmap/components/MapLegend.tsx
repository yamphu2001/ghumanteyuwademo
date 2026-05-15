

// 'use client';

// import { useEffect, useState } from 'react';
// import maplibregl from 'maplibre-gl';
// import { db } from '@/lib/firebase';
// import { collection, getDocs, onSnapshot } from 'firebase/firestore';

// // ─── Types ────────────────────────────────────────────────────────────────────

// interface ServiceData {
//   id: string;
//   name: string;
//   color: string;
//   boundary?: { lat: number; lng: number }[];
// }

// interface StallData {
//   id: string;
//   eventarea: string;
//   status?: string;
//   lat?: number;
//   lng?: number;
// }

// interface BoundaryCoord { lat: number; lng: number; }

// interface QRMarker {
//   id: string;
//   name: string;
//   lat?: number;
//   lng?: number;
// }

// interface ThreeDGroup {
//   id: string;
//   name: string;
//   baseColor: string;
//   items?: { id: string; name: string }[];
//   calculatedPolygons?: { stallId: string; path: { lat: number; lng: number }[] }[];
// }

// interface ListItem {
//   id: string;
//   name: string;
//   lat?: number;
//   lng?: number;
// }

// interface Props {
//   eventId: string;
//   services: ServiceData[];
//   stalls: StallData[];
//   boundaryCoords: BoundaryCoord[];
//   map: maplibregl.Map | null;
// }

// // ─── Category config ──────────────────────────────────────────────────────────

// const CATEGORIES = {
//   qrMarkers:    { label: 'QR Code Markers',    icon: '📱' },
//   services:     { label: 'Service Boundaries', icon: '🏢' },
//   stalls:       { label: 'Stall Markers',      icon: '🏪' },
//   threeDMarkers:{ label: '3D Structures',      icon: '🧊' },
// } as const;

// type CategoryKey = keyof typeof CATEGORIES;

// // ─── CategorySection ──────────────────────────────────────────────────────────

// function CategorySection({
//   categoryKey,
//   items,
//   isOpen,
//   onToggle,
//   onItemClick,
// }: {
//   categoryKey: CategoryKey;
//   items: ListItem[];
//   isOpen: boolean;
//   onToggle: () => void;
//   onItemClick: (item: ListItem) => void;
// }) {
//   const cat = CATEGORIES[categoryKey];

//   return (
//     <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
//       <button
//         onClick={onToggle}
//         style={{
//           width: '100%',
//           display: 'flex',
//           alignItems: 'center',
//           gap: '12px',
//           padding: '14px 18px',
//           background: isOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
//           border: 'none',
//           cursor: 'pointer',
//           textAlign: 'left',
//         }}
//       >
//         <span style={{ fontSize: '20px', lineHeight: 1 }}>{cat.icon}</span>
//         <span style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: '#ffffff', fontFamily: 'inherit' }}>
//           {cat.label}
//         </span>
//         <span style={{
//           background: '#2a2a2a', color: '#ffffff', border: '1px solid #444',
//           borderRadius: '12px', padding: '2px 10px', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit',
//         }}>
//           {items.length}
//         </span>
//         <span style={{
//           fontSize: '14px', color: '#888',
//           transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
//           transition: 'transform 0.2s ease', marginLeft: '4px',
//         }}>
//           ▾
//         </span>
//       </button>

//       {isOpen && (
//         <div style={{
//           background: '#0d0d0d',
//           maxHeight: '280px',
//           overflowY: 'auto',
//           scrollbarWidth: 'thin',
//           scrollbarColor: '#333 transparent',
//         }}>
//           {items.length === 0 ? (
//             <p style={{ fontSize: '14px', color: '#666', padding: '12px 20px', margin: 0, fontStyle: 'italic', fontFamily: 'inherit' }}>
//               No items
//             </p>
//           ) : (
//             items.map((item, idx) => {
//               const canFly = item.lat != null && item.lng != null;
//               return (
//                 <div
//                   key={item.id}
//                   onClick={() => canFly && onItemClick(item)}
//                   style={{
//                     display: 'flex',
//                     alignItems: 'center',
//                     gap: '12px',
//                     padding: '11px 20px',
//                     borderTop: idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)',
//                     cursor: canFly ? 'pointer' : 'default',
//                     transition: 'background 0.15s',
//                   }}
//                   onMouseEnter={e => { if (canFly) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.07)'; }}
//                   onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
//                 >
//                   {/* Dot — glows white if flyable */}
//                   <span style={{
//                     width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
//                     background: canFly ? '#ffffff' : '#555',
//                     opacity: canFly ? 0.8 : 0.4,
//                   }} />

//                   <span style={{ flex: 1, fontSize: '14px', color: '#ffffff', fontFamily: 'inherit', lineHeight: 1.4 }}>
//                     {item.name}
//                   </span>

//                   {/* Fly icon */}
//                   {canFly && (
//                     <span style={{ fontSize: '13px', color: '#555' }} title="Fly to location">
//                       ✈
//                     </span>
//                   )}
//                 </div>
//               );
//             })
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── Main Component ───────────────────────────────────────────────────────────

// export default function MapLegend({ eventId, services, stalls, map }: Props) {
//   const [qrMarkers,    setQRMarkers]    = useState<QRMarker[]>([]);
//   const [threeDGroups, setThreeDGroups] = useState<ThreeDGroup[]>([]);
//   const [isMinimized,  setIsMinimized]  = useState(false);
//   const [openSection,  setOpenSection]  = useState<CategoryKey | null>(null);

//   const toggleSection = (key: CategoryKey) =>
//     setOpenSection(prev => (prev === key ? null : key));

//   // ── Fetch QR markers ──
//   useEffect(() => {
//     if (!eventId) return;
//     getDocs(collection(db, 'events', eventId, 'qrcodemarkers')).then(snap => {
//       setQRMarkers(snap.docs.map(d => {
//         const data = d.data() as any;
//         return { id: d.id, name: data.name || d.id, lat: data.lat, lng: data.lng };
//       }));
//     });
//   }, [eventId]);

//   // ── Fetch 3D marker groups (live) ──
//   useEffect(() => {
//     if (!eventId) return;
//     return onSnapshot(collection(db, 'events', eventId, '3dmarker'), snap => {
//       setThreeDGroups(snap.docs.map(d => ({ id: d.id, ...d.data() })) as ThreeDGroup[]);
//     });
//   }, [eventId]);

//   // ── FlyTo handler ──
//   const flyTo = (item: ListItem) => {
//     if (!map || item.lat == null || item.lng == null) return;
//     map.flyTo({
//       center: [item.lng, item.lat],
//       zoom: 20,
//       pitch: 45,
//       speed: 1.4,
//       essential: true,
//     });
//   };

//   // ── Build item lists with coordinates ──
//   const qrItems: ListItem[] = qrMarkers.map(m => ({
//     id: m.id, name: m.name, lat: m.lat, lng: m.lng,
//   }));

//   const serviceItems: ListItem[] = services.map(s => {
//     // centroid of boundary
//     const pts = s.boundary ?? [];
//     const lat = pts.length ? pts.reduce((sum, p) => sum + p.lat, 0) / pts.length : undefined;
//     const lng = pts.length ? pts.reduce((sum, p) => sum + p.lng, 0) / pts.length : undefined;
//     return { id: s.id, name: s.name, lat, lng };
//   });

//   const stallItems: ListItem[] = stalls.map(s => ({
//     id: s.id, name: s.eventarea, lat: s.lat, lng: s.lng,
//   }));

//   // 3D: use centroid of first polygon in the group
//   const threeDItems: ListItem[] = threeDGroups.flatMap(g => {
//     const firstPoly = g.calculatedPolygons?.[0]?.path ?? [];
//     const lat = firstPoly.length ? firstPoly.reduce((sum, p) => sum + p.lat, 0) / firstPoly.length : undefined;
//     const lng = firstPoly.length ? firstPoly.reduce((sum, p) => sum + p.lng, 0) / firstPoly.length : undefined;

//     if (g.items?.length) {
//       return g.items.map((it, i) => {
//         const poly = g.calculatedPolygons?.[i]?.path ?? [];
//         const iLat = poly.length ? poly.reduce((s, p) => s + p.lat, 0) / poly.length : lat;
//         const iLng = poly.length ? poly.reduce((s, p) => s + p.lng, 0) / poly.length : lng;
//         return { id: it.id, name: it.name, lat: iLat, lng: iLng };
//       });
//     }
//     return [{ id: g.id, name: g.name, lat, lng }];
//   });

//   const totalItems = qrItems.length + serviceItems.length + stallItems.length + threeDItems.length;

//   return (
//     <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 200, width: '300px', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
//       <div style={{
//         background: '#1a1a1a', borderRadius: '12px',
//         border: '1px solid rgba(255,255,255,0.12)',
//         boxShadow: '0 12px 40px rgba(0,0,0,0.6)', overflow: 'hidden',
//       }}>

//         {/* Header */}
//         <div style={{
//           display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//           padding: '14px 18px', background: '#111',
//           borderBottom: '1px solid rgba(255,255,255,0.1)',
//         }}>
//           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//             <span style={{ fontSize: '16px' }}>🗂️</span>
//             <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
//               Program List
//             </span>
//           </div>
//           <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
//             <span style={{ fontSize: '13px', color: '#888' }}>{totalItems} items</span>
//             <button
//               onClick={() => setIsMinimized(p => !p)}
//               style={{
//                 background: '#2a2a2a', border: '1px solid #444', color: '#ffffff',
//                 cursor: 'pointer', fontSize: '13px', width: '26px', height: '26px',
//                 borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
//               }}
//               title={isMinimized ? 'Expand' : 'Minimize'}
//             >
//               {isMinimized ? '▾' : '▴'}
//             </button>
//           </div>
//         </div>

//         {/* Body */}
//         {!isMinimized && (
//           <div>
//             <CategorySection categoryKey="qrMarkers"     items={qrItems}      isOpen={openSection === 'qrMarkers'}     onToggle={() => toggleSection('qrMarkers')}     onItemClick={flyTo} />
//             <CategorySection categoryKey="services"      items={serviceItems} isOpen={openSection === 'services'}      onToggle={() => toggleSection('services')}      onItemClick={flyTo} />
//             <CategorySection categoryKey="stalls"        items={stallItems}   isOpen={openSection === 'stalls'}        onToggle={() => toggleSection('stalls')}        onItemClick={flyTo} />
//             <CategorySection categoryKey="threeDMarkers" items={threeDItems}  isOpen={openSection === 'threeDMarkers'} onToggle={() => toggleSection('threeDMarkers')} onItemClick={flyTo} />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }


'use client';

import { useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { db } from '@/lib/firebase';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceData {
  id: string;
  name: string;
  color: string;
  boundary?: { lat: number; lng: number }[];
}

interface StallData {
  id: string;
  eventarea: string;
  status?: string;
  lat?: number;
  lng?: number;
}

interface BoundaryCoord { lat: number; lng: number; }

interface QRMarker {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
}

interface ThreeDGroup {
  id: string;
  name: string;
  baseColor: string;
  items?: { id: string; name: string }[];
  calculatedPolygons?: { stallId: string; path: { lat: number; lng: number }[] }[];
}

interface ListItem {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
}

interface Props {
  eventId: string;
  services: ServiceData[];
  stalls: StallData[];
  boundaryCoords: BoundaryCoord[];
  map: maplibregl.Map | null;
  isMobile?: boolean;
}

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORIES = {
  qrMarkers:    { label: 'QR Code Markers',    icon: '📱' },
  services:     { label: 'Service Boundaries', icon: '🏢' },
  stalls:       { label: 'Stall Markers',      icon: '🏪' },
  threeDMarkers:{ label: '3D Structures',      icon: '🧊' },
} as const;

type CategoryKey = keyof typeof CATEGORIES;

// ─── CategorySection ──────────────────────────────────────────────────────────

function CategorySection({
  categoryKey,
  items,
  isOpen,
  onToggle,
  onItemClick,
  isMobile,
}: {
  categoryKey: CategoryKey;
  items: ListItem[];
  isOpen: boolean;
  onToggle: () => void;
  onItemClick: (item: ListItem) => void;
  isMobile: boolean;
}) {
  const cat = CATEGORIES[categoryKey];

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>

      {/* Header */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: isMobile ? '12px 16px' : '14px 18px',
          background: isOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: isMobile ? '18px' : '20px', lineHeight: 1 }}>{cat.icon}</span>
        <span style={{ flex: 1, fontSize: isMobile ? '14px' : '15px', fontWeight: 600, color: '#ffffff', fontFamily: 'inherit' }}>
          {cat.label}
        </span>
        <span style={{
          background: '#2a2a2a', color: '#ffffff', border: '1px solid #444',
          borderRadius: '12px', padding: '2px 10px',
          fontSize: isMobile ? '12px' : '13px', fontWeight: 700, fontFamily: 'inherit',
        }}>
          {items.length}
        </span>
        <span style={{
          fontSize: '14px', color: '#888',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease', marginLeft: '4px',
        }}>
          ▾
        </span>
      </button>

      {/* Item list */}
      {isOpen && (
        <div style={{
          background: '#0d0d0d',
          maxHeight: isMobile ? '180px' : '280px',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#333 transparent',
        }}>
          {items.length === 0 ? (
            <p style={{ fontSize: '14px', color: '#666', padding: '12px 20px', margin: 0, fontStyle: 'italic', fontFamily: 'inherit' }}>
              No items
            </p>
          ) : (
            items.map((item, idx) => {
              const canFly = item.lat != null && item.lng != null;
              return (
                <div
                  key={item.id}
                  onClick={() => canFly && onItemClick(item)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: isMobile ? '10px 16px' : '11px 20px',
                    borderTop: idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)',
                    cursor: canFly ? 'pointer' : 'default',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (canFly) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.07)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                >
                  <span style={{
                    width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                    background: canFly ? '#ffffff' : '#555',
                    opacity: canFly ? 0.8 : 0.4,
                  }} />
                  <span style={{ flex: 1, fontSize: isMobile ? '13px' : '14px', color: '#ffffff', fontFamily: 'inherit', lineHeight: 1.4 }}>
                    {item.name}
                  </span>
                  {canFly && (
                    <span style={{ fontSize: '13px', color: '#555' }} title="Fly to location">✈</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MapLegend({ eventId, services, stalls, map, isMobile = false }: Props) {
  const [qrMarkers,    setQRMarkers]    = useState<QRMarker[]>([]);
  const [threeDGroups, setThreeDGroups] = useState<ThreeDGroup[]>([]);
  const [isMinimized,  setIsMinimized]  = useState(isMobile); // collapsed by default on mobile
  const [openSection,  setOpenSection]  = useState<CategoryKey | null>(null);

  // Sync minimized state if isMobile prop changes
  useEffect(() => {
    setIsMinimized(isMobile);
  }, [isMobile]);

  const toggleSection = (key: CategoryKey) =>
    setOpenSection(prev => (prev === key ? null : key));

  useEffect(() => {
    if (!eventId) return;
    getDocs(collection(db, 'events', eventId, 'qrcodemarkers')).then(snap => {
      setQRMarkers(snap.docs.map(d => {
        const data = d.data() as any;
        return { id: d.id, name: data.name || d.id, lat: data.lat, lng: data.lng };
      }));
    });
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    return onSnapshot(collection(db, 'events', eventId, '3dmarker'), snap => {
      setThreeDGroups(snap.docs.map(d => ({ id: d.id, ...d.data() })) as ThreeDGroup[]);
    });
  }, [eventId]);

  const flyTo = (item: ListItem) => {
    if (!map || item.lat == null || item.lng == null) return;
    map.flyTo({ center: [item.lng, item.lat], zoom: 20, pitch: 45, speed: 1.4, essential: true });
    // Auto-collapse on mobile after flying
    if (isMobile) setIsMinimized(true);
  };

  // ── Build lists ──
  const qrItems: ListItem[] = qrMarkers.map(m => ({ id: m.id, name: m.name, lat: m.lat, lng: m.lng }));

  const serviceItems: ListItem[] = services.map(s => {
    const pts = s.boundary ?? [];
    const lat = pts.length ? pts.reduce((sum, p) => sum + p.lat, 0) / pts.length : undefined;
    const lng = pts.length ? pts.reduce((sum, p) => sum + p.lng, 0) / pts.length : undefined;
    return { id: s.id, name: s.name, lat, lng };
  });

  const stallItems: ListItem[] = stalls.map(s => ({ id: s.id, name: s.eventarea, lat: s.lat, lng: s.lng }));

  const threeDItems: ListItem[] = threeDGroups.flatMap(g => {
    if (g.items?.length) {
      return g.items.map((it, i) => {
        const poly = g.calculatedPolygons?.[i]?.path ?? [];
        const lat  = poly.length ? poly.reduce((s, p) => s + p.lat, 0) / poly.length : undefined;
        const lng  = poly.length ? poly.reduce((s, p) => s + p.lng, 0) / poly.length : undefined;
        return { id: it.id, name: it.name, lat, lng };
      });
    }
    const poly = g.calculatedPolygons?.[0]?.path ?? [];
    const lat  = poly.length ? poly.reduce((s, p) => s + p.lat, 0) / poly.length : undefined;
    const lng  = poly.length ? poly.reduce((s, p) => s + p.lng, 0) / poly.length : undefined;
    return [{ id: g.id, name: g.name, lat, lng }];
  });

  const totalItems = qrItems.length + serviceItems.length + stallItems.length + threeDItems.length;

  // ── Layout: bottom sheet on mobile, right panel on desktop ──
  const containerStyle: React.CSSProperties = isMobile
    ? {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }
    : {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 200,
        width: '300px',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      };

  const panelStyle: React.CSSProperties = {
    background: '#1a1a1a',
    borderRadius: isMobile ? '16px 16px 0 0' : '12px',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: isMobile
      ? '0 -8px 32px rgba(0,0,0,0.5)'
      : '0 12px 40px rgba(0,0,0,0.6)',
    overflow: 'hidden',
  };

  return (
    <div style={containerStyle}>
      <div style={panelStyle}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '14px 18px' : '14px 18px',
          background: '#111',
          borderBottom: isMinimized ? 'none' : '1px solid rgba(255,255,255,0.1)',
          // Drag handle hint on mobile
          cursor: isMobile ? 'pointer' : 'default',
        }}
          onClick={isMobile ? () => setIsMinimized(p => !p) : undefined}
        >
          {/* Mobile drag handle pill */}
          {isMobile && (
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '36px', height: '4px',
              borderRadius: '2px',
              background: 'rgba(255,255,255,0.25)',
            }} />
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🗂️</span>
            <span style={{ fontSize: isMobile ? '14px' : '15px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Program List
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', color: '#888' }}>{totalItems} items</span>
            {!isMobile && (
              <button
                onClick={() => setIsMinimized(p => !p)}
                style={{
                  background: '#2a2a2a', border: '1px solid #444', color: '#ffffff',
                  cursor: 'pointer', fontSize: '13px', width: '26px', height: '26px',
                  borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? '▾' : '▴'}
              </button>
            )}
            {isMobile && (
              <span style={{ fontSize: '14px', color: '#666' }}>
                {isMinimized ? '▴' : '▾'}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        {!isMinimized && (
          <div style={{ maxHeight: isMobile ? '55vh' : 'none', overflowY: isMobile ? 'auto' : 'visible' }}>
            <CategorySection categoryKey="qrMarkers"     items={qrItems}      isOpen={openSection === 'qrMarkers'}     onToggle={() => toggleSection('qrMarkers')}     onItemClick={flyTo} isMobile={isMobile} />
            <CategorySection categoryKey="services"      items={serviceItems} isOpen={openSection === 'services'}      onToggle={() => toggleSection('services')}      onItemClick={flyTo} isMobile={isMobile} />
            <CategorySection categoryKey="stalls"        items={stallItems}   isOpen={openSection === 'stalls'}        onToggle={() => toggleSection('stalls')}        onItemClick={flyTo} isMobile={isMobile} />
            <CategorySection categoryKey="threeDMarkers" items={threeDItems}  isOpen={openSection === 'threeDMarkers'} onToggle={() => toggleSection('threeDMarkers')} onItemClick={flyTo} isMobile={isMobile} />
          </div>
        )}
      </div>
    </div>
  );
}