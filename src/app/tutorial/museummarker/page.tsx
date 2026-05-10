// import MarkerTemplate from "../components/MarkerTemplate";
// import type { Metadata } from "next";

// export const metadata: Metadata = {
//   title: "Museum Marker Guide · Map Explorer",
//   description: "Learn how to scan QR codes and explore exhibits at heritage sites.",
// };

// const DATA = {
//   num: "02",
//   icon: "🏛️",
//   label: "Museum Marker",
//   color: "#f59e0b",
//   glow: "rgba(245,158,11,0.18)",
//   tagline: "Walk close · Find QR · Scan · Explore",
//   desc: "Museum markers live inside real galleries and heritage sites. Get close on the map, then look for the physical QR code placed at the exhibit. Scan it with your camera — the popup opens with the exhibit's name, photo, and rich description.",
//   steps: [
//     { icon: "🏛️", text: "Enter the museum & walk within 5 m of the marker" },
//     { icon: "🔍", text: "Find the physical QR code placed at the exhibit" },
//     { icon: "📷", text: "Scan the QR code — exhibit popup opens immediately" },
//   ],
//   gifFile: "museum-demo.gif",
// };

// export default function MuseumTutorial() {
//   return (
//     <MarkerTemplate 
//       data={DATA} 
//       nextPage={{ link: "/tutorial/specialmarker", label: "Special Marker" }} 
//     />
//   );
// }


import MarkerTemplate from "../components/MarkerTemplate";

export default function Page() {
  const DATA = {
    label: "MUSEUM MARKER",
    tagline: "Enter · Find QR · Scan",
    section: "SECTION 02",
    gifFile: "museum-demo.gif",
    steps: [
      { text: "Walk within 5m of the museum marker and scan the nearby QR code to unlock its digital details." },
      // { text: "Locate the physical QR code displayed near the exhibit or artifact." },
      // { text: "Scan using the in-app camera to immediately unlock the digital details." },
    ]
  };
  return <MarkerTemplate data={DATA} nextPage={{ link: "/tutorial/specialmarker", label: "Special Marker" }} />;
}