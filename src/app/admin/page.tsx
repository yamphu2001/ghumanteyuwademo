"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './admin.module.css';

export default function AdminPage() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <button 
        className={styles.adminBtn} 
        onClick={() => router.push('/admin/tracker')}
      >
        Player Tracker
      </button>
      
      <button 
        className={styles.adminBtn} 
        onClick={() => router.push('/admin/edit')}
      >
        Event Editor
      </button>
      
      <button 
        className={styles.adminBtn} 
        onClick={() => router.push('/admin/verify')}
      >
        Prize Distribution
      </button>
    </div>
  );
}