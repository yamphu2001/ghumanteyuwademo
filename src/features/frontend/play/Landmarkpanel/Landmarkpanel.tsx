"use client";
import React, { useEffect, useState, useRef } from 'react';
import { X, MapPin, Zap, Navigation, Clock, Tag, Lock, ChevronRight, Star } from 'lucide-react';
import styles from './Landmarkpanel.module.css';

// ─── Import your Player Location Store ───────────────────────────────────────
import { usePlayerLocation } from '@/store/Playerlocation'; 

// ─── Types ────────────────────────────────────────────────────────────────────
export interface LandmarkData {
  id: string;
  name: string;
  slug?: string;
  description: string;
  unlocked_description?: string;
  image?: string;         // Matches your data: 'image' instead of 'image_url'
  type: string;
  terrain_type?: string;
  difficulty_level?: number;
  points_base?: number;
  geo_fence_radius?: number;
  hint?: string;
  permanency?: 'permanent' | 'temporary';
  status?: 'active' | 'pending' | 'inactive';
  is_active?: boolean;
  coordinates: [number, number]; // [longitude, latitude] — Matches your data
  verification_method?: string;
}

interface LandmarkPanelProps {
  landmark: LandmarkData | null;
  isOpen: boolean;
  isCaptured: boolean;
  captureProgress: number | null;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DIFFICULTY_LABELS = ['', 'Easy', 'Moderate', 'Challenging', 'Hard', 'Extreme'];
const DIFFICULTY_COLORS = ['', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'];

/**
 * Haversine formula to calculate distance in meters
 */
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function DifficultyBar({ level }: { level: number }) {
  const clamped = Math.max(1, Math.min(5, level || 1));
  const pct = (clamped / 5) * 100;
  const color = DIFFICULTY_COLORS[clamped];
  const label = DIFFICULTY_LABELS[clamped];
  return (
    <div className={styles.difficultyWrap}>
      <div className={styles.difficultyMeta}>
        <span className={styles.metaLabel}>Difficulty</span>
        <span className={styles.difficultyLabel} style={{ color }}>{label}</span>
      </div>
      <div className={styles.difficultyTrack}>
        <div className={styles.difficultyFill} style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function CaptureRing({ progress }: { progress: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress);
  return (
    <div className={styles.captureRingWrap}>
      <svg width="72" height="72" className={styles.captureRingSvg}>
        <circle cx="36" cy="36" r={r} className={styles.captureRingTrack} />
        <circle
          cx="36" cy="36" r={r}
          className={styles.captureRingFill}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      <div className={styles.captureRingInner}>
        <Navigation size={20} className={styles.captureRingIcon} />
        <span className={styles.captureRingPct}>{Math.round(progress * 100)}%</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LandmarkPanel({
  landmark,
  isOpen,
  isCaptured,
  captureProgress,
  onClose,
}: LandmarkPanelProps) {
  // 1. Grab player position [lng, lat] directly from your store
  const playerPos = usePlayerLocation((state) => state.position);
  
  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && landmark) {
      setRendered(true);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setRendered(false), 380);
      return () => clearTimeout(t);
    }
  }, [isOpen, landmark]);

  if (!rendered || !landmark) return null;

  // ── 2. LIVE DISTANCE LOGIC ──────────────────────────────────────────────────
  // Check if both player and landmark have [lng, lat]
  const hasPlayerPos = playerPos && playerPos.length === 2;
  const hasLandmarkPos = landmark.coordinates && landmark.coordinates.length === 2;

  const distanceMeters = (hasPlayerPos && hasLandmarkPos) 
    ? getDistance(
        playerPos[1],           // Player Lat
        playerPos[0],           // Player Lng
        landmark.coordinates[1], // Landmark Lat
        landmark.coordinates[0]  // Landmark Lng
      )
    : null;

  // Format the label (Safely avoid NaNm)
  const distanceLabel = (distanceMeters !== null && !isNaN(distanceMeters))
    ? distanceMeters > 1000 
      ? `${(distanceMeters / 1000).toFixed(1)}km` 
      : `${Math.round(distanceMeters)}m`
    : '--';

  const isInZone = captureProgress !== null && captureProgress > 0;
  const hasImage = !!landmark.image;
  const hasHint = !!landmark.hint;

  return (
    <>
      <div className={`${styles.backdrop} ${visible ? styles.backdropVisible : ''}`} onClick={onClose} />
      
      <div className={`${styles.panel} ${visible ? styles.panelVisible : ''}`}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.thumbnail}>
              {hasImage ? (
                <img src={landmark.image} alt={landmark.name} className={styles.thumbnailImg} />
              ) : (
                <div className={styles.thumbnailFallback}><MapPin size={20} /></div>
              )}
              {isCaptured && <div className={styles.thumbnailCapturedBadge} />}
            </div>
            <div className={styles.headerMeta}>
              <div className={styles.typeBadge}>{landmark.type}</div>
              <h2 className={styles.name}>{landmark.name}</h2>
              <div className={styles.subMeta}>
                <span className={styles.terrain}><Tag size={11} /> {landmark.terrain_type || 'Heritage'}</span>
                <span className={styles.permanency}><Clock size={11} /> {landmark.permanency || 'Permanent'}</span>
              </div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <div className={styles.body} ref={scrollRef}>
          <div className={styles.statsRow}>
            {/* ── DISTANCE CARD ── */}
            <div className={styles.statCard}>
              <Navigation size={16} className={styles.statIcon} style={{ transform: 'rotate(45deg)' }} />
              <span className={styles.statValue}>{distanceLabel}</span>
              <span className={styles.statLabel}>Distance</span>
            </div>
            <div className={styles.statCard}>
              <Zap size={16} className={styles.statIcon} />
              <span className={styles.statValue}>{landmark.points_base || 0}</span>
              <span className={styles.statLabel}>Points</span>
            </div>
            <div className={styles.statCard}>
              <Navigation size={16} className={styles.statIcon} />
              <span className={styles.statValue}>{landmark.geo_fence_radius || 50}m</span>
              <span className={styles.statLabel}>Zone</span>
            </div>
          </div>

          <DifficultyBar level={landmark.difficulty_level || 1} />

          {!isCaptured && isInZone && (
            <div className={styles.captureSection}>
              <CaptureRing progress={captureProgress!} />
              <div className={styles.captureText}>
                <p className={styles.captureTitle}>Hold your position</p>
                <p className={styles.captureSub}>Stay within {landmark.geo_fence_radius || 50}m</p>
              </div>
            </div>
          )}

          {isCaptured && <div className={styles.capturedBadge}>✓ Location Captured</div>}

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>About</h3>
            <p className={styles.sectionBody}>
              {isCaptured ? landmark.unlocked_description || landmark.description : landmark.description}
            </p>
          </div>

          {!isCaptured && hasHint && (
            <div className={styles.hintCard}>
              <div className={styles.hintHeader}><Lock size={13} /><span>Hint</span></div>
              <p className={styles.hintBody}>{landmark.hint}</p>
            </div>
          )}

          {!isCaptured && (
            <div className={styles.lockedTeaser}>
              <Lock size={14} /><span>Capture to unlock full story</span><ChevronRight size={14} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}