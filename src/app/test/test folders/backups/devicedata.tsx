"use client";

import React, { useState } from "react";
import { getUltraDeviceProfile } from "@/features/backend/User_Device_Data/userDeviceData";

export default function DeepScanPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDeepScan = async () => {
    setLoading(true);
    const data = await getUltraDeviceProfile();
    setReport(data);
    setLoading(false);
  };

  const Section = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div
      style={{
        marginBottom: "24px",
        border: "1px solid #1f1f1f",
        padding: "16px",
        borderRadius: "6px",
        background: "#0d0d0d",
      }}
    >
      <h3
        style={{
          color: "#00ff88",
          borderBottom: "1px solid #222",
          paddingBottom: "6px",
          marginBottom: "10px",
        }}
      >
        {title}
      </h3>
      <div style={{ color: "#bbb", fontSize: "13px", lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );

  const Row = ({ label, value }: { label: string; value: any }) => (
    <p>
      <strong style={{ color: "#888" }}>{label}:</strong>{" "}
      <span>{value ?? "N/A"}</span>
    </p>
  );

  return (
    <div
      style={{
        backgroundColor: "#070707",
        color: "#eee",
        minHeight: "100vh",
        padding: "40px",
        fontFamily: "monospace",
      }}
    >
      <h1 style={{ color: "#00ff88", marginBottom: "20px" }}>
        $ SYSTEM_DIAGNOSTICS::DEVICE_PROFILE
      </h1>

      <button
        onClick={runDeepScan}
        disabled={loading}
        style={{
          padding: "14px 28px",
          background: "#00ff88",
          border: "none",
          fontWeight: "bold",
          cursor: "pointer",
          marginBottom: "30px",
        }}
      >
        {loading ? "SCANNING HARDWARE…" : "INITIALIZE SCAN"}
      </button>

      {report && (
        <>
          {/* ENVIRONMENT */}
          <Section title="01. ENVIRONMENT">
            <Row label="User Agent" value={report.environment.userAgent} />
            <Row label="Platform" value={report.environment.platform} />
            <Row label="Language" value={report.environment.language} />
            <Row label="Timezone" value={report.environment.timezone} />
            <Row label="Pixel Ratio" value={report.environment.devicePixelRatio} />
          </Section>

          {/* DISPLAY */}
          <Section title="02. DISPLAY">
            <Row
              label="Resolution"
              value={`${report.screen.width} × ${report.screen.height}`}
            />
            <Row label="Color Depth" value={report.screen.colorDepth} />
            <Row label="Orientation" value={report.screen.orientation} />
            <Row label="Multi-Monitor Hint" value={String(report.screen.multiMonitorHint)} />
          </Section>

          {/* HARDWARE */}
          <Section title="03. HARDWARE">
            <Row label="CPU Cores" value={report.hardware.cores} />
            <Row label="Memory (GB)" value={report.hardware.memoryGB} />
            <Row label="Touch Points" value={report.hardware.maxTouchPoints} />
            <Row label="Pointer Type" value={report.hardware.pointer} />
          </Section>

          {/* GRAPHICS */}
          <Section title="04. GRAPHICS PIPELINE">
            <Row label="GPU Vendor" value={report.webgl.vendor} />
            <Row label="GPU Renderer" value={report.webgl.renderer} />
            <Row label="Max Texture Size" value={report.webgl.maxTextureSize} />
            <Row label="Antialias" value={String(report.webgl.antialias)} />
          </Section>

          {/* PERFORMANCE */}
          <Section title="05. PERFORMANCE & STORAGE">
            <Row label="Storage Quota (MB)" value={report.storage.quotaMB} />
            <Row label="Storage Used (MB)" value={report.storage.usageMB} />
            <Row label="Persistent Storage" value={String(report.storage.persistence)} />
            <Row
              label="JS Heap Used"
              value={
                report.performance.memoryJS
                  ? Math.round(
                      report.performance.memoryJS.usedJSHeapSize / 1024 / 1024
                    ) + " MB"
                  : "Unavailable"
              }
            />
          </Section>

          {/* NETWORK */}
          <Section title="06. NETWORK">
            <Row label="Downlink" value={`${report.network.downlink} Mbps`} />
            <Row label="RTT" value={`${report.network.rtt} ms`} />
            <Row label="Effective Type" value={report.network.effectiveType} />
            <Row label="Save Data" value={String(report.network.saveData)} />
          </Section>

          {/* UI & ACCESSIBILITY */}
          <Section title="07. UI & ACCESSIBILITY">
            <Row label="Dark Mode" value={String(report.uiPrefs.darkMode)} />
            <Row label="Reduced Motion" value={String(report.uiPrefs.reducedMotion)} />
            <Row label="High Contrast" value={String(report.uiPrefs.contrast)} />
            <Row label="HDR Display" value={String(report.uiPrefs.hdr)} />
            <Row label="Display Mode" value={report.uiPrefs.displayMode} />
          </Section>

          {/* PERMISSIONS */}
          <Section title="08. PERMISSIONS STATE">
            {Object.entries(report.permissions || {}).map(([key, val]) => (
              <Row key={key} label={key} value={val} />
            ))}
          </Section>

          {/* META */}
          <Section title="09. SESSION META">
            <Row label="Device ID" value={report.deviceId} />
            <Row label="Collected At" value={report.collectedAt} />
            <Row label="Tab Visibility" value={report.behaviorHints.tabVisible} />
            <Row label="History Length" value={report.behaviorHints.historyLength} />
          </Section>
        </>
      )}
    </div>
  );
}
