

// "use client";

// import React, { useEffect, useState } from "react";
// import { db, auth } from "@/lib/firebase";
// import { collection, getDocs, doc, setDoc } from "firebase/firestore";
// import { onAuthStateChanged } from "firebase/auth";
// import { useRouter } from "next/navigation";

// export default function QuizPage() {
//   const router = useRouter();
  
//   // State Management
//   const [questions, setQuestions] = useState<any[]>([]);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [answers, setAnswers] = useState<{ [key: string]: string }>({});
//   const [revealed, setRevealed] = useState<{ [key: string]: boolean }>({});
//   const [userId, setUserId] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [finished, setFinished] = useState(false);
//   const [completedSteps, setCompletedSteps] = useState<number>(0);

//   // 1. Auth logic
//   useEffect(() => {
//     const unsub = onAuthStateChanged(auth, (user) => {
//       if (user) setUserId(user.uid);
//     });
//     return () => unsub();
//   }, []);

//   // 2. Load questions from Firestore
//   useEffect(() => {
//     const load = async () => {
//       try {
//         const snap = await getDocs(collection(db, "questions"));
//         if (!snap.empty) {
//           const qs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
//           setQuestions(qs);
//         }
//       } catch (error) {
//         console.error("Error loading questions:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     load();
//   }, []);

//   // 3. Restore progress from local storage
//   useEffect(() => {
//     const saved = localStorage.getItem("quiz-progress");
//     if (saved && questions.length > 0) {
//       const parsed = JSON.parse(saved);
//       setAnswers(parsed.answers || {});
//       setRevealed(parsed.revealed || {});
//       if (parsed.currentIndex < questions.length) {
//         setCurrentIndex(parsed.currentIndex || 0);
//       }
//     }
//   }, [questions]);

//   // 4. Persist progress to local storage
//   useEffect(() => {
//     if (questions.length > 0) {
//       localStorage.setItem(
//         "quiz-progress",
//         JSON.stringify({ answers, currentIndex, finished, revealed })
//       );
//     }
//   }, [answers, currentIndex, finished, revealed, questions]);

//   // Handle Answer Selection
//   const handleAnswer = (option: string) => {
//     const q = questions[currentIndex];
//     if (answers[q.id]) return;
//     setAnswers(prev => ({ ...prev, [q.id]: option }));
//     setRevealed(prev => ({ ...prev, [q.id]: true }));
//   };

//   // Finalize Quiz and Save to Firestore
//   const finishQuiz = async () => {
//     let correct = 0;
//     let earnedPoints = 0;

//     questions.forEach(q => {
//       if (answers[q.id] === q.correctAnswer) {
//         correct++;
//         earnedPoints += (q.points || 0);
//       }
//     });

//     if (userId) {
//       try {
//         await setDoc(doc(db, "participants", userId), {
//           correctanswers: correct,
//           totalPoints: earnedPoints,
//           quizCompleted: true,
//           updatedAt: new Date().toISOString()
//         }, { merge: true });
//       } catch (e) {
//         console.error("Firebase save error:", e);
//       }
//     }
//     setFinished(true);
//   };

//   const next = () => {
//     if (currentIndex < questions.length - 1) {
//       setCurrentIndex(currentIndex + 1);
//     } else {
//       finishQuiz();
//     }
//   };

//   const handleFollowClick = (url: string, stepIndex: number) => {
//     window.open(url, "_blank");
//     if (completedSteps < stepIndex) {
//       setCompletedSteps(stepIndex);
//     }
//   };

//   // --- RENDERING LOGIC ---

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
//       </div>
//     );
//   }

//   if (questions.length === 0) {
//     return (
//       <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
//         <h2 className="text-xl font-bold text-red-600">Quiz Not Found</h2>
//         <button onClick={() => window.location.reload()} className="mt-4 bg-black text-white px-6 py-2 rounded-lg">Refresh</button>
//       </div>
//     );
//   }

//   if (finished) {
//     let score = 0;
//     let earnedPoints = 0;
//     questions.forEach(q => {
//       if (answers[q.id] === q.correctAnswer) {
//         score++;
//         earnedPoints += (q.points || 0);
//       }
//     });

//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
//         <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm w-full border border-gray-100">
//           <img src="/landing/landing_logo.png" className="h-12 mx-auto mb-6" alt="Logo" />
          
//           <h1 className="text-2xl font-bold text-gray-900 mb-1">Quiz Complete!</h1>
          
//           <div className="flex justify-center gap-3 my-6">
//             <div className="bg-blue-50 px-4 py-2 rounded-2xl flex-1">
//               <p className="text-[10px] uppercase text-blue-500 font-bold">Accuracy</p>
//               <p className="text-blue-700 font-black text-xl">{score}/{questions.length}</p>
//             </div>
//             <div className="bg-yellow-50 px-4 py-2 rounded-2xl flex-1">
//               <p className="text-[10px] uppercase text-yellow-600 font-bold">Points</p>
//               <p className="text-yellow-700 font-black text-xl">{earnedPoints}</p>
//             </div>
//           </div>

//           <hr className="mb-6" />

//           <h2 className="text-xl font-extrabold text-gray-900 mb-2 text-left">Claim Your Prize</h2>
//           <div className="space-y-3">
//             <button
//               onClick={() => handleFollowClick("https://www.instagram.com/ghumanteyuwa", 1)}
//               className={`flex items-center justify-between w-full px-4 py-3 rounded-xl font-bold transition-all border-2 ${
//                 completedSteps >= 1 ? "border-green-500 bg-green-50 text-green-700" : "border-black bg-black text-white"
//               }`}
//             >
//               <span>1. Follow Ghumanteyuwa</span>
//               {completedSteps >= 1 && <span>✓</span>}
//             </button>

//             <button
//               onClick={() => handleFollowClick("https://www.instagram.com/rakuratea", 2)}
//               disabled={completedSteps < 1}
//               className={`flex items-center justify-between w-full px-4 py-3 rounded-xl font-bold transition-all border-2 ${
//                 completedSteps >= 2 ? "border-green-500 bg-green-50 text-green-700" : 
//                 completedSteps === 1 ? "border-black bg-black text-white" : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
//               }`}
//             >
//               <span>2. Follow Rakura Tea</span>
//               {completedSteps >= 2 && <span>✓</span>}
//             </button>

//             <button
//               onClick={() => router.push("/finale")}
//               disabled={completedSteps < 2}
//               className={`w-full py-4 rounded-xl font-extrabold mt-4 transition-all ${
//                 completedSteps >= 2 ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg" : "bg-gray-200 text-gray-400"
//               }`}
//             >
//               {completedSteps >= 2 ? "🚀 Go to Finale" : "Unlock Finale"}
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const q = questions[currentIndex];
//   const options = Array.isArray(q.options) ? q.options : String(q.options || "").split(",").map((o: string) => o.trim());

//   return (
//     <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
//       <img src="/landing/landing_logo.png" className="h-14 mb-4" alt="Logo" />
//       <div className="bg-white rounded-2xl shadow p-6 max-w-xl w-full">
//         <div className="flex justify-between items-center mb-2">
//           <p className="text-xs text-gray-500">Question {currentIndex + 1} of {questions.length}</p>
//           <p className="text-xs font-bold text-yellow-600">+{q.points || 0} Points</p>
//         </div>
//         <h2 className="text-xl font-semibold mb-6">{q.question}</h2>
        
//         <div className="space-y-3">
//           {options.map((opt: string, i: number) => {
//             const selected = answers[q.id] === opt;
//             const isCorrect = q.correctAnswer === opt;
//             const show = revealed[q.id];
            
//             let style = "border-2 border-gray-100 hover:border-gray-300";
//             if (show) {
//               if (isCorrect) style = "bg-green-500 text-white border-green-500";
//               else if (selected) style = "bg-red-500 text-white border-red-500";
//               else style = "opacity-50 border-gray-100";
//             }

//             return (
//               <button
//                 key={i}
//                 onClick={() => handleAnswer(opt)}
//                 disabled={!!answers[q.id]}
//                 className={`w-full text-left p-4 rounded-xl transition-all font-medium ${style}`}
//               >
//                 {opt}
//               </button>
//             );
//           })}
//         </div>

//         <button
//           onClick={next}
//           disabled={!answers[q.id]}
//           className="mt-8 w-full bg-black text-white py-4 rounded-xl font-bold disabled:opacity-30 transition-opacity"
//         >
//           {currentIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
//         </button>
//       </div>
//     </div>
//   );
// }



"use client";

import React, { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function QuizPage() {
  const router = useRouter();

  const [questions,      setQuestions]      = useState<any[]>([]);
  const [currentIndex,   setCurrentIndex]   = useState(0);
  const [answers,        setAnswers]        = useState<{ [key: string]: string }>({});
  const [revealed,       setRevealed]       = useState<{ [key: string]: boolean }>({});
  const [userId,         setUserId]         = useState<string | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [finished,       setFinished]       = useState(false);
  const [completedSteps, setCompletedSteps] = useState(0);

  // 1. Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
    });
    return () => unsub();
  }, []);

  // 2. Load questions
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, "questions"));
        if (!snap.empty) {
          setQuestions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      } catch (err) {
        console.error("Error loading questions:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // 3. Restore local progress
  useEffect(() => {
    const saved = localStorage.getItem("quiz-progress");
    if (saved && questions.length > 0) {
      const parsed = JSON.parse(saved);
      setAnswers(parsed.answers || {});
      setRevealed(parsed.revealed || {});
      if (parsed.currentIndex < questions.length) {
        setCurrentIndex(parsed.currentIndex || 0);
      }
    }
  }, [questions]);

  // 4. Persist local progress
  useEffect(() => {
    if (questions.length > 0) {
      localStorage.setItem(
        "quiz-progress",
        JSON.stringify({ answers, currentIndex, finished, revealed })
      );
    }
  }, [answers, currentIndex, finished, revealed, questions]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const calcScore = () => {
    let correct = 0;
    let earnedPoints = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        correct++;
        earnedPoints += q.points || 0;
      }
    });
    return { correct, earnedPoints, total: questions.length };
  };

  const handleAnswer = (option: string) => {
    const q = questions[currentIndex];
    if (answers[q.id]) return;
    setAnswers((prev) => ({ ...prev, [q.id]: option }));
    setRevealed((prev) => ({ ...prev, [q.id]: true }));
  };

  const finishQuiz = async () => {
    const { correct, earnedPoints, total } = calcScore();

    if (userId) {
      try {
        await setDoc(
          doc(db, "participants", userId),
          {
            quiz:           `${correct}/${total}`, // e.g. "2/3"
            correctanswers: correct,              // e.g. 2
            totalPoints:    earnedPoints,
            quizCompleted:  true,
            updatedAt:      new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (e) {
        console.error("Firebase save error:", e);
      }
    }
    setFinished(true);
  };

  const next = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishQuiz();
    }
  };

  const handleFollowClick = (url: string, stepIndex: number) => {
    window.open(url, "_blank");
    if (completedSteps < stepIndex) setCompletedSteps(stepIndex);
  };

  // ── Render: Loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <h2 className="text-xl font-bold text-red-600">Quiz Not Found</h2>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-black text-white px-6 py-2 rounded-lg"
        >
          Refresh
        </button>
      </div>
    );
  }

  // ── Render: Finished ───────────────────────────────────────────────────────
  if (finished) {
    const { correct, earnedPoints, total } = calcScore();

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm w-full border border-gray-100">
          <img src="/landing/landing_logo.png" className="h-12 mx-auto mb-6" alt="Logo" />

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Quiz Complete!</h1>

          {/* ── Score card: shows "correct / total" format ── */}
          <div className="flex justify-center gap-3 my-6">
            <div className="bg-blue-50 px-4 py-3 rounded-2xl flex-1">
              <p className="text-[10px] uppercase text-blue-500 font-bold mb-1">Accuracy</p>
              {/* "2 / 3" — clear correct-out-of-total */}
              <p className="text-blue-700 font-black text-xl">
                {correct}
                <span className="text-blue-400 font-semibold text-sm"> / {total}</span>
              </p>
            </div>
            <div className="bg-yellow-50 px-4 py-3 rounded-2xl flex-1">
              <p className="text-[10px] uppercase text-yellow-600 font-bold mb-1">Points</p>
              <p className="text-yellow-700 font-black text-xl">{earnedPoints}</p>
            </div>
          </div>

          <hr className="mb-6" />

          <h2 className="text-xl font-extrabold text-gray-900 mb-2 text-left">Claim Your Prize</h2>
          <div className="space-y-3">
            <button
              onClick={() => handleFollowClick("https://www.instagram.com/ghumanteyuwa", 1)}
              className={`flex items-center justify-between w-full px-4 py-3 rounded-xl font-bold transition-all border-2 ${
                completedSteps >= 1
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-black bg-black text-white"
              }`}
            >
              <span>1. Follow Ghumanteyuwa</span>
              {completedSteps >= 1 && <span>✓</span>}
            </button>

            <button
              onClick={() => handleFollowClick("https://www.instagram.com/rakuratea", 2)}
              disabled={completedSteps < 1}
              className={`flex items-center justify-between w-full px-4 py-3 rounded-xl font-bold transition-all border-2 ${
                completedSteps >= 2
                  ? "border-green-500 bg-green-50 text-green-700"
                  : completedSteps === 1
                  ? "border-black bg-black text-white"
                  : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <span>2. Follow Rakura Tea</span>
              {completedSteps >= 2 && <span>✓</span>}
            </button>

            <button
              onClick={() => router.push("/finale")}
              disabled={completedSteps < 2}
              className={`w-full py-4 rounded-xl font-extrabold mt-4 transition-all ${
                completedSteps >= 2
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              {completedSteps >= 2 ? "🚀 Go to Finale" : "Unlock Finale"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Active Question ────────────────────────────────────────────────
  const q = questions[currentIndex];
  const options = Array.isArray(q.options)
    ? q.options
    : String(q.options || "")
        .split(",")
        .map((o: string) => o.trim());

  // Running correct count so far (for the live counter)
  const correctSoFar = questions
    .slice(0, currentIndex)
    .filter((qq) => answers[qq.id] === qq.correctAnswer).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      <img src="/landing/landing_logo.png" className="h-14 mb-4" alt="Logo" />

      <div className="bg-white rounded-2xl shadow p-6 max-w-xl w-full">

        {/* ── Header row: question counter + score badge + points ── */}
        <div className="flex justify-between items-center mb-3">
          {/* Question progress */}
          <p className="text-xs text-gray-500">
            Question{" "}
            <span className="font-bold text-gray-800">{currentIndex + 1}</span>
            {" / "}
            <span className="font-bold text-gray-800">{questions.length}</span>
          </p>

          {/* Live correct / total badge */}
          <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
            ✓ {correctSoFar} / {questions.length} correct
          </span>

          {/* Points for this question */}
          <p className="text-xs font-bold text-yellow-600">+{q.points || 0} pts</p>
        </div>

        {/* ── Progress bar ── */}
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-5 overflow-hidden">
          <div
            className="h-full bg-black rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        <h2 className="text-xl font-semibold mb-6">{q.question}</h2>

        <div className="space-y-3">
          {options.map((opt: string, i: number) => {
            const selected  = answers[q.id] === opt;
            const isCorrect = q.correctAnswer === opt;
            const show      = revealed[q.id];

            let style = "border-2 border-gray-100 hover:border-gray-300";
            if (show) {
              if (isCorrect)      style = "bg-green-500 text-white border-green-500";
              else if (selected)  style = "bg-red-500 text-white border-red-500";
              else                style = "opacity-50 border-gray-100";
            }

            return (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                disabled={!!answers[q.id]}
                className={`w-full text-left p-4 rounded-xl transition-all font-medium ${style}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        <button
          onClick={next}
          disabled={!answers[q.id]}
          className="mt-8 w-full bg-black text-white py-4 rounded-xl font-bold disabled:opacity-30 transition-opacity"
        >
          {currentIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
        </button>
      </div>
    </div>
  );
}

