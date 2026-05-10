
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Trophy, ChevronLeft, Loader2, Map } from "lucide-react";
import { db, auth, rtdb } from "@/lib/firebase"; 
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { ref, set, get } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";

export default function QuizPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [lowProgress, setLowProgress] = useState({ isLow: false, pct: 0 });
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(30);

  useEffect(() => {
  let isMounted = true;
  
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      router.push("/");
      return;
    }

    setUserId(user.uid);

    try {
      setLoading(true);

      // 1. Check if user already finished the quiz (ONE TIME ONLY logic)
      const resultRef = ref(rtdb, `eventsProgress/${eventId}/${user.uid}/quizResult`);
      const resultSnap = await get(resultRef);

      if (resultSnap.exists() && resultSnap.val().status === "finished") {
        if (isMounted) {
          setScore(resultSnap.val().totalScore || 0);
          setQuizComplete(true);
          setLoading(false);
        }
        return;
      }

      // 2. Fetch Progress check (80% rule)
      const progressRef = ref(rtdb, `eventsProgress/${eventId}/${user.uid}/userInfo`);
      const snapshot = await get(progressRef);
      const userData = snapshot.val();

      const progressStr = userData?.progress || "0%";
      const currentPct = parseInt(progressStr.replace("%", ""), 10);

      if (currentPct < 80) {
        if (isMounted) {
          setLowProgress({ isLow: true, pct: currentPct });
          setLoading(false);
        }
        return;
      }

      // 3. Fetch Quiz Questions from Firestore
      const quizRef = collection(db, "events", eventId, "quizzes");
      const qSnap = await getDocs(quizRef);

      // 4. Fetch timer config from Firestore
      const configRef = doc(db, "events", eventId, "configs", "quiz");
      const configSnap = await getDoc(configRef);
      const savedTimer = configSnap.exists() ? Number(configSnap.data().timerSeconds || 30) : 30;

      if (isMounted) {
        const fetched = qSnap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          question: d.data().question || d.data().text || "Untitled",
          options: d.data().options || [],
          correctAnswer: d.data().correctAnswer || d.data().answer || "",
          points: Number(d.data().points || 10),
        }));

        // Shuffle and take top 5
        setQuestions(fetched.sort(() => 0.5 - Math.random()).slice(0, 5));
        setTimerSeconds(savedTimer);
        setLoading(false);
      }
    } catch (error) {
      console.error("Quiz Initialization Error:", error);
      if (isMounted) setLoading(false);
    }
  });

  return () => {
    isMounted = false;
    unsubscribe();
  };
}, [eventId, router]);

  const storageKey = (uid: string) => `eventQuizState:${eventId}:${uid}`;

  const loadPersistedState = (uid: string) => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(storageKey(uid));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const persistState = (state: { currentIndex: number; score: number; expiresAt: number }) => {
    if (!userId || typeof window === "undefined") return;
    window.localStorage.setItem(storageKey(userId), JSON.stringify(state));
  };

  const clearPersistedState = () => {
    if (!userId || typeof window === "undefined") return;
    window.localStorage.removeItem(storageKey(userId));
  };

  useEffect(() => {
    if (!userId || questions.length === 0 || quizComplete) return;

    const saved = loadPersistedState(userId);
    const now = Date.now();

    if (saved && typeof saved.currentIndex === "number") {
      const restoredIndex = Math.min(saved.currentIndex, questions.length - 1);
      const restoredScore = typeof saved.score === "number" ? saved.score : 0;
      const remaining = saved.expiresAt ? Math.ceil((saved.expiresAt - now) / 1000) : 0;
      const nextExpires = remaining > 0 ? saved.expiresAt : now + timerSeconds * 1000;

      setCurrentIndex(restoredIndex);
      setScore(restoredScore);
      setExpiresAt(nextExpires);
      setTimeLeft(remaining > 0 ? remaining : timerSeconds);
      persistState({ currentIndex: restoredIndex, score: restoredScore, expiresAt: nextExpires });
    } else {
      const initialExpires = now + timerSeconds * 1000;
      setExpiresAt(initialExpires);
      setTimeLeft(timerSeconds);
      persistState({ currentIndex, score, expiresAt: initialExpires });
    }
  }, [questions.length, userId, quizComplete, timerSeconds]);

  useEffect(() => {
    if (quizComplete || expiresAt === null || questions.length === 0) return;

    const tick = async () => {
      const remaining = Math.ceil((expiresAt - Date.now()) / 1000);
      if (remaining <= 0) {
        if (currentIndex < questions.length - 1) {
          const nextIndex = currentIndex + 1;
          const nextExpires = Date.now() + timerSeconds * 1000;

          setCurrentIndex(nextIndex);
          setSelectedAnswer(null);
          setIsCorrect(null);
          setExpiresAt(nextExpires);
          setTimeLeft(timerSeconds);
          persistState({ currentIndex: nextIndex, score, expiresAt: nextExpires });
        } else {
          setQuizComplete(true);
          clearPersistedState();
          await saveToFirebase(score);
        }
      } else {
        setTimeLeft(remaining);
      }
    };

    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [expiresAt, currentIndex, score, quizComplete, questions.length, userId, timerSeconds]);

  const handleAnswer = (option: string) => {
  if (selectedAnswer || quizComplete) return;

  const currentQuestion = questions[currentIndex];
  const correct = option === currentQuestion.correctAnswer;
  
  setSelectedAnswer(option);
  setIsCorrect(correct);

  // 1. Calculate the next score locally so we don't wait for state updates
  const newScore = correct ? score + currentQuestion.points : score;
  
  if (correct) setScore(newScore);

  setTimeout(async () => {
    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextExpires = Date.now() + timerSeconds * 1000;

      setCurrentIndex(nextIndex);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setExpiresAt(nextExpires);
      setTimeLeft(timerSeconds);
      persistState({ currentIndex: nextIndex, score: newScore, expiresAt: nextExpires });
    } else {
      setQuizComplete(true);
      clearPersistedState();
      
      // 2. Trigger the save logic
      await saveToFirebase(newScore);
    }
  }, 1500);
};

const saveToFirebase = async (finalScore: number) => {
  const user = auth.currentUser;
  if (!user) {
    console.error("No user authenticated");
    return;
  }

  try {
    // Reference to: eventsProgress > [eventId] > [userId] > quizResult
    const resultRef = ref(rtdb, `eventsProgress/${eventId}/${user.uid}/quizResult`);
    
    await set(resultRef, {
      totalScore: finalScore,
      completedAt: new Date().toISOString(),
      attempts: 1,
      status: "finished"
    });
    
    console.log("✅ Data saved to RTDB!");
  } catch (err) {
    console.error("❌ Firebase Save Error:", err);
  }
};

  if (loading) return <div className="h-screen flex flex-col items-center justify-center bg-white text-black"><Loader2 className="animate-spin mb-2 text-red-600" /><span>Loading Mission...</span></div>;

  if (lowProgress.isLow) return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-white p-6 text-center">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white p-10 rounded-[48px] shadow-2xl max-w-sm w-full border border-red-100">
        <Map className="text-red-600 mx-auto mb-4" size={48} />
        <h2 className="text-2xl font-black text-black mb-2">Quiz Locked</h2>
        <p className="text-black mb-2">You have completed <b>{lowProgress.pct}%</b> of tasks.</p>
        <p className="text-black font-bold mb-8 text-sm">Complete 80% task to get access to quiz, so spend more time in map to complete more tasks.</p>
        <button onClick={() => router.back()} className="w-full py-5 bg-red-600 text-white rounded-3xl font-black shadow-lg">RETURN TO MAP</button>
      </motion.div>
    </div>
  );

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-6">
      {!quizComplete ? (
        <div className="bg-white w-full max-w-md rounded-[40px] p-8 border border-red-100 shadow-lg">
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] font-bold text-red-600">Quiz Challenge</p>
                <h1 className="text-3xl font-black text-black mt-2">Complete the mission</h1>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-bold">Question</p>
                <p className="text-2xl font-black text-black">{currentIndex + 1}/{questions.length}</p>
              </div>
            </div>
            <div className="rounded-3xl border border-red-100 bg-red-50 p-4 flex items-center justify-between">
              <span className="text-sm uppercase tracking-[0.3em] font-bold text-red-600">Time left</span>
              <span className={`text-2xl font-black ${timeLeft <= 5 ? "text-red-700" : "text-black"}`}>{timeLeft}s</span>
            </div>
          </div>
          <h2 className="text-2xl font-black mb-8 text-black">{questions[currentIndex]?.question}</h2>
          <div className="space-y-3">
            {questions[currentIndex]?.options.map((opt: string) => (
              <button key={opt} onClick={() => handleAnswer(opt)} disabled={!!selectedAnswer}
                className={`w-full p-5 text-left rounded-3xl border-2 font-bold transition-all ${selectedAnswer === opt ? (isCorrect ? "bg-red-600 text-white border-red-600" : "bg-red-500 text-white border-red-500") : "bg-white text-black border-red-200 hover:bg-red-50"}`}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white w-full max-w-md rounded-[48px] p-12 text-center border border-red-100 shadow-lg">
        <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="text-red-600" size={40} />
        </div>
        <h2 className="text-2xl font-black mb-2 text-black">Mission Accomplished!</h2>
        <p className="text-black mb-8">You have already completed this quiz.</p>
        
        <div className="bg-red-50 p-6 rounded-4xl mb-8 border border-red-100">
          <span className="text-black font-bold uppercase text-xs tracking-widest">Your Score</span>
          <h3 className="text-5xl font-black text-red-600">{score}</h3>
        </div>

        <button 
          onClick={() => router.back()} 
          className="w-full py-5 bg-red-600 text-white rounded-3xl font-black shadow-lg"
        >
          RETURN TO MAP
        </button>
      </div>
    )}
  </main>
);
}