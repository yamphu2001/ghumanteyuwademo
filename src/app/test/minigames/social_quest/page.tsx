'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import MascotImage from './mascot.png';

const SOCIAL_TASKS = [
  { id: 1, task: "Say 'Namaste' to a local shopkeeper you don't know.", icon: "🙏" },
  { id: 2, task: "High-five or shake hands with a fellow explorer (not a teammate!).", icon: "🤝" },
  { id: 3, task: "Ask someone for a 'hidden' fact about this specific landmark.", icon: "🗣️" },
  { id: 4, task: "Offer to take a photo for a group of tourists.", icon: "📸" }
];

export default function SocialQuest() {
  const [activeTask, setActiveTask] = useState<typeof SOCIAL_TASKS[0] | null>(null);
  const [step, setStep] = useState<'selection' | 'action' | 'proof' | 'success'>('selection');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startQuest = (task: typeof SOCIAL_TASKS[0]) => {
    setActiveTask(task);
    setStep('action');
  };

  const startCamera = async () => {
    setStep('proof');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (err) { console.error(err); }
  };

  const takeProof = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    setCapturedPhoto(canvas.toDataURL('image/png'));
    setStep('success');
    // Stop camera
    const stream = videoRef.current.srcObject as MediaStream;
    stream?.getTracks().forEach(t => t.stop());
  };

  return (
    <div className="max-w-md mx-auto p-6 font-sans text-center min-h-[500px] flex flex-col justify-center">
      
      {step === 'selection' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="mb-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">SAMAJIK QUEST</h2>
            <p className="text-xs font-bold text-red-600 uppercase tracking-widest mt-1">Break the Ice</p>
          </div>
          <div className="grid gap-3">
            {SOCIAL_TASKS.map((t) => (
              <button 
                key={t.id} 
                onClick={() => startQuest(t)}
                className="p-5 bg-white border-2 border-slate-100 rounded-3xl text-left hover:border-red-500 hover:bg-red-50 transition-all flex items-center gap-4 group"
              >
                <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">{t.icon}</span>
                <span className="font-bold text-slate-700 text-sm leading-tight">{t.task}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'action' && activeTask && (
        <div className="space-y-8 animate-in zoom-in">
          <div className="w-32 mx-auto">
            <Image src={MascotImage} alt="Yuwa" className="w-full h-auto" />
          </div>
          <div className="p-8 bg-slate-900 text-white rounded-[3rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">{activeTask.icon}</div>
            <p className="text-xs font-black text-red-400 uppercase tracking-widest mb-4">Ongoing Task</p>
            <p className="text-xl font-medium leading-relaxed italic">"{activeTask.task}"</p>
          </div>
          <button 
            onClick={startCamera}
            className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-red-700 active:scale-95 transition-all"
          >
            I DID IT! (TAKE PROOF)
          </button>
        </div>
      )}

      {step === 'proof' && (
        <div className="space-y-6">
          <p className="font-bold text-slate-500 uppercase text-xs tracking-widest">Capture the Moment</p>
          <div className="relative aspect-square rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl bg-black">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 border-[16px] border-white/20 pointer-events-none"></div>
          </div>
          <button 
            onClick={takeProof}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg"
          >
            CONFIRM EVIDENCE 📸
          </button>
        </div>
      )}

      {step === 'success' && (
        <div className="space-y-8 animate-in bounce-in">
          <div className="relative inline-block">
             <img src={capturedPhoto!} className="w-64 h-64 object-cover rounded-[3rem] border-8 border-white shadow-2xl mx-auto" alt="Proof" />
             <div className="absolute -bottom-4 -right-4 w-20 bg-white p-2 rounded-full shadow-lg">
                <Image src={MascotImage} alt="Yuwa" className="w-full h-auto" />
             </div>
          </div>
          <h3 className="text-3xl font-black text-slate-900">QUEST COMPLETE!</h3>
          <p className="text-slate-500 font-medium">You just helped bridge the gap in our community. Yuwa is proud of you.</p>
          <button 
            onClick={() => setStep('selection')}
            className="px-10 py-4 bg-red-600 text-white rounded-full font-bold shadow-lg"
          >
            NEXT SOCIAL TASK
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}