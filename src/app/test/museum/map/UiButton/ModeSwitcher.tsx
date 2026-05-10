/* ModeSwitcher.tsx */
"use client";
import styles from "./ModeSwitcher.module.css";

export type ViewMode = "360" | "Play" | "artifacts";

interface ModeSwitcherProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export default function ModeSwitcher({ currentMode, onModeChange }: ModeSwitcherProps) {
  const modes: { id: ViewMode; label: string }[] = [
    { id: "360", label: "360°" },
    { id: "Play", label: "Play" },
    { id: "artifacts", label: "Artifacts" },
  ];

  return (
    <div className={styles.container}>
      {modes.map((mode) => (
        <button
          key={mode.id}
          className={`${styles.modeButton} ${currentMode === mode.id ? styles.active : ""}`}
          onClick={() => onModeChange(mode.id)}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}