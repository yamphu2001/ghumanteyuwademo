
// 'use client';

// import React, { useEffect, useState } from 'react';
// import { createPortal } from 'react-dom';

// interface PopupProps {
//   isOpen: boolean;
//   onClose: () => void;
//   data: {
//     name: string;
//     description: string;
//     color: string;
//   } | null;
// }

// export default function FullScreenPopup({ isOpen, onClose, data }: PopupProps) {
//   const [mounted, setMounted] = useState(false);

//   // Ensure we are on the client before using Portals
//   useEffect(() => {
//     setMounted(true);
//     return () => setMounted(false);
//   }, []);

//   if (!isOpen || !data || !mounted) return null;

//   // We use createPortal to move this UI out of the Map container 
//   // and directly into the document body to guarantee the buttons work.
//   return createPortal(
//     <div 
//       style={{
//         position: 'fixed',
//         top: 0,
//         left: 0,
//         width: '100vw',
//         height: '100vh',
//         backgroundColor: 'rgba(0, 0, 0, 0.85)',
//         backdropFilter: 'blur(8px)',
//         zIndex: 99999, // Extremely high to stay above everything
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         padding: '20px',
//         pointerEvents: 'auto', // Force events to work
//       }}
//       onClick={(e) => {
//         // Only close if the background is clicked
//         if (e.target === e.currentTarget) onClose();
//       }}
//     >
//       <div 
//         style={{
//           background: 'white',
//           width: '100%',
//           maxWidth: '500px',
//           borderRadius: '24px',
//           overflow: 'hidden',
//           position: 'relative',
//           boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
//           animation: 'popup-slide-up 0.3s ease-out'
//         }}
//       >
//         {/* Top Color Bar */}
//         <div style={{ height: '12px', background: data.color }} />
        
//         {/* Top Close Button (X) */}
//         {/* <button 
//           onClick={(e) => {
//             e.stopPropagation();
//             onClose();
//           }}
//           style={{
//             position: 'absolute',
//             top: '20px',
//             right: '20px',
//             border: 'none',
//             background: '#f3f4f6',
//             width: '36px',
//             height: '36px',
//             borderRadius: '50%',
//             cursor: 'pointer',
//             fontSize: '22px',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             color: '#374151',
//             transition: 'background 0.2s',
//             zIndex: 10
//           }}
//         >
//           &times;
//         </button> */}

//         <div style={{ padding: '32px', color: '#111' }}>
//           <h2 style={{ fontSize: '28px', marginBottom: '8px', fontWeight: '800', lineHeight: '1.2' }}>
//             {data.name}
//           </h2>
//           <div style={{ height: '2px', background: '#f3f4f6', margin: '16px 0' }} />
          
//           <div style={{ maxHeight: '40vh', overflowY: 'auto' }}>
//             <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#4b5563' }}>
//               {data.description || "No description available for this stall."}
//             </p>
//           </div>
          
//           <button 
//             onClick={(e) => {
//               e.stopPropagation();
//               onClose();
//             }}
//             style={{
//               marginTop: '32px',
//               width: '100%',
//               padding: '16px',
//               background: '#111827',
//               color: 'white',
//               border: 'none',
//               borderRadius: '14px',
//               fontWeight: '600',
//               fontSize: '16px',
//               cursor: 'pointer',
//               boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
//             }}
//           >
//             Close Details
//           </button>
//         </div>
//       </div>

//       <style dangerouslySetInnerHTML={{ __html: `
//         @keyframes popup-slide-up {
//           from { opacity: 0; transform: translateY(30px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//       `}} />
//     </div>,
//     document.body
//   );
// }



'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    name: string;
    description: string;
    color: string;
  } | null;
}

export default function FullScreenPopup({ isOpen, onClose, data }: PopupProps) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    
    // Prevent background scrolling when popup is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    window.addEventListener('resize', checkMobile);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('resize', checkMobile);
    };
  }, [isOpen]);

  if (!isOpen || !data || !mounted) return null;

  return createPortal(
    <div 
      style={{
        position: 'fixed',
        // Inset 0 is more reliable than 100vh/100vw on mobile browsers
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center', 
        justifyContent: 'center',
        padding: isMobile ? '0' : '20px',
        pointerEvents: 'auto',
        WebkitTapHighlightColor: 'transparent',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          background: 'white',
          width: '100%',
          maxWidth: isMobile ? '100%' : '500px',
          borderRadius: isMobile ? '24px 24px 0 0' : '24px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 -10px 25px -5px rgba(0, 0, 0, 0.2)',
          animation: isMobile ? 'popup-slide-up-mobile 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'popup-slide-up 0.3s ease-out',
          maxHeight: isMobile ? '85vh' : 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Mobile Drag Indicator */}
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px', flexShrink: 0 }}>
            <div style={{ width: '36px', height: '5px', background: '#e5e7eb', borderRadius: '10px' }} />
          </div>
        )}

        {/* Color Accent Bar */}
        <div style={{ height: '8px', background: data.color, flexShrink: 0 }} />
        
        <div style={{ 
          padding: isMobile ? '20px 24px' : '32px', 
          color: '#111', 
          overflowY: 'auto', // Allow content to scroll if description is long
          flex: 1 
        }}>
          <h2 style={{ 
            fontSize: isMobile ? '24px' : '28px', 
            marginBottom: '4px', 
            fontWeight: '800', 
            lineHeight: '1.2',
            letterSpacing: '-0.02em'
          }}>
            {data.name}
          </h2>
          
          <div style={{ height: '1px', background: '#f3f4f6', margin: '16px 0' }} />
          
          <div style={{ paddingBottom: '16px' }}>
            <p style={{ 
              fontSize: '16px', 
              lineHeight: '1.6', 
              color: '#4b5563',
              whiteSpace: 'pre-wrap' // Preserves formatting of descriptions
            }}>
              {data.description || "No description available for this stall."}
            </p>
          </div>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            style={{
              marginTop: '12px',
              width: '100%',
              padding: '16px',
              background: '#111827',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              fontWeight: '600',
              fontSize: '16px',
              cursor: 'pointer',
              // Extra bottom padding for mobile home indicators (iOS)
              marginBottom: isMobile ? 'env(safe-area-inset-bottom, 20px)' : '0',
              transition: 'transform 0.1s active',
            }}
          >
            Close Details
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes popup-slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes popup-slide-up-mobile {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}} />
    </div>,
    document.body
  );
}