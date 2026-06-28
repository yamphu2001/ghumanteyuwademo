
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
import { useEventId } from "@/app/eventadmin/Eventidcontext";

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
  const { eventId } = useEventId();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [displayCount, setDisplayCount] = useState<number>(1);
  const [timerSeconds, setTimerSeconds] = useState<number>(30);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [jsonText, setJsonText] = useState("");

  const maxAvailable = questions.length;
  const effectiveDisplayCount = Math.min(displayCount, maxAvailable || 5);

  const fetchData = useCallback(async () => {
    if (!eventId) { setQuestions([]); return; }
    setLoading(true); // FIX: removed erroneous `text:` label
    try {
      const snap = await getDocs(collection(db, "events", eventId, "quizzes"));
      const loadedQuestions = snap.docs.map(d => ({ id: d.id, ...d.data() } as QuizQuestion));
      setQuestions(loadedQuestions);

      const configRef = doc(db, "events", eventId, "configs", "quiz");
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) {
        setDisplayCount(configSnap.data().displayCount || 5);
        setTimerSeconds(configSnap.data().timerSeconds || 30);
      }
    } catch (e: any) {
      setError(`Load failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveConfig = async () => {
    if (!eventId) { setError("Please select an event first."); return; }
    try {
      await setDoc(doc(db, "events", eventId, "configs", "quiz"), {
        displayCount: Number(displayCount),
        timerSeconds: Number(timerSeconds),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      showSuccess(`Config updated: ${displayCount} questions and ${timerSeconds}s timer.`);
    } catch (e: any) { setError(e.message); }
  };

  const handleSaveQuestion = async () => {
    if (!form.question || !form.correctAnswer) { setError("Question and Correct Answer are required."); return; }
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
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
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
    <div className="quiz-admin-container" style={{ background: "#fff", minHeight: "100vh", padding: 28, fontFamily: "monospace", boxSizing: "border-box" }}>

      {/* ── Responsive CSS ── */}
      <style>{`
        * { box-sizing: border-box; }

        /* ── Base touch targets ── */
        .quiz-btn {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-family: monospace;
          font-weight: 700;
          letter-spacing: 1px;
        }

        /* ── MOBILE: 767px and below ── */
        @media (max-width: 767px) {
          .quiz-admin-container {
            padding: 14px 12px !important;
          }

          /* Header */
          .quiz-header-flex {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 14px !important;
            padding-bottom: 14px !important;
            margin-bottom: 18px !important;
          }
          .quiz-header-title h1 {
            font-size: 20px !important;
          }
          .quiz-header-buttons {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
            width: 100% !important;
          }
          .quiz-header-buttons button {
            width: 100% !important;
            min-height: 44px !important;
            font-size: 10px !important;
            padding: 0 8px !important;
          }

          /* Config bar */
          .quiz-config-box {
            padding: 14px !important;
            margin-bottom: 16px !important;
          }
          .quiz-config-flex {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 16px !important;
          }
          .quiz-config-settings {
            flex-direction: column !important;
            align-items: stretch !important;
            width: 100% !important;
            gap: 10px !important;
          }
          .quiz-config-row {
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: center !important;
          }
          .quiz-config-save-btn {
            width: 100% !important;
            min-height: 44px !important;
            font-size: 12px !important;
          }
          .quiz-config-stats {
            flex-direction: row !important;
            justify-content: space-around !important;
            border-top: 1.5px solid #e5e5e5;
            padding-top: 14px;
          }
          .quiz-config-stats > div {
            text-align: center !important;
          }
          .quiz-stat-value {
            font-size: 28px !important;
          }

          /* ── CARD VIEW replaces table on mobile ── */
          .quiz-table-wrapper { display: none !important; }
          .quiz-card-list { display: flex !important; }

          /* Modal */
          .quiz-modal-overlay {
            padding: 16px !important;
            align-items: flex-end !important; /* sheet from bottom */
          }
          .quiz-modal-content {
            padding: 20px 16px 28px !important;
            width: 100% !important;
            max-width: 100% !important;
            max-height: 88vh !important;
            border-radius: 0 !important;
            box-shadow: 0 -4px 0 0 #dc2626 !important;
          }
          .quiz-options-grid {
            grid-template-columns: 1fr !important;
            gap: 0 !important;
          }
          .quiz-save-btn {
            min-height: 50px !important;
            font-size: 13px !important;
          }

          /* Bulk modal */
          .quiz-bulk-content {
            padding: 20px 16px 28px !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .quiz-bulk-textarea {
            height: 180px !important;
          }
        }

        /* ── VERY SMALL: 374px and below ── */
        @media (max-width: 374px) {
          .quiz-admin-container {
            padding: 10px 8px !important;
          }
          .quiz-header-title h1 {
            font-size: 17px !important;
          }
          .quiz-header-buttons {
            grid-template-columns: 1fr !important;
          }
        }

        /* ── DESKTOP: hide card list, show table ── */
        @media (min-width: 768px) {
          .quiz-card-list { display: none !important; }
          .quiz-table-wrapper { display: block !important; }
          .quiz-modal-overlay { align-items: center !important; }
        }

        /* Card list base (hidden on desktop) */
        .quiz-card-list {
          display: none;
          flex-direction: column;
          gap: 10px;
          margin-top: 0;
        }
        .quiz-question-card {
          border: 1.5px solid #000;
          padding: 14px;
          background: #fff;
        }
        .quiz-question-card:nth-child(odd) {
          background: #fafafa;
        }
        .quiz-card-answer-badge {
          display: inline-block;
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #dc2626;
          padding: 2px 8px;
          font-family: monospace;
          font-size: 10px;
          font-weight: 700;
          word-break: break-all;
        }
        .quiz-card-actions {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }
        .quiz-card-actions button {
          flex: 1;
          min-height: 40px;
          font-family: monospace;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        /* Input focus */
        input:focus, textarea:focus, select:focus {
          outline: 2px solid #dc2626 !important;
          outline-offset: 1px;
        }
      `}</style>

      {/* ── Page Header ── */}
      <div
        className="quiz-header-flex"
        style={{ borderBottom: "3px solid #000", paddingBottom: 16, marginBottom: 28, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}
      >
        <div className="quiz-header-title">
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#dc2626", fontWeight: 700, marginBottom: 4 }}>FOREVENT</div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "#000", letterSpacing: 1 }}>QUIZ ADMIN</h1>
          <div style={{ fontSize: 10, color: "#999", marginTop: 4, letterSpacing: 0.5 }}>
            EVENT: <span style={{ color: "#dc2626", fontWeight: 700 }}>{eventId || "NONE SELECTED"}</span>
          </div>
        </div>
        <div className="quiz-header-buttons" style={{ display: "flex", gap: 8 }}>
          <button
            className="quiz-btn"
            style={{ background: "#fff", color: "#000", border: "1.5px solid #000", padding: "9px 16px", fontSize: 11, letterSpacing: 1 }}
            onClick={() => setBulkOpen(true)}
          >
            BULK JSON
          </button>
          <button
            className="quiz-btn"
            style={{ background: "#dc2626", color: "#fff", border: "none", padding: "9px 16px", fontSize: 11, letterSpacing: 1 }}
            onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setModalOpen(true); }}
          >
            + NEW QUESTION
          </button>
        </div>
      </div>

      {eventId ? (
        <>
          {/* ── Config Bar ── */}
          <div className="quiz-config-box" style={{ border: "2px solid #000", padding: 20, marginBottom: 24, background: "#fff" }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: "#dc2626", fontWeight: 700, marginBottom: 14 }}>● QUIZ CONFIGURATION</div>
            <div className="quiz-config-flex" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div className="quiz-config-settings" style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <label className="quiz-config-row" style={ui.configLabel}>
                  <span>QUESTIONS PER QUIZ</span>
                  <input
                    type="number" min={1} max={maxAvailable || 50}
                    value={displayCount}
                    onChange={(e) => setDisplayCount(Number(e.target.value))}
                    style={ui.smallInput}
                  />
                </label>
                <label className="quiz-config-row" style={ui.configLabel}>
                  <span>TIMER (SEC)</span>
                  <input
                    type="number" min={5} max={300}
                    value={timerSeconds}
                    onChange={(e) => setTimerSeconds(Number(e.target.value))}
                    style={ui.smallInput}
                  />
                </label>
                <button
                  className="quiz-btn quiz-config-save-btn"
                  style={{ background: "#000", color: "#fff", border: "none", padding: "8px 16px", fontSize: 11, letterSpacing: 1 }}
                  onClick={handleSaveConfig}
                >
                  SAVE
                </button>
              </div>
              <div className="quiz-config-stats" style={{ display: "flex", gap: 20 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, letterSpacing: 1.5, color: "#999", fontWeight: 700 }}>POOL</div>
                  <div className="quiz-stat-value" style={{ fontSize: 22, fontWeight: 900, color: "#000" }}>{maxAvailable}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, letterSpacing: 1.5, color: "#999", fontWeight: 700 }}>ACTIVE</div>
                  <div className="quiz-stat-value" style={{ fontSize: 22, fontWeight: 900, color: displayCount > maxAvailable ? "#dc2626" : "#000" }}>
                    {effectiveDisplayCount}
                  </div>
                </div>
              </div>
            </div>
            {displayCount > maxAvailable && maxAvailable > 0 && (
              <div style={{ color: "#dc2626", fontSize: 10, marginTop: 10, fontWeight: 700, letterSpacing: 0.5 }}>
                ⚠ WARNING: LIMIT HIGHER THAN AVAILABLE POOL
              </div>
            )}
          </div>

          {/* ── Toasts ── */}
          {success && (
            <div style={{ background: "#000", color: "#fff", padding: "12px 16px", marginBottom: 16, fontFamily: "monospace", fontSize: 11, letterSpacing: 1, fontWeight: 700 }}>
              ✓ {success}
            </div>
          )}
          {error && (
            <div style={{ background: "#fef2f2", color: "#dc2626", border: "1.5px solid #dc2626", padding: "12px 16px", marginBottom: 16, fontFamily: "monospace", fontSize: 11, letterSpacing: 0.5, fontWeight: 700 }}>
              ✕ {error}
              <button
                onClick={() => setError(null)}
                style={{ float: "right", background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 14, fontWeight: 900, lineHeight: 1 }}
                aria-label="Dismiss error"
              >×</button>
            </div>
          )}

          {/* ── DESKTOP TABLE ── */}
          <div className="quiz-table-wrapper" style={{ border: "2px solid #000", overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: 48, textAlign: "center", fontFamily: "monospace", fontSize: 12, color: "#999", letterSpacing: 2 }}>FETCHING DATA...</div>
            ) : questions.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", fontFamily: "monospace", fontSize: 12, color: "#999" }}>No questions found for this event.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#000", color: "#fff" }}>
                    {["QUESTION", "CORRECT ANSWER", "POINTS", "ACTIONS"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontFamily: "monospace", fontSize: 9, fontWeight: 700, letterSpacing: 2 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q, i) => (
                    <tr key={q.id} style={{ borderBottom: "1.5px solid #e5e5e5", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={ui.td}>{q.question}</td>
                      <td style={ui.td}>
                        <span style={{ display: "inline-block", background: "#fef2f2", color: "#dc2626", border: "1px solid #dc2626", padding: "2px 8px", fontFamily: "monospace", fontSize: 10, fontWeight: 700 }}>
                          {q.correctAnswer}
                        </span>
                      </td>
                      <td style={{ ...ui.td, fontWeight: 700 }}>{q.points}</td>
                      <td style={ui.td}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="quiz-btn"
                            style={{ background: "#fff", border: "1.5px solid #000", padding: "4px 10px", fontSize: 10, fontWeight: 600 }}
                            onClick={() => { setForm(q); setEditingId(q.id); setModalOpen(true); }}
                          >
                            EDIT
                          </button>
                          <button
                            className="quiz-btn"
                            style={{ background: "#fff", border: "1.5px solid #dc2626", color: "#dc2626", padding: "4px 10px", fontSize: 10, fontWeight: 600 }}
                            onClick={() => handleDelete(q.id)}
                          >
                            DEL
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── MOBILE CARD LIST ── */}
          <div className="quiz-card-list">
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", fontFamily: "monospace", fontSize: 12, color: "#999", letterSpacing: 2 }}>FETCHING DATA...</div>
            ) : questions.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", fontFamily: "monospace", fontSize: 12, color: "#999" }}>No questions found for this event.</div>
            ) : (
              questions.map((q, i) => (
                <div key={q.id} className="quiz-question-card">
                  {/* Card header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 8 }}>
                    <div style={{ fontSize: 9, letterSpacing: 1.5, color: "#999", fontWeight: 700 }}>Q{i + 1}</div>
                    <div style={{ fontSize: 9, letterSpacing: 1.5, color: "#999", fontWeight: 700 }}>{q.points} PTS</div>
                  </div>
                  {/* Question text */}
                  <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 10, lineHeight: 1.5 }}>
                    {q.question}
                  </div>
                  {/* Answer */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 9, letterSpacing: 1.5, color: "#999", fontWeight: 700 }}>ANSWER:</span>
                    <span className="quiz-card-answer-badge">{q.correctAnswer}</span>
                  </div>
                  {/* Options preview */}
                  {q.options && q.options.length > 0 && (
                    <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {q.options.filter(o => o.trim()).map((opt, oi) => (
                        <span key={oi} style={{
                          fontSize: 10, fontFamily: "monospace",
                          padding: "2px 7px",
                          border: opt === q.correctAnswer ? "1.5px solid #dc2626" : "1px solid #d1d5db",
                          color: opt === q.correctAnswer ? "#dc2626" : "#555",
                          background: opt === q.correctAnswer ? "#fef2f2" : "#f9f9f9",
                          fontWeight: opt === q.correctAnswer ? 700 : 400,
                        }}>
                          {opt}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Actions */}
                  <div className="quiz-card-actions">
                    <button
                      style={{ background: "#fff", border: "1.5px solid #000", color: "#000" }}
                      onClick={() => { setForm(q); setEditingId(q.id); setModalOpen(true); }}
                    >
                      EDIT
                    </button>
                    <button
                      style={{ background: "#fff", border: "1.5px solid #dc2626", color: "#dc2626" }}
                      onClick={() => handleDelete(q.id)}
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div style={{ padding: 60, textAlign: "center", fontFamily: "monospace", fontSize: 12, color: "#999", letterSpacing: 1 }}>
          Please select an event from the sidebar.
        </div>
      )}

      {/* ── Question Modal ── */}
      {modalOpen && (
        <div
          className="quiz-modal-overlay"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="quiz-modal-content"
            style={{ background: "#fff", padding: 32, width: "100%", maxWidth: 580, border: "2px solid #000", boxShadow: "6px 6px 0px 0px #dc2626", maxHeight: "90vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: "#dc2626", fontWeight: 700 }}>
                ● {editingId ? "EDIT QUESTION" : "NEW QUESTION"}
              </div>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#000", lineHeight: 1, padding: "0 4px", fontWeight: 900 }}
                aria-label="Close modal"
              >×</button>
            </div>

            <Field label="Question Text">
              <textarea style={{ ...ui.input, minHeight: 80, resize: "vertical" }} value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} />
            </Field>

            <div className="quiz-options-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {form.options.map((opt, idx) => (
                <Field key={idx} label={`Option ${idx + 1}`}>
                  <input style={ui.input} value={opt} onChange={e => {
                    const newOpts = [...form.options];
                    newOpts[idx] = e.target.value;
                    setForm({ ...form, options: newOpts });
                  }} />
                </Field>
              ))}
            </div>

            <Field label="Correct Answer">
              <select style={ui.input} value={form.correctAnswer} onChange={e => setForm({ ...form, correctAnswer: e.target.value })}>
                <option value="">-- Choose Correct Option --</option>
                {form.options.filter(o => o.trim() !== "").map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <button
                className="quiz-btn quiz-save-btn"
                style={{ background: "#dc2626", color: "#fff", border: "none", padding: "11px 24px", fontSize: 11, letterSpacing: 1, opacity: saving ? 0.7 : 1, width: "100%", textAlign: "center", cursor: saving ? "not-allowed" : "pointer" }}
                onClick={handleSaveQuestion}
                disabled={saving}
              >
                {saving ? "SAVING..." : "SAVE TO FIRESTORE"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Modal ── */}
      {bulkOpen && (
        <div
          className="quiz-modal-overlay"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
          onClick={() => setBulkOpen(false)}
        >
          <div
            className="quiz-bulk-content quiz-modal-content"
            style={{ background: "#fff", padding: 32, width: "100%", maxWidth: 580, border: "2px solid #000", boxShadow: "6px 6px 0px 0px #dc2626" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: "#dc2626", fontWeight: 700 }}>● BULK UPLOAD JSON</div>
              <button
                onClick={() => setBulkOpen(false)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#000", lineHeight: 1, padding: "0 4px", fontWeight: 900 }}
                aria-label="Close modal"
              >×</button>
            </div>
            <textarea
              className="quiz-bulk-textarea"
              style={{ ...ui.input, height: 240, fontFamily: "monospace", fontSize: 11, resize: "vertical" }}
              value={jsonText}
              onChange={e => setJsonText(e.target.value)}
              placeholder='[{"question": "Example?", "options": ["A","B"], "correctAnswer": "A"}]'
            />
            <button
              className="quiz-btn"
              style={{ background: "#dc2626", color: "#fff", border: "none", padding: "12px 0", width: "100%", marginTop: 10, fontSize: 11, letterSpacing: 1, minHeight: 48 }}
              onClick={handleBulkUpload}
            >
              COMMIT BATCH TO EVENT {eventId}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: "#666", textTransform: "uppercase", marginBottom: 5, fontFamily: "monospace" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const ui: Record<string, React.CSSProperties> = {
  input: {
    padding: "9px 12px",
    border: "1.5px solid #000",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "monospace",
    fontSize: 12,
    background: "#fff",
    color: "#000",
    outline: "none",
    display: "block",
    marginBottom: 0,
  },
  td: {
    padding: "12px 14px",
    fontFamily: "monospace",
    fontSize: 12,
    color: "#000",
    verticalAlign: "middle",
  },
  configLabel: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1.5,
    color: "#666",
  },
  smallInput: {
    border: "1.5px solid #000",
    padding: "7px 10px",
    width: 70,
    fontFamily: "monospace",
    fontWeight: 700,
    fontSize: 13,
    textAlign: "center" as const,
    outline: "none",
    background: "#fff",
    color: "#000",
    boxSizing: "border-box" as const,
  },
};
