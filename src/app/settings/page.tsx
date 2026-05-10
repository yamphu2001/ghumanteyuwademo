"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, Map, Fingerprint, User, ShieldCheck, MapPin, 
  Camera, Eye, Users, Calendar, ChevronRight, Bell, 
  HelpCircle, FileText, Info, LogOut, CheckCircle2,
  Box, Sun, Moon, Map as MapIcon, Globe, Tent, Scale
} from "lucide-react";

// --- AUTH IMPORTS ---
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

import styles from "./settings.module.css";
import { useSettingsLogic } from "./logic";
import { HandPreference } from "@/store/User_Ui_Preference";
import { MapTheme } from "@/store/Map_preference";
import { PermissionPrompt } from "./Permissionprompt";

const THEME = {
  text: "#000000",
  muted: "#757575",
  accent: "#E63946", 
  surface: "#F8F8F8", 
  border: "#EAEAEA",
};

export default function SettingsPage() {
  const router = useRouter();
  const { 
    hand, 
    mapView, 
    mapTheme, 
    is3D, 
    showSaved, 
    setMapView, 
    handleHandChange, 
    handleThemeChange, 
    handleToggle3D 
  } = useSettingsLogic();

  const [activePermission, setActivePermission] = useState<"location" | "camera" | null>(null);

  // --- LOGOUT HANDLER ---
  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out of your session?")) {
      try {
        await signOut(auth);
        // Clear local storage to prevent session leakage
        localStorage.clear(); 
        // Force redirect to landing page and prevent going back
        router.replace("/");
      } catch (error) {
        console.error("Logout failed:", error);
      }
    }
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <h3 className={styles.sectionHeader}>{title}</h3>
  );

  const SettingRow = ({ 
    icon: Icon, title, subtitle, value, onClick, isDanger = false 
  }: any) => (
    <div 
      onClick={onClick}
      className={`${styles.settingRow} ${isDanger ? styles.settingRowDanger : ''}`}
    >
      <div className={styles.settingContent}>
        <div className={`${styles.settingIconWrapper} ${isDanger ? styles.settingIconWrapperDanger : ''}`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <div>
          <div className={`${styles.settingTitle} ${isDanger ? styles.settingTitleDanger : ''}`}>{title}</div>
          {subtitle && <div className={styles.settingSubtitle}>{subtitle}</div>}
        </div>
      </div>
      <div className={styles.settingRight}>
        {value && <span className={styles.settingBadge}>{value}</span>}
        {!isDanger && <ChevronRight size={18} color="#D1D1D1" />}
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <PermissionPrompt
        type={activePermission ?? "location"}
        isOpen={!!activePermission}
        onClose={() => setActivePermission(null)}
      />
      
      {showSaved && (
        <div className={styles.toast}>
          <CheckCircle2 size={16} color={THEME.accent} />
          <span>Preference Updated</span>
        </div>
      )}

      <nav className={styles.nav}>
        <button onClick={() => router.push("/play")} className={styles.backButton}>
          <ChevronLeft size={20} color={THEME.text} strokeWidth={3} />
        </button>
        <span className={styles.navTitle}>Settings</span>
        <div className={styles.navSpacer} />
      </nav>

      <main className={styles.main}>
        
        <SectionHeader title="View Mode" />
        <div className={styles.tabContainer}>
          {[
            { id: "community", label: "Global", icon: Users },
            { id: "personal", label: "History", icon: Eye },
            { id: "today", label: "Today", icon: Calendar }
          ].map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => setMapView(tab.id as any)}
              className={`${styles.tabButton} ${mapView === tab.id ? styles.tabButtonActive : ""}`}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <tab.icon size={14} />
                {tab.label}
              </div>
            </button>
          ))}
        </div>

        <SectionHeader title="Map Rendering" />
        <div 
          onClick={handleToggle3D}
          className={`${styles.toggleContainer} ${is3D ? styles.toggleContainerActive : ''}`}
        >
          <div className={styles.toggleContent}>
            <Box size={20} color={is3D ? THEME.accent : THEME.text} />
            <span className={styles.toggleTitle}>3D Buildings & Terrain</span>
          </div>
          <div className={`${styles.toggleSwitch} ${is3D ? styles.toggleSwitchActive : ''}`}>
            <div className={`${styles.toggleKnob} ${is3D ? styles.toggleKnobActive : ''}`} />
          </div>
        </div>

        <div className={styles.themeGrid}>
          {[
            { id: "liberty",           label: "Liberty",     icon: MapIcon },
            { id: "dark",              label: "Dark",        icon: Moon },
            { id: "bright",            label: "Bright",      icon: Sun },
            { id: "positron",          label: "Positron",    icon: Sun },
            { id: "dark-matter",       label: "Dark Matter", icon: Moon },
            { id: "voyager",           label: "Voyager",     icon: Globe },
            { id: "positron-nolabels", label: "No Labels",   icon: MapIcon },
            { id: "dark-matter-nolabels", label: "Dark Clean",  icon: Moon },
            { id: "voyager-nolabels",  label: "Voyager Clean", icon: Tent },
          ].map((t) => (
            <button 
              key={t.id} 
              onClick={() => handleThemeChange(t.id as MapTheme)}
              className={`${styles.themeButton} ${mapTheme === t.id ? styles.themeButtonActive : ''}`}
            >
              <t.icon size={18} color={mapTheme === t.id ? THEME.accent : THEME.muted} />
              <span className={styles.themeButtonLabel}>{t.label}</span>
            </button>
          ))}
        </div>

        <SectionHeader title="Ergonomics" />
        <div className={styles.ergoCard}>
          <div className={styles.ergoHeader}>
            <Fingerprint size={18} color={THEME.accent} />
            <span className={styles.ergoHeaderTitle}>UI BUTTON POSITION</span>
          </div>
          <div className={styles.ergoGrid}>
            {(['left', 'center', 'right'] as HandPreference[]).map(pos => (
              <button 
                key={pos}
                onClick={() => handleHandChange(pos)}
                className={`${styles.ergoButton} ${hand === pos ? styles.ergoButtonActive : ""}`}
              >
                {pos.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <SectionHeader title="Permissions" />
        <SettingRow
          icon={MapPin}
          title="Location"
          value="ALWAYS"
          onClick={() => setActivePermission("location")}
        />
        <SettingRow
          icon={Camera}
          title="Camera"
          value="ALLOWED"
          onClick={() => setActivePermission("camera")}
        />

        <SectionHeader title="Legal & Credits" />
        <div className={styles.legalCard}>
          <div className={styles.legalHeader}>
            <Scale size={18} color={THEME.text} />
            <span className={styles.legalTitle}>MAP ENGINE</span>
          </div>
          <p className={styles.legalText}>
            This application is powered by <strong>MapLibre GL JS</strong>. We are grateful to the MapLibre community for providing the open-source engine that makes our exploration possible.
          </p>
          <div className={styles.legalFooter}>
            <span className={styles.legalCopyright}>© MapLibre Contributors</span>
            <a href="https://maplibre.org/" target="_blank" className={styles.legalLink}>LEARN MORE</a>
          </div>
        </div>

        <SectionHeader title="General" />
        <SettingRow icon={HelpCircle} title="Privacy Policy" onClick={() => router.push("/privacy")} />
        <SettingRow icon={FileText} title="Terms of Service" onClick={() => router.push("/terms")} />
        <SettingRow icon={Info} title="About App" onClick={() => router.push("/about")} />

        <div className={styles.logoutContainer}>
          <SettingRow 
            icon={LogOut} 
            title="Log Out" 
            isDanger={true} 
            onClick={handleLogout} 
          />
        </div>

        <div className={styles.fabContainer}>
          <button onClick={() => router.push("/play")} className={styles.fab}>
            <Map size={20} color={THEME.accent} strokeWidth={2.5} />
            Continue Exploring
          </button>
        </div>
      </main>
    </div>
  );
}