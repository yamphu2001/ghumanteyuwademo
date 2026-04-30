"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, query, orderBy } from 'firebase/firestore';

export default function EventManager() {
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: '', // Used for the Firestore Doc ID
    name: '',
    date: '',
    startTime: '',
    endTime: '',
    duration: ''
  });

  // 1. READ: Real-time sync with Firestore
  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(eventList);
    });
    return () => unsubscribe();
  }, []);

  const createEventID = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  };

  // 2. CREATE / UPDATE Logic
  const handleSave = async () => {
    const { name, date, startTime, endTime, duration, id } = formData;
    if (!name || !date || !startTime || !endTime) return alert("MISSING DATA");

    setLoading(true);
    // If we're editing, use existing ID. If new, generate from name.
    const eventId = isEditing ? id : createEventID(name);

    try {
      await setDoc(doc(db, "events", eventId), {
        eventId,
        name,
        date,
        startTime,
        endTime,
        duration: parseInt(duration) || 0,
        status: isEditing ? (events.find(e => e.id === id)?.status || 'UPCOMING') : 'UPCOMING',
        updatedAt: new Date().toISOString(),
        // Only add joinCode and createdAt if it's a brand new event
        ...(!isEditing && { 
          joinCode: `GY-${Math.floor(1000 + Math.random() * 9000)}`,
          createdAt: new Date().toISOString() 
        })
      }, { merge: true });

      alert(isEditing ? "EVENT UPDATED" : "EVENT CREATED");
      resetForm();
    } catch (e) {
      console.error(e);
      alert("FIRESTORE ERROR");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ id: '', name: '', date: '', startTime: '', endTime: '', duration: '' });
    setIsEditing(false);
  };

  const loadEvent = (event: any) => {
    setFormData({
      id: event.id,
      name: event.name,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      duration: event.duration.toString()
    });
    setIsEditing(true);
  };

  return (
    <div className="space-y-10 pb-20">
      {/* LIST SECTION: READ */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Live Registry</h3>
        <div className="grid gap-2">
          {events.map(event => (
            <button 
              key={event.id}
              onClick={() => loadEvent(event)}
              className="w-full text-left border-2 border-black p-4 bg-white hover:bg-yellow-50 transition-colors flex justify-between items-center group"
            >
              <div>
                <p className="font-black uppercase text-xs">{event.name}</p>
                <p className="text-[9px] font-mono text-gray-500">{event.date} // {event.startTime} - {event.endTime}</p>
              </div>
              <span className="text-[10px] font-black opacity-0 group-hover:opacity-100 uppercase">Edit →</span>
            </button>
          ))}
        </div>
      </section>

      <hr className="border-2 border-black" />

      {/* FORM SECTION: CREATE / UPDATE */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-3xl font-black uppercase italic leading-none">
            {isEditing ? "Update Session" : "New Session"}
          </h2>
          {isEditing && (
            <button onClick={resetForm} className="text-[10px] font-bold underline uppercase">Cancel</button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400">Event Name</label>
            <input 
              disabled={isEditing} // Prevent ID mismatch after creation
              className={`w-full p-4 border-4 border-black font-bold uppercase outline-none ${isEditing ? 'bg-gray-100 opacity-50' : 'focus:bg-yellow-50'}`}
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400">Date</label>
              <input 
                type="date"
                className="w-full p-4 border-4 border-black font-bold outline-none"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400">Duration (Mins)</label>
              <input 
                type="number"
                className="w-full p-4 border-4 border-black font-bold outline-none"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input 
              type="time"
              className="w-full p-4 border-4 border-black font-bold outline-none"
              value={formData.startTime}
              onChange={(e) => setFormData({...formData, startTime: e.target.value})}
            />
            <input 
              type="time"
              className="w-full p-4 border-4 border-black font-bold outline-none"
              value={formData.endTime}
              onChange={(e) => setFormData({...formData, endTime: e.target.value})}
            />
          </div>

          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full py-6 mt-6 bg-red-600 text-white font-black uppercase tracking-widest border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
          >
            {loading ? "SAVING..." : isEditing ? "UPDATE FIRESTORE" : "PUSH TO FIRESTORE"}
          </button>
        </div>
      </section>
    </div>
  );
}