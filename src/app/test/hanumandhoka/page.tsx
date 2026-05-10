// "use client";

// import PlayerMarker from "./playermarker";
// import { landmarks } from "./locationmarker";
// export default function MapPage() {
//     return (
//         // The container needs a height/width for the map to show up!
//         <div style={{ width: '100vw', height: '100vh' }}>
//             <PlayerMarker />
//             <main style={{ width: '100vw', height: '100vh', position: 'relative' }}>
//             {/* Pass the landmarks data as a prop to your Map component */}
//             <PlayerMarker landmarkData={landmarks} />
//         </main>
//         </div>
//     );
// }

"use client";

import dynamic from 'next/dynamic';
// 1. Import the Interface and the Data
import { Landmark, landmarks } from "./locationmarker"; 

// 2. Import your Map component dynamically (to prevent SSR errors)
const PlayerMarker = dynamic(() => import("./playermarker"), { 
    ssr: false,
    loading: () => <div style={{ background: '#000', height: '100vh' }} /> 
});

export default function MapPage() {
    return (
        <main style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}>
            {/* 3. Pass the data to your component */}
            <PlayerMarker landmarkData={landmarks} />
        </main>
    );
}