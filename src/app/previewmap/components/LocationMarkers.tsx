'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function LocationMarkers({ map, eventId }: { map: any, eventId: string }) {
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!map || !eventId) return;

    const loadMarkers = async () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      const colRef = collection(db, 'events', eventId, 'locationmarkers');
      const snapshot = await getDocs(colRef);

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.lat || !data.lng) return;

        // --- TEARDROP SHAPE IMPLEMENTATION ---
        const el = document.createElement('div');
        el.style.width = '50px';
        el.style.height = '50px';
        el.style.cursor = 'pointer';
        
        // Parent: The White Pin Shape
        el.style.backgroundColor = 'white';
        el.style.borderRadius = '50% 50% 50% 0';
        el.style.transform = 'rotate(-45deg)'; // Tilted to point the sharp corner down
        el.style.display = 'flex';
        el.style.justifyContent = 'center';
        el.style.alignItems = 'center';
        el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
        el.style.border = '1px solid rgba(0,0,0,0.1)';

        // Child: The Image
        const imgInner = document.createElement('div');
        imgInner.style.backgroundImage = `url(${data.image})`;
        imgInner.style.width = '42px'; // Leaves room for the white "border"
        imgInner.style.height = '42px';
        imgInner.style.backgroundSize = 'cover';
        imgInner.style.backgroundPosition = 'center';
        imgInner.style.borderRadius = '50%';
        
        // Counter-rotate the image 45deg so it stays upright
        imgInner.style.transform = 'rotate(360deg)'; 
        
        el.appendChild(imgInner);

        // Fullscreen Popup UI
        const popupHTML = `
          <div class="fullscreen-inner">
            <div class="popup-card">
               <button class="close-btn" onclick="this.closest('.maplibregl-popup').remove()">×</button>
               <h2 class="popup-title">${data.name || ''}</h2>
               <div class="img-container">
                  <img src="${data.popupImage || data.image}" alt="${data.name}" />
               </div>
               <p class="popup-text">${data.text || ''}</p>
            </div>
          </div>
        `;

        const marker = new maplibregl.Marker({ 
          element: el,
          anchor: 'bottom' // Points the tip exactly at the coordinates
        })
          .setLngLat([data.lng, data.lat])
          .setPopup(new maplibregl.Popup({ 
            offset: [0, -45], // Adjusted offset for the new pin height
            className: 'fullscreen-popup',
            maxWidth: 'none'
          }).setHTML(popupHTML))
          .addTo(map);

        markersRef.current.push(marker);
      });
    };

    loadMarkers();
  }, [map, eventId]);

  return (
    <style dangerouslySetInnerHTML={{ __html: `
      .fullscreen-popup.maplibregl-popup {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        max-width: 100vw !important;
        transform: none !important;
        z-index: 9999 !important;
        margin: 0 !important;
      }
      .fullscreen-popup .maplibregl-popup-content {
        background: rgba(0, 0, 0, 0.85) !important;
        width: 100% !important;
        height: 100% !important;
        padding: 0 !important;
        display: flex !important;
        align-items: center;
        justify-content: center;
      }
      .fullscreen-popup .maplibregl-popup-tip { display: none !important; }
      .fullscreen-popup .maplibregl-popup-close-button { display: none; }
      .fullscreen-inner { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 20px; }
      .popup-card {
        background: white; width: 90%; max-width: 500px; border-radius: 20px; padding: 30px;
        position: relative; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        animation: slideIn 0.3s ease-out;
      }
      @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      .popup-title { margin: 0 0 20px 0; font-size: 24px; color: #1a1a1a; font-family: sans-serif; }
      .img-container img { width: 100%; max-height: 300px; object-fit: cover; border-radius: 12px; margin-bottom: 20px; }
      .popup-text { font-size: 16px; color: #444; line-height: 1.5; margin: 0; font-family: sans-serif; }
      .close-btn {
        position: absolute; top: 15px; right: 15px; background: #f0f0f0; border: none; font-size: 24px;
        width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;
      }
    `}} />
  );
}