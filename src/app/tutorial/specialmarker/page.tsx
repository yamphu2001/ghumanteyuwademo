// import MarkerTemplate from "../components/MarkerTemplate";
// import type { Metadata } from "next";

// export const metadata: Metadata = {
//   title: "Special Marker Guide · Map Explorer",
//   description: "Challenge yourself with unique mini-games and win exclusive rewards.",
// };

// const DATA = {
//   num: "03",
//   icon: "⚡",
//   label: "Special Marker",
//   color: "#a855f7",
//   glow: "rgba(168,85,247,0.18)",
//   tagline: "Walk close · Play mini-game · Win rewards",
//   desc: "Special markers are the most exciting stops. Each one hides a unique mini-game — no two markers share the same game. Reach one, play the challenge, and earn rare rewards when you win.",
//   steps: [
//     { icon: "⚡", text: "Walk within 5 m — the special marker activates" },
//     { icon: "🎮", text: "A unique mini-game launches — it differs per marker" },
//     { icon: "🏆", text: "Complete the game to earn XP & exclusive rewards" },
//   ],
//   gifFile: "special-demo.gif",
// };

// export default function MuseumTutorial() {
//   return (
//     <MarkerTemplate 
//       data={DATA} 
//       nextPage={{ link: "/events/basantapur/play", label: "Play Area" }} 
//     />
//   );
// }



import MarkerTemplate from "../components/MarkerTemplate";

export default function Page() {
  const DATA = {
    label: "SPECIAL MARKER",
    tagline: "Challenge · Play · Reward",
    section: "SECTION 03",
    gifFile: "special-demo.gif",
    steps: [
      { text: "Reach the special marker, complete its mini-game challenge, and win to earn exclusive rewards." },
      // { text: "Complete the specific objective (games vary per marker location)." },
      // { text: "Win the game to claim exclusive rewards and bonus experience points." },
    ]
  };

  return (
    <MarkerTemplate 
      data={DATA} 
      nextPage={{ 
        link: "/events/basantapur/play", 
        label: "Play Area" 
      }} 
    />
  );
}