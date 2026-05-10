"use client";
import React, { useState } from 'react';
import { Bug, X, Send, AlertCircle, Loader2 } from 'lucide-react';
import { submitBugReport } from "./bugReportService";
import { getBugReportLayout, getModalAlignment } from "./logic";
import { useUIPreference } from "@/store/User_Ui_Preference";

const BugReportModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    topic: 'Map/GPS Logic',
    issue: '',
    recommendation: ''
  });

  const { handPreference } = useUIPreference();
  const layout = getBugReportLayout(handPreference ?? "right");
  const modalAlignment = getModalAlignment(layout.modalOrigin);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitBugReport(formData);
      setIsOpen(false);
      setFormData({ topic: 'Map/GPS Logic', issue: '', recommendation: '' });
    } catch (err) {
      alert("Failed to sync report with command center.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return (
    <button
      onClick={() => setIsOpen(true)}
      // layout.position drives left/right/center from hand preference
      className={`${layout.position} flex items-center gap-2 bg-black text-white px-4 py-3 border-2 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all z-50`}
      style={layout.style}
    >
      <Bug size={20} />
      {!layout.iconOnly && (
        <span className="font-bold uppercase tracking-tighter">Report Bug</span>
      )}
    </button>
  );

  return (
    <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex ${modalAlignment} z-[60] p-4`}>
      <div className="bg-white border-4 border-black w-full max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="bg-black text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} />
            <h2 className="font-black uppercase tracking-widest text-sm">Report Bug</h2>
          </div>
          <button onClick={() => setIsOpen(false)}><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase mb-1">Category</label>
            <select
              className="w-full border-2 border-black p-2 font-mono text-sm outline-none focus:bg-yellow-50"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            >
              <option>Map/GPS Logic</option>
              <option>UI/UX Layout</option>
              <option>User Auth/Profile</option>
              <option>Heritage Data Accuracy</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase mb-1">The Issue</label>
            <textarea
              required
              rows={3}
              className="w-full border-2 border-black p-2 font-mono text-sm outline-none focus:bg-yellow-50"
              value={formData.issue}
              onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase mb-1">Recommendations / Solutions</label>
            <textarea
              rows={2}
              className="w-full border-2 border-black p-2 font-mono text-sm outline-none focus:bg-yellow-50"
              value={formData.recommendation}
              onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
            />
          </div>
          <button
            disabled={isSubmitting}
            type="submit"
            className="w-full bg-black text-white font-black py-4 flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:bg-zinc-500 uppercase tracking-widest text-xs"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={16} />}
            {isSubmitting ? "Syncing..." : "Let the Ghumante Yuwa Team Know!"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BugReportModal;