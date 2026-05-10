"use client";

import { useEffect, useState } from "react";
import { useUIPreference } from "@/store/User_Ui_Preference";
import styles from "./Compass.module.css";

interface CompassProps {
  map: React.MutableRefObject<any>;
  isLoaded: boolean; // pass isLoaded from useMapSetup so we know map is ready
}

export default function Compass({ map, isLoaded }: CompassProps) {
  const { handPreference } = useUIPreference();
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!isLoaded) return; // wait until map is fully loaded
    const mapInstance = map?.current;
    if (!mapInstance) return;

    const handleRotate = () => setRotation(mapInstance.getBearing());
    mapInstance.on("rotate", handleRotate);
    mapInstance.on("move", handleRotate);
    handleRotate(); // set initial value

    return () => {
      mapInstance.off("rotate", handleRotate);
      mapInstance.off("move", handleRotate);
    };
  }, [map, isLoaded]); // re-run when isLoaded becomes true

  const assets = {
    left: "/play/compass/right_compass.png",
    right: "/play/compass/left_compass.png",
    center: "/play/compass/center_compass.png",
  };

  const positions = {
    left: { right: "20px", left: "auto", transform: "none" },
    right: { left: "20px", right: "auto", transform: "none" },
    center: { left: "50%", right: "auto", transform: "translateX(-50%)" },
  };

  return (
    <div
      className={styles.compassWrapper}
      style={{
        position: "fixed",
        top: "20px",
        zIndex: 1000,
        ...positions[handPreference || "center"],
      }}
    >
      <button
        className={styles.compassBtn}
        onClick={() => map?.current?.easeTo({ bearing: 0, duration: 500 })}
      >
        <img
          src={assets[handPreference || "center"]}
          style={{ transform: `rotate(${-rotation}deg)` }}
          alt="Compass"
          className={styles.needle}
        />
      </button>
    </div>
  );
}