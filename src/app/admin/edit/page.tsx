"use client";

import React, { useState } from 'react';
import styles from './edit.module.css';

// 1. IMPORT YOUR COMPONENTS
import EventManager from './eventmanager';
import BoundaryManager from './boundary';
import EventMarkerManager from './qrmarker'; // or correct path

type AdminModule = 'EVENT' | 'BOUNDARY' | 'QR' | 'OVERVIEW';

export default function AdminPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<AdminModule>('OVERVIEW');

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const renderContent = () => {
    switch (activeModule) {
      case 'EVENT': return <EventManager />;
      case 'BOUNDARY': return <BoundaryManager />;
      case 'QR': return <EventMarkerManager />;
      default:
        return (
          <div className="border-4 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-black uppercase italic">System Overview</h3>
            <p className="text-gray-500 mt-2 font-bold uppercase text-[10px] tracking-widest">
              Select a control module from the sidebar to begin.
            </p>
          </div>
        );
    }
  };

  return (
    <div className={styles.layout}>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className={styles.overlay} onClick={toggleSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarActive : ''}`}>
        <div className={styles.sidebarHeader}>GHUMANTE ADMIN</div>
        <nav className={styles.nav}>
          <button 
            onClick={() => { setActiveModule('EVENT'); toggleSidebar(); }} 
            className={`${styles.navItem} ${activeModule === 'EVENT' ? styles.active : ''}`}
          >
            Event Manager
          </button>
          <button 
            onClick={() => { setActiveModule('BOUNDARY'); toggleSidebar(); }} 
            className={`${styles.navItem} ${activeModule === 'BOUNDARY' ? styles.active : ''}`}
          >
            Boundary Config
          </button>
          <button 
            onClick={() => { setActiveModule('QR'); toggleSidebar(); }} 
            className={`${styles.navItem} ${activeModule === 'QR' ? styles.active : ''}`}
          >
            QR Markers
          </button>
          <button 
            onClick={() => { setActiveModule('OVERVIEW'); toggleSidebar(); }} 
            className={styles.navItem}
          >
            Settings
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <header className={styles.topBar}>
          <button className={styles.mobileMenuBtn} onClick={toggleSidebar}>
            ☰
          </button>
          <div style={{ marginLeft: 'auto', fontWeight: 900, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.1em' }}>
            {activeModule} // LIVE PORTAL
          </div>
        </header>

        <section className={styles.content}>
          <div className="max-w-2xl mx-auto">
            {renderContent()}
          </div>
        </section>
      </main>
    </div>
  );
}