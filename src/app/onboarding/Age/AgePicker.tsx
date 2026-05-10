'use client';

import React, { useState } from 'react';
import styles from './AgePicker.module.css';

interface AgePickerProps {
  onConfirm?: (date: Date) => void;
}

export default function AgePicker({ onConfirm }: AgePickerProps) {
  const [view, setView] = useState<'year' | 'month' | 'day'>('year');
  const [date, setDate] = useState({ year: 2003, month: 7, day: 25 });
  const [error, setError] = useState<string | null>(null);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const today = new Date();
  const minAge = 13;
  const maxSelectableYear = today.getFullYear() - minAge;

  // Precise age calculation for the "Live Age" display
  const calculateAge = () => {
    let years = today.getFullYear() - date.year;
    let m = today.getMonth() - date.month;
    let d = today.getDate() - date.day;

    if (d < 0) {
      m--;
      const prevMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
      d += prevMonthLastDay;
    }
    if (m < 0) {
      years--;
      m += 12;
    }
    return { 
      totalYears: years, 
      y: `${years}y`, 
      rest: `${m}m • ${d}d` 
    };
  };

  const age = calculateAge();

  const handleConfirm = () => {
    const selectedDate = new Date(date.year, date.month, date.day);
    
    // Strict 13+ check
    const thirteenYearsAgo = new Date();
    thirteenYearsAgo.setFullYear(today.getFullYear() - 13);

    if (selectedDate > thirteenYearsAgo) {
      setError("UNDERAGE ACCESS DENIED");
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Return the full Date object to onboarding/page.tsx
    onConfirm?.(selectedDate);
  };

  return (
    <div className={styles.container}>
      <div className={styles.outerBox}>
        {/* Header Section */}
        <div className={styles.headerSection}>
          <div className="flex justify-between items-center mb-2">
            <div className={styles.modeBadge}>{view}_mode</div>
            {error && (
              <div className="text-[9px] font-black text-red-500 animate-pulse tracking-tighter">
                {error}
              </div>
            )}
            <div className="flex gap-1">
              {['year', 'month', 'day'].map((v) => (
                <div key={v} className={`${styles.dot} ${view === v ? styles.dotActive : ''}`} />
              ))}
            </div>
          </div>

          <div className="flex justify-between items-end">
            <div className="flex-1">
              <p className={styles.label}>Birth Index</p>
              <div className={styles.dateDisplay}>
                {date.year}<span className={styles.dim}>.</span>
                {String(date.month + 1).padStart(2, '0')}<span className={styles.dim}>.</span>
                {String(date.day).padStart(2, '0')}
              </div>
            </div>
            <div className={styles.ageDisplay}>
              <p className={styles.label}>Live Age</p>
              <div className={`text-xl sm:text-2xl font-black italic leading-none ${age.totalYears < 13 ? 'text-red-500' : 'text-white'}`}>
                {age.y}
              </div>
              <div className="text-[8px] font-mono text-zinc-500 uppercase mt-1">{age.rest}</div>
            </div>
          </div>
        </div>

        {/* Selection Area */}
        <div className={styles.selectionArea}>
          <div className="flex items-center justify-between mb-3">
            <button 
              onClick={() => setView(view === 'day' ? 'month' : 'year')}
              disabled={view === 'year'}
              className={`${styles.backButton} ${view === 'year' ? 'opacity-0' : 'opacity-100'}`}
            >
              ← Back
            </button>
            <span className="text-[9px] font-bold text-zinc-400 italic uppercase tracking-widest">
              Index_{view}
            </span>
          </div>

          <div className={styles.scrollContainer}>
            {view === 'year' && (
              <div className={styles.grid3}>
                {Array.from({ length: 60 }, (_, i) => maxSelectableYear - i).map(y => (
                  <button key={y} onClick={() => { setDate({...date, year: y}); setView('month'); }}
                    className={`${styles.optionBtn} ${date.year === y ? styles.selected : ''}`}>
                    {y}
                  </button>
                ))}
              </div>
            )}

            {view === 'month' && (
              <div className={styles.grid2}>
                {months.map((m, idx) => (
                  <button key={m} onClick={() => { setDate({...date, month: idx}); setView('day'); }}
                    className={`${styles.optionBtn} ${date.month === idx ? styles.selected : ''}`}>
                    {m}
                  </button>
                ))}
              </div>
            )}

            {view === 'day' && (
              <div className={styles.grid7}>
                {['S','M','T','W','T','F','S'].map((dayHeader, i) => (
                  <div key={`${dayHeader}-${i}`} className={styles.dayHeader}>{dayHeader}</div>
                ))}
                {Array.from({ length: new Date(date.year, date.month + 1, 0).getDate() }).map((_, i) => (
                  <button key={i} onClick={() => setDate({...date, day: i + 1})}
                    className={`${styles.dayBtn} ${date.day === i + 1 ? styles.selected : ''}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {view === 'day' && (
        <button 
          onClick={handleConfirm} 
          className={`${styles.confirmBtn} ${age.totalYears < 13 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
        >
          {age.totalYears < 13 ? 'Underage Limit' : 'Confirm Sync →'}
        </button>
      )}
    </div>
  );
}