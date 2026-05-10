"use client";

import React from "react";
import { useRouter } from "next/navigation";
import styles from "../settings/settings.module.css"; // Reuse existing styles
import { usePrizeLogic } from "./logic";

const THEME = {
  text: "#000000",
  muted: "#757575",
  accent: "#E63946", 
  surface: "#F8F8F8", 
  border: "#EAEAEA",
};

export default function StorefrontPage() {
  const router = useRouter();
  const { stats, storeItems, handleAction } = usePrizeLogic();

  // Reusing the SectionHeader logic from Settings
  const SectionHeader = ({ title }: { title: string }) => (
    <h3 style={{ 
      fontSize: "11px", fontWeight: "900", color: THEME.text, 
      textTransform: "uppercase", letterSpacing: "1.5px", 
      margin: "35px 0 12px 15px" 
    }}>{title}</h3>
  );

  // Adapting SettingRow for the Store
  const StoreItemRow = ({ item }: { item: any }) => (
    <div 
      style={{ 
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px", backgroundColor: "#FFF",
        marginBottom: "8px", borderRadius: "24px", border: `1px solid ${THEME.border}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        <div style={{
          backgroundColor: THEME.surface,
          padding: "10px", borderRadius: "14px", fontSize: "20px"
        }}>
          {item.emoji}
        </div>
        <div>
          <div style={{ fontWeight: "700", fontSize: "15px", color: THEME.text }}>{item.name}</div>
          <div style={{ fontSize: "11px", color: THEME.muted }}>{item.description}</div>
        </div>
      </div>

      <button 
        onClick={() => handleAction(item)}
        style={{ 
          backgroundColor: item.unlocked ? (item.equipped ? THEME.text : "white") : THEME.text, 
          color: item.unlocked && !item.equipped ? THEME.text : "white", 
          border: item.unlocked && !item.equipped ? `2px solid ${THEME.text}` : "none",
          padding: "8px 16px", borderRadius: "12px", fontWeight: "900", 
          fontSize: "11px", transition: "0.2s", cursor: "pointer",
          minWidth: "85px"
        }}
      >
        {item.unlocked ? (item.equipped ? "ACTIVE" : "EQUIP") : `■ ${item.cost}`}
      </button>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Centered Nav */}
      <nav className={styles.nav}>
        <button onClick={() => router.back()} className={styles.backButton}>
          <span style={{ fontSize: "20px", fontWeight: "bold" }}>‹</span>
        </button>
        <span style={{ flex: 1, textAlign: "center", fontWeight: "900", fontSize: "15px" }}>Storefront</span>
        <div style={{ width: "36px" }} />
      </nav>

      {/* Reusing centered main column */}
      <main className={styles.main}>
        
        {/* WALLET SECTION */}
        <SectionHeader title="Your Balance" />
        <div style={{ 
          backgroundColor: THEME.text, padding: "24px", borderRadius: "28px", 
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "10px", fontWeight: "900" }}>AVAILABLE BLOCKS</div>
            <div style={{ color: "#fff", fontSize: "28px", fontWeight: "900", marginTop: "4px" }}>
              <span style={{ color: THEME.accent }}>■</span> {stats.blocks}
            </div>
          </div>
          <button style={{ 
            backgroundColor: THEME.accent, color: "#fff", border: "none", 
            padding: "10px 16px", borderRadius: "14px", fontWeight: "900", fontSize: "11px" 
          }}>GET MORE</button>
        </div>

        {/* MASCOTS SECTION */}
        <SectionHeader title="Mascots & Avatars" />
        {storeItems.filter(i => i.category === 'mascot').map(item => (
          <StoreItemRow key={item.id} item={item} />
        ))}

        {/* FEATURES SECTION */}
        <SectionHeader title="App Features" />
        {storeItems.filter(i => i.category === 'feature').map(item => (
          <StoreItemRow key={item.id} item={item} />
        ))}

        {/* MAP SKINS SECTION */}
        <SectionHeader title="Map Rendering Skins" />
        {storeItems.filter(i => i.category === 'skin').map(item => (
          <StoreItemRow key={item.id} item={item} />
        ))}

        {/* INFO FOOTER (Matching Settings styles) */}
        <div style={{ 
          marginTop: "40px", padding: "20px", backgroundColor: THEME.surface, 
          borderRadius: "28px", border: `1px solid ${THEME.border}`, textAlign: "center"
        }}>
          <div style={{ fontSize: "24px", marginBottom: "8px" }}>🗺️</div>
          <div style={{ fontWeight: "900", fontSize: "13px" }}>New items every week</div>
          <p style={{ fontSize: "11px", color: THEME.muted, lineHeight: "1.5", margin: "5px 0" }}>
            Keep exploring and scanning new locations to earn more blocks for your vault.
          </p>
        </div>

      </main>
    </div>
  );
}