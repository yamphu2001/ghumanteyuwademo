"use client";
import { useRef, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import maplibregl from "maplibre-gl";
import MapCanvas, { MapCanvasHandle } from "@/features/frontend/play/mapcanvas";
import GridPlot from "@/features/frontend/play/GridPlot/GridPlot";
import Compass from "@/features/frontend/play/Compass/Compass";
import PlayerMarker from "@/features/frontend/play/PlayerMarker/PlayerMarker";
import QRMarkers from "@/features/frontend/play/Markers/QRcodeMarkers/QRcodeMarkers";
import Speedometer from "@/features/frontend/play/Speedometer/Speedometer";
import ScannerButton from "@/features/frontend/play/qrscanner/ScannerButton";
import QRScanner from "@/features/frontend/play/qrscanner/qrscanner";
import { usePlayerCoords } from "@/app/en/play/coord";

function PlayContent() {
  const mapCanvasRef = useRef<MapCanvasHandle | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isScannerOpen, setScannerOpen] = useState(false);

  const searchParams = useSearchParams();
  const eventIdFromUrl = searchParams.get("event") || undefined;
  
  usePlayerCoords();

  useEffect(() => {
    const interval = setInterval(() => {
      const instance = mapCanvasRef.current?.getMap();
      if (instance) {
        mapRef.current = instance;
        setMapLoaded(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#000",
        touchAction: "none",
      }}
    >
      <MapCanvas ref={mapCanvasRef} />

      {mapLoaded && mapRef.current && (
        <>
          <GridPlot map={mapRef as React.MutableRefObject<any>} />
          <PlayerMarker map={{ current: mapRef.current }} imagePath="/Mascot.png" />
          <QRMarkers map={mapRef.current} eventId={eventIdFromUrl} />
        </>
      )}

      <div style={{ position: "absolute", bottom: 32, left: 16, zIndex: 9999 }}>
        <ScannerButton onClick={() => setScannerOpen(true)} />
      </div>

      <div style={{
        position: "absolute",
        bottom: 32,
        right: 16,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        alignItems: "center",
      }}>
        <Speedometer />
        {mapLoaded && <Compass map={mapRef.current} />}
      </div>

      {isScannerOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "#000" }}>
          <QRScanner eventId={eventIdFromUrl} onClose={() => setScannerOpen(false)} />
        </div>
      )}
    </main>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={
      <div style={{
        background: "#000",
        color: "#facd05",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 900,
      }}>
        LOADING...
      </div>
    }>
      <PlayContent />
    </Suspense>
  );
}
