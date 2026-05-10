

"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Gift, Home, Scan, Plus, X, Trophy, User, Star } from 'lucide-react';
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import { useUIPreference } from "@/store/User_Ui_Preference";
import styles from './OneHandedMenu.module.css';
import { getLayout } from './logic';

const QRScannerOverlay = dynamic(
  () => import('@/features/forevent/frontend/play/qrscanner/qrscanner'),
  { ssr: false }
);

const ICON_MAP = {
  Settings: <Settings size={28} />,
  Gift:     <Gift size={28} />,
  Home:     <Home size={28} />,
  Trophy:   <Trophy size={28} />,
  User:     <User size={28} />,
  Star:     <Star size={28} />,
};

// ← Add eventId prop
interface OneHandedMenuProps {
  eventId: string;
}

export default function RedesignedOneHandedMenu({ eventId }: OneHandedMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeScanner, setActiveScanner] = useState(false);
  const router = useRouter();
  const { handPreference } = useUIPreference();

  const layout = getLayout(handPreference || "center", eventId);

  useEffect(() => {
    const handler = () => setActiveScanner(false);
    window.addEventListener('close-scanner', handler);
    return () => window.removeEventListener('close-scanner', handler);
  }, []);

  return (
    <>
      <AnimatePresence>
        {activeScanner && (
          <motion.div
            key="scanner-overlay"
            className="fixed inset-0 z-[9999] bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* ← Pass eventId here */}
            <QRScannerOverlay eventId={eventId} />

            <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 z-[10000]">
              <button
                onClick={() => setActiveScanner(false)}
                className="w-[72px] h-[72px] bg-[#ef4444] rounded-full border-4 border-white/20 flex items-center justify-center text-white shadow-xl active:scale-95 transition-transform"
              >
                <X size={32} strokeWidth={3} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.dimmer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className={styles.menuContainer} style={layout.anchor}>
        <div className={styles.relativeWrapper}>
          <AnimatePresence mode="wait">
            {!isOpen ? (
              <motion.button
                key="trigger"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className={`${styles.smallButton} ${styles[layout.alignment]}`}
                onClick={() => setIsOpen(true)}
              >
                <Plus size={35} />
              </motion.button>
            ) : (
              <motion.div key="menu-content">
                {layout.items.map((item, index) => (
                  <motion.button
                    key={index}
                    className={`${styles.smallButton} ${styles[layout.alignment]}`}
                    onClick={() => { setIsOpen(false); router.push(item.path); }}
                    initial={{ x: 0, y: 0, scale: 0 }}
                    animate={{ x: item.x, y: item.y, scale: 1 }}
                    exit={{ x: 0, y: 0, scale: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25, delay: index * 0.05 }}
                  >
                    {ICON_MAP[item.iconName as keyof typeof ICON_MAP]}
                  </motion.button>
                ))}

                <motion.button
                  className={`${styles.scanButton} ${styles[layout.alignment]}`}
                  onClick={() => { setIsOpen(false); setActiveScanner(true); }}
                  initial={{ x: 0, y: 0, scale: 0 }}
                  animate={{ x: layout.qr.x, y: layout.qr.y, scale: 1 }}
                  exit={{ x: 0, y: 0, scale: 0 }}
                  transition={{ type: "spring", stiffness: 250, damping: 20 }}
                >
                  <Scan size={48} strokeWidth={2.5} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}