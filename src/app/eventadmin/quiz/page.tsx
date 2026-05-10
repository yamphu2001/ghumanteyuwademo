// "use client";

// import React, { useEffect, useState, useCallback } from "react";
// import { db } from "@/lib/firebase";
// import {
//   collection,
//   getDocs,
//   addDoc,
//   updateDoc,
//   deleteDoc,
//   doc,
//   writeBatch,
//   getDoc,
//   setDoc,
// } from "firebase/firestore";

// // --- Types ---
// interface QuizQuestion {
//   id: string;
//   question: string;
//   options: string[];
//   correctAnswer: string;
//   points: number;
// }

// type FormState = Omit<QuizQuestion, "id">;

// const EMPTY_FORM: FormState = {
//   question: "",
//   options: ["", "", "", ""],
//   correctAnswer: "",
//   points: 10,
// };

// export default function AdminQuiz() {
//   const [questions, setQuestions] = useState<QuizQuestion[]>([]);
//   const [targetEventId, setTargetEventId] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState<string | null>(null);
  
//   // Quiz Config
//   const [displayCount, setDisplayCount] = useState<number>(5);
  
//   const [modalOpen, setModalOpen] = useState(false);
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [form, setForm] = useState<FormState>(EMPTY_FORM);
//   const [bulkOpen, setBulkOpen] = useState(false);
//   const [jsonText, setJsonText] = useState("");

//   // --- Logic to handle Max Questions ---
//   // We ensure the user can't set a limit higher than existing questions
//   const maxAvailable = questions.length;
//   const effectiveDisplayCount = Math.min(displayCount, maxAvailable || 5);

//   const fetchData = useCallback(async () => {
//     if (!targetEventId) {
//       setQuestions([]);
//       return;
//     }
//     setLoading(true);
//     try {
//       // 1. Fetch Questions
//       const snap = await getDocs(collection(db, "events", targetEventId, "quizzes"));
//       const loadedQuestions = snap.docs.map(d => ({ id: d.id, ...d.data() } as QuizQuestion));
//       setQuestions(loadedQuestions);

//       // 2. Fetch Config
//       const configRef = doc(db, "events", targetEventId, "configs", "quiz");
//       const configSnap = await getDoc(configRef);
//       if (configSnap.exists()) {
//         const savedCount = configSnap.data().displayCount || 5;
//         // If saved count is higher than what we have, cap it visually
//         setDisplayCount(savedCount);
//       }
//     } catch (e: any) {
//       setError(`Load failed: ${e.message}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [targetEventId]);

//   useEffect(() => {
//     fetchData();
//   }, [fetchData]);

//   const handleSaveConfig = async () => {
//     if (!targetEventId) {
//       setError("Please enter a Target Event ID first.");
//       return;
//     }
//     try {
//       // Save the intended count, but the UI/Client will cap it at maxAvailable
//       await setDoc(doc(db, "events", targetEventId, "configs", "quiz"), {
//         displayCount: Number(displayCount),
//         updatedAt: new Date().toISOString()
//       }, { merge: true });
//       showSuccess(`Config updated: Will ask up to ${displayCount} questions.`);
//     } catch (e: any) {
//       setError(e.message);
//     }
//   };

//   const handleSaveQuestion = async () => {
//     if (!form.question || !form.correctAnswer) {
//       setError("Question and Correct Answer are required.");
//       return;
//     }
//     setSaving(true);
//     try {
//       const colRef = collection(db, "events", targetEventId, "quizzes");
//       if (editingId) {
//         await updateDoc(doc(db, "events", targetEventId, "quizzes", editingId), form);
//       } else {
//         await addDoc(colRef, form);
//       }
//       setModalOpen(false);
//       fetchData();
//       showSuccess("Question saved.");
//     } catch (e: any) {
//       setError(e.message);
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleDelete = async (id: string) => {
//     if (!confirm("Delete this question?")) return;
//     try {
//       await deleteDoc(doc(db, "events", targetEventId, "quizzes", id));
//       fetchData();
//     } catch (e: any) { setError(e.message); }
//   };

//   const handleBulkUpload = async () => {
//     if (!targetEventId) return setError("Enter Event ID");
//     try {
//       const parsed = JSON.parse(jsonText);
//       const batch = writeBatch(db);
//       parsed.forEach((q: any) => {
//         const newDoc = doc(collection(db, "events", targetEventId, "quizzes"));
//         batch.set(newDoc, {
//           question: q.question,
//           options: q.options || [],
//           correctAnswer: q.correctAnswer,
//           points: q.points || 10
//         });
//       });
//       await batch.commit();
//       setBulkOpen(false);
//       setJsonText("");
//       fetchData();
//       showSuccess("Bulk upload successful.");
//     } catch (e: any) { setError("Invalid JSON format."); }
//   };

//   const showSuccess = (msg: string) => {
//     setSuccess(msg);
//     setTimeout(() => setSuccess(null), 3000);
//   };

//   return (
//     <div style={styles.page}>
//       <header style={styles.header}>
//         <div>
//           <h1 style={styles.title}>🧠 Quiz Admin</h1>
//           <p style={styles.subtitle}>Event-specific question management</p>
//         </div>

//         <div style={styles.eventIdContainer}>
//           <span style={{ fontSize: 10, fontWeight: 800, color: '#3b82f6' }}>TARGET EVENT:</span>
//           <input 
//             placeholder="e.g. event_01" 
//             value={targetEventId} 
//             onChange={(e) => setTargetEventId(e.target.value)}
//             style={styles.smallInput}
//           />
//         </div>

//         <div style={{ display: "flex", gap: 10 }}>
//           <button style={styles.bulkBtn} onClick={() => setBulkOpen(true)}>📦 Bulk JSON</button>
//           <button style={styles.addBtn} onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setModalOpen(true); }}>+ New Question</button>
//         </div>
//       </header>

//       {/* Config Bar - Individual to Event ID */}
//       <div style={styles.configBar}>
//         <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
//             <label style={{ fontWeight: 700, fontSize: 13, color: '#475569' }}>QUESTIONS PER QUIZ:</label>
//             <input 
//               type="number" 
//               min={1}
//               max={maxAvailable}
//               value={displayCount} 
//               onChange={(e) => setDisplayCount(Number(e.target.value))} 
//               style={{ ...styles.smallInput, width: 70, fontWeight: 'bold', textAlign: 'center' }}
//             />
//             <button style={styles.saveBtn} onClick={handleSaveConfig}>Save Setting</button>
//           </div>
          
//           <div style={{ display: "flex", gap: 20 }}>
//             <div style={styles.statBox}>
//                 <span style={styles.statLabel}>Available Pool</span>
//                 <span style={styles.statValue}>{maxAvailable}</span>
//             </div>
//             <div style={styles.statBox}>
//                 <span style={styles.statLabel}>Active Limit</span>
//                 <span style={{...styles.statValue, color: displayCount > maxAvailable ? '#ef4444' : '#10b981'}}>
//                     {effectiveDisplayCount}
//                 </span>
//             </div>
//           </div>
//         </div>
//         {displayCount > maxAvailable && maxAvailable > 0 && (
//             <p style={{ color: '#ef4444', fontSize: 11, marginTop: 10, fontWeight: 600 }}>
//                 ⚠️ Warning: You've set a limit higher than available questions. Users will see all {maxAvailable} questions.
//             </p>
//         )}
//       </div>

//       {success && <div style={styles.toastSuccess}>{success}</div>}
//       {error && <div style={styles.toastError}>{error}</div>}

//       <div style={styles.card}>
//         {loading ? (
//           <div style={styles.empty}>Fetching data...</div>
//         ) : questions.length === 0 ? (
//           <div style={styles.empty}>
//             {targetEventId ? "No questions found for this ID." : "Enter an Event ID above to begin."}
//           </div>
//         ) : (
//           <table style={styles.table}>
//             <thead>
//               <tr>
//                 <th style={styles.th}>Question</th>
//                 <th style={styles.th}>Correct Answer</th>
//                 <th style={styles.th}>Points</th>
//                 <th style={styles.th}>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {questions.map((q) => (
//                 <tr key={q.id}>
//                   <td style={styles.td}>{q.question}</td>
//                   <td style={styles.td}><span style={styles.badge}>{q.correctAnswer}</span></td>
//                   <td style={styles.td}>{q.points}</td>
//                   <td style={styles.td}>
//                     <button style={styles.editBtn} onClick={() => { setForm(q); setEditingId(q.id); setModalOpen(true); }}>✏️</button>
//                     <button style={styles.deleteBtn} onClick={() => handleDelete(q.id)}>🗑</button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>

//       {/* Question Modal */}
//       {modalOpen && (
//         <div style={styles.modalOverlay} onClick={() => setModalOpen(false)}>
//           <div style={styles.modal} onClick={e => e.stopPropagation()}>
//             <h2 style={styles.modalTitle}>{editingId ? "Edit Question" : "New Question"}</h2>
            
//             <label style={styles.label}>Question Text</label>
//             <textarea 
//               style={styles.input} 
//               value={form.question} 
//               onChange={e => setForm({...form, question: e.target.value})} 
//             />

//             <div style={styles.grid2}>
//                {form.options.map((opt, idx) => (
//                  <div key={idx}>
//                    <label style={styles.label}>Option {idx + 1}</label>
//                    <input 
//                     style={styles.input} 
//                     value={opt} 
//                     onChange={e => {
//                       const newOpts = [...form.options];
//                       newOpts[idx] = e.target.value;
//                       setForm({...form, options: newOpts});
//                     }}
//                    />
//                  </div>
//                ))}
//             </div>

//             <label style={styles.label}>Correct Answer</label>
//             <select 
//               style={styles.input} 
//               value={form.correctAnswer} 
//               onChange={e => setForm({...form, correctAnswer: e.target.value})}
//             >
//               <option value="">-- Choose Correct Option --</option>
//               {form.options.filter(o => o.trim() !== "").map(opt => (
//                 <option key={opt} value={opt}>{opt}</option>
//               ))}
//             </select>

//             <div style={styles.modalFooter}>
//               <button style={styles.saveBtn} onClick={handleSaveQuestion} disabled={saving}>
//                 {saving ? "Saving..." : "Save to Firestore"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Bulk Modal */}
//       {bulkOpen && (
//         <div style={styles.modalOverlay} onClick={() => setBulkOpen(false)}>
//           <div style={styles.modal} onClick={e => e.stopPropagation()}>
//             <h2 style={styles.modalTitle}>Bulk Upload JSON</h2>
//             <textarea 
//               style={{...styles.input, height: 250, fontFamily: 'monospace', fontSize: 12}} 
//               value={jsonText} 
//               onChange={e => setJsonText(e.target.value)}
//               placeholder='[
//   {
//     "question": "Sample Question?",
//     "options": ["A", "B", "C", "D"],
//     "correctAnswer": "A",
//     "points": 10
//   }
// ]'
//             />
//             <button style={{...styles.saveBtn, width: '100%', marginTop: 10}} onClick={handleBulkUpload}>
//                 Commit Batch to Event {targetEventId}
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // --- Enhanced Styles ---
// const styles: Record<string, React.CSSProperties> = {
//   page: { minHeight: "100vh", background: "#f8fafc", padding: "40px 20px", fontFamily: "Inter, sans-serif" },
//   header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 },
//   title: { fontSize: 28, fontWeight: 800, color: '#1e293b', margin: 0 },
//   subtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },
//   eventIdContainer: { background: "#fff", padding: "8px 16px", borderRadius: 12, border: "2px solid #e2e8f0", display: "flex", alignItems: "center", gap: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
//   smallInput: { border: "1px solid #cbd5e1", padding: "8px 12px", borderRadius: 8, width: 120, outline: 'none' },
//   configBar: { background: "#fff", padding: "20px 24px", borderRadius: 16, marginBottom: 24, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", border: '1px solid #f1f5f9' },
//   statBox: { textAlign: 'right', display: 'flex', flexDirection: 'column' },
//   statLabel: { fontSize: 10, fontWeight: 700, color: '#94a3b8', uppercase: 'true' } as any,
//   statValue: { fontSize: 20, fontWeight: 800, color: '#1e293b' },
//   card: { background: "#fff", borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden", border: '1px solid #e2e8f0' },
//   table: { width: "100%", borderCollapse: "collapse" },
//   th: { padding: "16px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#64748b", borderBottom: "2px solid #f1f5f9", background: "#f8fafc", textTransform: 'uppercase' },
//   td: { padding: "16px", borderBottom: "1px solid #f1f5f9", fontSize: 14, color: '#334155' },
//   badge: { background: "#f0fdf4", color: "#166534", padding: "4px 10px", borderRadius: 6, fontWeight: 700, fontSize: 12, border: '1px solid #bbf7d0' },
//   addBtn: { background: "#3b82f6", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", cursor: "pointer", fontWeight: 700, transition: 'all 0.2s' },
//   bulkBtn: { background: "#0f172a", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", cursor: "pointer", fontWeight: 700 },
//   editBtn: { background: "#f1f5f9", border: "none", cursor: "pointer", marginRight: 8, padding: '6px', borderRadius: 6 },
//   deleteBtn: { background: "#fef2f2", border: "none", cursor: "pointer", padding: '6px', borderRadius: 6 },
//   modalOverlay: { position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: 'blur(4px)' },
//   modal: { background: "#fff", borderRadius: 20, padding: 32, width: "100%", maxWidth: 600, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
//   modalTitle: { fontSize: 22, fontWeight: 800, marginBottom: 20, color: '#0f172a' },
//   input: { padding: "12px", borderRadius: 10, border: "1px solid #e2e8f0", width: "100%", marginBottom: 16, outline: 'none', fontSize: 14 },
//   label: { display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#475569' },
//   grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
//   modalFooter: { display: "flex", justifyContent: "flex-end", marginTop: 10 },
//   saveBtn: { padding: "10px 20px", borderRadius: 10, border: "none", background: "#3b82f6", color: "#fff", cursor: "pointer", fontWeight: 700 },
//   toastSuccess: { background: "#10b981", color: "#fff", padding: "14px 20px", borderRadius: 12, marginBottom: 20, fontWeight: 600, fontSize: 14 },
//   toastError: { background: "#ef4444", color: "#fff", padding: "14px 20px", borderRadius: 12, marginBottom: 20, fontWeight: 600, fontSize: 14 },
//   empty: { padding: 60, textAlign: "center", color: "#94a3b8", fontWeight: 500 }
// };


"use client";

import React, { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  getDoc,
  setDoc,
} from "firebase/firestore";
// 1. ADD IMPORT
import { useEventId } from "@/app/eventadmin/Eventidcontext";

// --- Types ---
interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  points: number;
}

type FormState = Omit<QuizQuestion, "id">;

const EMPTY_FORM: FormState = {
  question: "",
  options: ["", "", "", ""],
  correctAnswer: "",
  points: 10,
};

export default function AdminQuiz() {
  // 2. REPLACE LOCAL STATE
  const { eventId } = useEventId();
  
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Quiz Config
  const [displayCount, setDisplayCount] = useState<number>(5);
  const [timerSeconds, setTimerSeconds] = useState<number>(30);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [jsonText, setJsonText] = useState("");

  const maxAvailable = questions.length;
  const effectiveDisplayCount = Math.min(displayCount, maxAvailable || 5);

  const fetchData = useCallback(async () => {
    if (!eventId) {
      setQuestions([]);
      return;
    }
    setLoading(true);
    try {
      // 1. Fetch Questions
      const snap = await getDocs(collection(db, "events", eventId, "quizzes"));
      const loadedQuestions = snap.docs.map(d => ({ id: d.id, ...d.data() } as QuizQuestion));
      setQuestions(loadedQuestions);

      // 2. Fetch Config
      const configRef = doc(db, "events", eventId, "configs", "quiz");
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) {
        const savedCount = configSnap.data().displayCount || 5;
        const savedTimer = configSnap.data().timerSeconds || 30;
        setDisplayCount(savedCount);
        setTimerSeconds(savedTimer);
      }
    } catch (e: any) {
      setError(`Load failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveConfig = async () => {
    if (!eventId) {
      setError("Please select an event first.");
      return;
    }
    try {
      await setDoc(doc(db, "events", eventId, "configs", "quiz"), {
        displayCount: Number(displayCount),
        timerSeconds: Number(timerSeconds),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      showSuccess(`Config updated: ${displayCount} questions and ${timerSeconds}s timer.`);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleSaveQuestion = async () => {
    if (!form.question || !form.correctAnswer) {
      setError("Question and Correct Answer are required.");
      return;
    }
    setSaving(true);
    try {
      const colRef = collection(db, "events", eventId, "quizzes");
      if (editingId) {
        await updateDoc(doc(db, "events", eventId, "quizzes", editingId), form);
      } else {
        await addDoc(colRef, form);
      }
      setModalOpen(false);
      fetchData();
      showSuccess("Question saved.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    try {
      await deleteDoc(doc(db, "events", eventId, "quizzes", id));
      fetchData();
    } catch (e: any) { setError(e.message); }
  };

  const handleBulkUpload = async () => {
    if (!eventId) return setError("Select an Event ID");
    try {
      const parsed = JSON.parse(jsonText);
      const batch = writeBatch(db);
      parsed.forEach((q: any) => {
        const newDoc = doc(collection(db, "events", eventId, "quizzes"));
        batch.set(newDoc, {
          question: q.question,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          points: q.points || 10
        });
      });
      await batch.commit();
      setBulkOpen(false);
      setJsonText("");
      fetchData();
      showSuccess("Bulk upload successful.");
    } catch (e: any) { setError("Invalid JSON format."); }
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>🧠 Quiz Admin</h1>
          <p style={styles.subtitle}>Event: {eventId || "None Selected"}</p>
        </div>

        {/* 3. DELETE THE EVENT ID INPUT BOX */}

        <div style={{ display: "flex", gap: 10 }}>
          <button style={styles.bulkBtn} onClick={() => setBulkOpen(true)}>📦 Bulk JSON</button>
          <button style={styles.addBtn} onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setModalOpen(true); }}>+ New Question</button>
        </div>
      </header>

      {eventId ? (
        <>
          <div style={styles.configBar}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 15, flexWrap: 'wrap' }}>
                <label style={{ fontWeight: 700, fontSize: 13, color: '#475569' }}>QUESTIONS PER QUIZ:</label>
                <input 
                  type="number" 
                  min={1}
                  max={maxAvailable || 50}
                  value={displayCount} 
                  onChange={(e) => setDisplayCount(Number(e.target.value))} 
                  style={{ ...styles.smallInput, width: 70, fontWeight: 'bold', textAlign: 'center' }}
                />
                <label style={{ fontWeight: 700, fontSize: 13, color: '#475569' }}>TIMER (SEC):</label>
                <input
                  type="number"
                  min={5}
                  max={300}
                  value={timerSeconds}
                  onChange={(e) => setTimerSeconds(Number(e.target.value))}
                  style={{ ...styles.smallInput, width: 70, fontWeight: 'bold', textAlign: 'center' }}
                />
                <button style={styles.saveBtn} onClick={handleSaveConfig}>Save Setting</button>
              </div>
              
              <div style={{ display: "flex", gap: 20 }}>
                <div style={styles.statBox}>
                    <span style={styles.statLabel}>Available Pool</span>
                    <span style={styles.statValue}>{maxAvailable}</span>
                </div>
                <div style={styles.statBox}>
                    <span style={styles.statLabel}>Active Limit</span>
                    <span style={{...styles.statValue, color: displayCount > maxAvailable ? '#ef4444' : '#10b981'}}>
                        {effectiveDisplayCount}
                    </span>
                </div>
              </div>
            </div>
            {displayCount > maxAvailable && maxAvailable > 0 && (
                <p style={{ color: '#ef4444', fontSize: 11, marginTop: 10, fontWeight: 600 }}>
                    ⚠️ Warning: Limit higher than available pool.
                </p>
            )}
          </div>

          {success && <div style={styles.toastSuccess}>{success}</div>}
          {error && <div style={styles.toastError}>{error}</div>}

          <div style={styles.card}>
            {loading ? (
              <div style={styles.empty}>Fetching data...</div>
            ) : questions.length === 0 ? (
              <div style={styles.empty}>No questions found for this event.</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Question</th>
                    <th style={styles.th}>Correct Answer</th>
                    <th style={styles.th}>Points</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q) => (
                    <tr key={q.id}>
                      <td style={styles.td}>{q.question}</td>
                      <td style={styles.td}><span style={styles.badge}>{q.correctAnswer}</span></td>
                      <td style={styles.td}>{q.points}</td>
                      <td style={styles.td}>
                        <button style={styles.editBtn} onClick={() => { setForm(q); setEditingId(q.id); setModalOpen(true); }}>✏️</button>
                        <button style={styles.deleteBtn} onClick={() => handleDelete(q.id)}>🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <div style={styles.empty}>Please select an event from the sidebar.</div>
      )}

      {/* Question Modal */}
      {modalOpen && (
        <div style={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>{editingId ? "Edit Question" : "New Question"}</h2>
            
            <label style={styles.label}>Question Text</label>
            <textarea 
              style={styles.input} 
              value={form.question} 
              onChange={e => setForm({...form, question: e.target.value})} 
            />

            <div style={styles.grid2}>
               {form.options.map((opt, idx) => (
                 <div key={idx}>
                   <label style={styles.label}>Option {idx + 1}</label>
                   <input 
                    style={styles.input} 
                    value={opt} 
                    onChange={e => {
                      const newOpts = [...form.options];
                      newOpts[idx] = e.target.value;
                      setForm({...form, options: newOpts});
                    }}
                   />
                 </div>
               ))}
            </div>

            <label style={styles.label}>Correct Answer</label>
            <select 
              style={styles.input} 
              value={form.correctAnswer} 
              onChange={e => setForm({...form, correctAnswer: e.target.value})}
            >
              <option value="">-- Choose Correct Option --</option>
              {form.options.filter(o => o.trim() !== "").map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>

            <div style={styles.modalFooter}>
              <button style={styles.saveBtn} onClick={handleSaveQuestion} disabled={saving}>
                {saving ? "Saving..." : "Save to Firestore"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Modal */}
      {bulkOpen && (
        <div style={styles.modalOverlay} onClick={() => setBulkOpen(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Bulk Upload JSON</h2>
            <textarea 
              style={{...styles.input, height: 250, fontFamily: 'monospace', fontSize: 12}} 
              value={jsonText} 
              onChange={e => setJsonText(e.target.value)}
              placeholder='[{"question": "Example?", "options": ["A","B"], "correctAnswer": "A"}]'
            />
            <button style={{...styles.saveBtn, width: '100%', marginTop: 10}} onClick={handleBulkUpload}>
                Commit Batch to Event {eventId}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f8fafc", padding: "40px 20px", fontFamily: "Inter, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 800, color: '#1e293b', margin: 0 },
  subtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },
  smallInput: { border: "1px solid #cbd5e1", padding: "8px 12px", borderRadius: 8, width: 120, outline: 'none' },
  configBar: { background: "#fff", padding: "20px 24px", borderRadius: 16, marginBottom: 24, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", border: '1px solid #f1f5f9' },
  statBox: { textAlign: 'right', display: 'flex', flexDirection: 'column' },
  statLabel: { fontSize: 10, fontWeight: 700, color: '#94a3b8' },
  statValue: { fontSize: 20, fontWeight: 800, color: '#1e293b' },
  card: { background: "#fff", borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden", border: '1px solid #e2e8f0' },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "16px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#64748b", borderBottom: "2px solid #f1f5f9", background: "#f8fafc", textTransform: 'uppercase' },
  td: { padding: "16px", borderBottom: "1px solid #f1f5f9", fontSize: 14, color: '#334155' },
  badge: { background: "#f0fdf4", color: "#166534", padding: "4px 10px", borderRadius: 6, fontWeight: 700, fontSize: 12, border: '1px solid #bbf7d0' },
  addBtn: { background: "#3b82f6", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", cursor: "pointer", fontWeight: 700 },
  bulkBtn: { background: "#0f172a", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", cursor: "pointer", fontWeight: 700 },
  editBtn: { background: "#f1f5f9", border: "none", cursor: "pointer", marginRight: 8, padding: '6px', borderRadius: 6 },
  deleteBtn: { background: "#fef2f2", border: "none", cursor: "pointer", padding: '6px', borderRadius: 6 },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { background: "#fff", borderRadius: 20, padding: 32, width: "100%", maxWidth: 600 },
  modalTitle: { fontSize: 22, fontWeight: 800, marginBottom: 20, color: '#0f172a' },
  input: { padding: "12px", borderRadius: 10, border: "1px solid #e2e8f0", width: "100%", marginBottom: 16, outline: 'none', fontSize: 14 },
  label: { display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#475569' },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  modalFooter: { display: "flex", justifyContent: "flex-end", marginTop: 10 },
  saveBtn: { padding: "10px 20px", borderRadius: 10, border: "none", background: "#3b82f6", color: "#fff", cursor: "pointer", fontWeight: 700 },
  toastSuccess: { background: "#10b981", color: "#fff", padding: "14px 20px", borderRadius: 12, marginBottom: 20, fontWeight: 600, fontSize: 14 },
  toastError: { background: "#ef4444", color: "#fff", padding: "14px 20px", borderRadius: 12, marginBottom: 20, fontWeight: 600, fontSize: 14 },
  empty: { padding: 60, textAlign: "center", color: "#94a3b8", fontWeight: 500 }
};