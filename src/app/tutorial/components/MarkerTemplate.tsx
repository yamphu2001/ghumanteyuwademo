// // "use client";
// // import React from "react";
// // import styles from "./MarkerTemplate.module.css";

// // interface Step {
// //   icon: string;
// //   text: string;
// // }

// // interface MarkerProps {
// //   data: {
// //     num: string;
// //     icon: string;
// //     label: string;
// //     color: string;
// //     glow: string;
// //     tagline: string;
// //     desc: string;
// //     steps: Step[];
// //     gifFile: string;
// //   };
// // }

// // export default function MarkerTemplate({ data }: MarkerProps) {
// //   return (
// //     <div className={styles.root}>
// //       <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;700&display=swap" rel="stylesheet"/>

// //       <section className={styles.hero}>
// //         <div className={styles.heroGrid}/>
// //         <div className={styles.heroContent}>
// //           <p className={styles.eyebrow}>Field Guide · {data.label}</p>
// //           <h1 className={styles.title}>How to <span className={styles.grad}>Play</span></h1>
// //         </div>
// //       </section>

// //       <main className={styles.main}>
// //         <section 
// //           className={styles.section} 
// //           style={{"--c": data.color, "--glow": data.glow} as React.CSSProperties}
// //         >
// //           <div className={styles.secHeader}>
// //             <span className={styles.secNum}>{data.num}</span>
// //             <div>
// //               <div className={styles.secIcon}>{data.icon}</div>
// //               <h2 className={styles.secTitle}>{data.label}</h2>
// //               <p className={styles.secTagline}>{data.tagline}</p>
// //             </div>
// //           </div>

// //           <div className={styles.secBody}>
// //             <div className={styles.phoneWrap}>
// //               <div className={styles.phone}>
// //                 <div className={styles.notch}/>
// //                 <div className={styles.screen}>
// //                   <img src={`/gifs/${data.gifFile}`} alt={data.label} className={styles.gifImg}/>
// //                 </div>
// //                 <div className={styles.homeBar}/>
// //               </div>
// //             </div>

// //             <div className={styles.info}>
// //               <p className={styles.infoDesc}>{data.desc}</p>
// //               <ol className={styles.stepList}>
// //                 {data.steps.map((s, idx) => (
// //                   <li key={idx} className={styles.stepItem}>
// //                     <span className={styles.stepNum} style={{background: data.color}}>{idx+1}</span>
// //                     <span className={styles.stepIcon}>{s.icon}</span>
// //                     <span className={styles.stepText}>{s.text}</span>
// //                   </li>
// //                 ))}
// //               </ol>
// //             </div>
// //           </div>
// //         </section>
// //       </main>

// //       <footer className={styles.footer}>
// //         <a href="/">Back to Map</a>
// //       </footer>
// //     </div>
// //   );
// // }

// "use client";
// import React from "react";
// import Link from "next/link"; // Use Next.js Link for faster transitions
// import styles from "./MarkerTemplate.module.css";

// interface Step {
//   icon: string;
//   text: string;
// }

// interface MarkerProps {
//   data: {
//     num: string;
//     icon: string;
//     label: string;
//     color: string;
//     glow: string;
//     tagline: string;
//     desc: string;
//     steps: Step[];
//     gifFile: string;
//   };
//   // New optional prop to handle the flow
//   nextPage?: {
//     link: string;
//     label: string;
//   };
// }

// export default function MarkerTemplate({ data, nextPage }: MarkerProps) {
//   return (
//     <div className={styles.root}>
//       <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;700&display=swap" rel="stylesheet"/>

//       <section className={styles.hero}>
//         <div className={styles.heroGrid}/>
//         <div className={styles.heroContent}>
//           <p className={styles.eyebrow}>Field Guide · {data.label}</p>
//           <h1 className={styles.title}>How to <span className={styles.grad}>Play</span></h1>
//         </div>
//       </section>

//       <main className={styles.main}>
//         <section 
//           className={styles.section} 
//           style={{"--c": data.color, "--glow": data.glow} as React.CSSProperties}
//         >
//           <div className={styles.secHeader}>
//             <span className={styles.secNum}>{data.num}</span>
//             <div>
//               <div className={styles.secIcon}>{data.icon}</div>
//               <h2 className={styles.secTitle}>{data.label}</h2>
//               <p className={styles.secTagline}>{data.tagline}</p>
//             </div>
//           </div>

//           <div className={styles.secBody}>
//             <div className={styles.phoneWrap}>
//               <div className={styles.phone}>
//                 <div className={styles.notch}/>
//                 <div className={styles.screen}>
//                   <img src={`/gifs/${data.gifFile}`} alt={data.label} className={styles.gifImg}/>
//                 </div>
//                 <div className={styles.homeBar}/>
//               </div>
//             </div>

//             <div className={styles.info}>
//               <p className={styles.infoDesc}>{data.desc}</p>
//               <ol className={styles.stepList}>
//                 {data.steps.map((s, idx) => (
//                   <li key={idx} className={styles.stepItem}>
//                     <span className={styles.stepNum} style={{background: data.color}}>{idx+1}</span>
//                     <span className={styles.stepIcon}>{s.icon}</span>
//                     <span className={styles.stepText}>{s.text}</span>
//                   </li>
//                 ))}
//               </ol>
//             </div>
//           </div>
//         </section>
//       </main>

//       <footer className={styles.footer}>
//         {nextPage ? (
//           <div className={styles.footerNav}>
//              <p>Mastered this? Try the next one!</p>
//              <Link href={nextPage.link} className={styles.nextBtn}>
//                Next: {nextPage.label} →
//              </Link>
//           </div>
//         ) : (
//           <Link href="/" className={styles.backBtn}>
//             Return to Map 🗺️
//           </Link>
//         )}
//       </footer>
//     </div>
//   );
// }

"use client";
import React from "react";
import Link from "next/link";
import styles from "./MarkerTemplate.module.css";

interface Step {
  text: string;
}

interface MarkerProps {
  data: {
    label: string;
    tagline: string;
    steps: Step[];
    gifFile: string;
    section: string;
  };
  nextPage?: {
    link: string;
    label: string;
  };
}

export default function MarkerTemplate({ data, nextPage }: MarkerProps) {
  return (
    <div className={styles.root}>
      <div className={styles.container}>
        
        <div className={styles.phoneWrap}>
          <div className={styles.phone}>
            <div className={styles.screen}>
              <img src={`/gifs/${data.gifFile}`} alt={data.label} className={styles.gifImg} />
            </div>
          </div>
        </div>

        <div>
          <h1 className={styles.title}>
            {data.label.split(' ')[0]} <span className={styles.highlight}>{data.label.split(' ')[1]}</span>
          </h1>
          <p className={styles.tagline}>{data.tagline}</p>

          <div className={styles.stepList}>
            {data.steps.map((s, i) => (
              <div key={i} className={styles.stepItem}>
                <span className={styles.stepNum}>0{i + 1}</span>
                <p className={styles.stepText}>{s.text}</p>
              </div>
            ))}
          </div>

          <Link href={nextPage ? nextPage.link : "/"} className={styles.nextBtn}>
            {nextPage ? `NEXT: ${nextPage.label.toUpperCase()}` : "Plays Area"}
            <span>→</span>
          </Link>
        </div>
      </div>

      <div className={styles.footerLabel}>FIELD GUIDE — {data.section}</div>
    </div>
  );
}