"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, writeBatch, deleteDoc, updateDoc, addDoc } from "firebase/firestore";

export default function SimpleQuizAdmin() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [jsonInput, setJsonInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newPoints, setNewPoints] = useState(10);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<any>({});

  const colRef = collection(db, "questions");

  const loadQuestions = async () => {
    setLoading(true);
    const snap = await getDocs(colRef);
    setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleBulkUpload = async () => {
    try {
      const data = JSON.parse(jsonInput);
      if (!Array.isArray(data)) throw new Error();

      setLoading(true);
      const batch = writeBatch(db);

      data.forEach((q: any) => {
        const newDoc = doc(colRef);
        batch.set(newDoc, q);
      });

      await batch.commit();
      setJsonInput("");
      await loadQuestions();
    } catch (e) {
      alert("Invalid JSON format");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSingle = async () => {
    if (!newQuestion || !newOptions || !newAnswer) {
      alert("Fill all fields");
      return;
    }

    const optionsArray = newOptions.split(",").map(o => o.trim());

    await addDoc(colRef, {
      question: newQuestion,
      options: optionsArray,
      correctAnswer: newAnswer,
      points: newPoints
    });

    setNewQuestion("");
    setNewOptions("");
    setNewAnswer("");
    setNewPoints(10);

    loadQuestions();
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    await deleteDoc(doc(db, "questions", id));
    loadQuestions();
  };

  const startEdit = (q: any) => {
    setEditingId(q.id);
    setEditingData({
      question: q.question,
      options: (q.options || []).join(", "),
      correctAnswer: q.correctAnswer,
      points: q.points
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;

    await updateDoc(doc(db, "questions", editingId), {
      question: editingData.question,
      options: editingData.options.split(",").map((o: string) => o.trim()),
      correctAnswer: editingData.correctAnswer,
      points: editingData.points
    });

    setEditingId(null);
    setEditingData({});
    loadQuestions();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Quiz Manager</h1>

        {/* Add Single Question */}
        <div className="bg-white rounded-2xl shadow p-5 mb-6">
          <h2 className="text-xl font-semibold mb-3">Add Question</h2>

          <input
            placeholder="Question"
            value={newQuestion}
            onChange={e => setNewQuestion(e.target.value)}
            className="w-full p-2 border rounded mb-2"
          />

          <input
            placeholder="Options (comma separated)"
            value={newOptions}
            onChange={e => setNewOptions(e.target.value)}
            className="w-full p-2 border rounded mb-2"
          />

          <input
            placeholder="Correct Answer"
            value={newAnswer}
            onChange={e => setNewAnswer(e.target.value)}
            className="w-full p-2 border rounded mb-2"
          />

          <input
            type="number"
            placeholder="Points"
            value={newPoints}
            onChange={e => setNewPoints(Number(e.target.value))}
            className="w-full p-2 border rounded mb-3"
          />

          <button onClick={handleAddSingle} className="bg-black text-white px-4 py-2 rounded">
            Add Question
          </button>
        </div>

        {/* Bulk Upload */}
        <div className="bg-white rounded-2xl shadow p-5 mb-6">
          <h2 className="text-xl font-semibold mb-3">Bulk Upload</h2>

          <textarea
            placeholder='Paste JSON array here...'
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full h-40 p-3 border rounded-lg font-mono text-sm mb-4"
          />

          <button onClick={handleBulkUpload} className="bg-black text-white px-5 py-2 rounded-lg">
            Upload
          </button>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-2xl shadow p-5">
          <h2 className="text-xl font-semibold mb-4">Questions</h2>

          {questions.map((q) => (
            <div key={q.id} className="border rounded-xl p-4 mb-3">
              {editingId === q.id ? (
                <div className="space-y-2">
                  <input
                    value={editingData.question}
                    onChange={e => setEditingData({ ...editingData, question: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                  <input
                    value={editingData.options}
                    onChange={e => setEditingData({ ...editingData, options: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                  <input
                    value={editingData.correctAnswer}
                    onChange={e => setEditingData({ ...editingData, correctAnswer: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                  <input
                    type="number"
                    value={editingData.points}
                    onChange={e => setEditingData({ ...editingData, points: Number(e.target.value) })}
                    className="w-full p-2 border rounded"
                  />

                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="bg-green-600 text-white px-3 py-1 rounded">Save</button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1 border rounded">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{q.question}</p>
                    <p className="text-sm text-gray-500">
                      {Array.isArray(q.options) ? q.options.join(", ") : q.options}
                    </p>
                    <p className="text-sm text-gray-400">Answer: {q.correctAnswer} | {q.points} pts</p>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => startEdit(q)} className="text-blue-500">Edit</button>
                    <button onClick={() => deleteQuestion(q.id)} className="text-red-500">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
