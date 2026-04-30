"use client";

import React from 'react';
import styles from './ScannerButton.module.css';

interface ScannerButtonProps {
  onClick: () => void;
}

export default function ScannerButton({ onClick }: ScannerButtonProps) {
  return (
    <button className={styles.btnWrapper} onClick={onClick} aria-label="Open Scanner">
      <svg 
        className={styles.icon}
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="white" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    </button>
  );
}