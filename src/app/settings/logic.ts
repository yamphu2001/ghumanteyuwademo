
// import { useState, useEffect } from "react";
// import { useUIPreference, HandPreference } from "@/store/User_Ui_Preference";
// import { useMapPreferenceStore, MapTheme } from "@/store/Map_preference";
// import { useGridStore } from "@/features/frontend/play/GridPlot/Today/GridStore";

// import { db, auth } from "@/lib/firebase";
// import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

// export type PermissionStatus = "granted" | "denied" | "prompt" | "unknown";

// export interface PersonalInfo {
//   username: string;
//   mapView: "community" | "personal" | "today";
//   mapTheme: MapTheme;
//   is3D: boolean;
//   handPreference: HandPreference;
//   locationPermission: PermissionStatus;
//   cameraPermission: PermissionStatus;
//   updatedAt?: any;
// }

// const modeMap: Record<PersonalInfo["mapView"], "global" | "history" | "today"> = {
//   community: "global",
//   personal: "history",
//   today: "today",
// };

// async function fetchUsername(uid: string): Promise<string | null> {
//   const userSnap = await getDoc(doc(db, "users", uid));
//   if (!userSnap.exists()) return null;
//   return userSnap.data()?.username ?? null;
// }

// async function savePersonalInfo(
//   username: string,
//   patch: Partial<Omit<PersonalInfo, "username" | "updatedAt">>
// ) {
//   const ref = doc(db, "personalInfo", username);
//   await setDoc(ref, { ...patch, username, updatedAt: serverTimestamp() }, { merge: true });
// }

// async function queryPermission(name: "geolocation" | "camera"): Promise<PermissionStatus> {
//   try {
//     const permName = name === "camera" ? ("camera" as PermissionName) : ("geolocation" as PermissionName);
//     const result = await navigator.permissions.query({ name: permName });
//     return result.state as PermissionStatus;
//   } catch {
//     return "unknown";
//   }
// }

// export const useSettingsLogic = () => {
//   const { handPreference, setHandPreference } = useUIPreference();
//   const { theme, is3D, setTheme, toggle3D } = useMapPreferenceStore();

//   const setMode = useGridStore((s) => s.setMode);

//   const [mapView, setMapViewLocal] = useState<PersonalInfo["mapView"]>("community");
//   const [showSaved, setShowSaved] = useState(false);
//   const [username, setUsername] = useState<string | null>(null);
//   const [loadingSync, setLoadingSync] = useState(true);
//   const [locationPermission, setLocationPermission] = useState<PermissionStatus>("unknown");
//   const [cameraPermission, setCameraPermission] = useState<PermissionStatus>("unknown");

//   useEffect(() => {
//     const init = async () => {
//       const uid = auth.currentUser?.uid;
//       if (!uid) { setLoadingSync(false); return; }

//       const uname = await fetchUsername(uid);
//       if (!uname) { setLoadingSync(false); return; }
//       setUsername(uname);

//       const [locPerm, camPerm] = await Promise.all([
//         queryPermission("geolocation"),
//         queryPermission("camera"),
//       ]);
//       setLocationPermission(locPerm);
//       setCameraPermission(camPerm);

//       const snap = await getDoc(doc(db, "personalInfo", uname));
//       if (snap.exists()) {
//         const data = snap.data() as PersonalInfo;

//         if (data.mapTheme) setTheme(data.mapTheme);
//         if (data.is3D !== undefined) {
//           const storeIs3D = useMapPreferenceStore.getState().is3D;
//           if (data.is3D !== storeIs3D) toggle3D();
//         }
//         if (data.handPreference) setHandPreference(data.handPreference);
//         if (data.mapView) {
//           setMapViewLocal(data.mapView);
//           setMode(modeMap[data.mapView]);
//         }

//         await savePersonalInfo(uname, { locationPermission: locPerm, cameraPermission: camPerm });
//       } else {
//         await savePersonalInfo(uname, {
//           mapView,
//           mapTheme: theme,
//           is3D,
//           handPreference,
//           locationPermission: locPerm,
//           cameraPermission: camPerm,
//         });
//       }

//       setLoadingSync(false);
//     };

//     init();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const refreshPermissions = async () => {
//     const [locPerm, camPerm] = await Promise.all([
//       queryPermission("geolocation"),
//       queryPermission("camera"),
//     ]);
//     setLocationPermission(locPerm);
//     setCameraPermission(camPerm);
//     if (username) await savePersonalInfo(username, { locationPermission: locPerm, cameraPermission: camPerm });
//   };

//   const triggerToast = () => {
//     setShowSaved(true);
//     setTimeout(() => setShowSaved(false), 2000);
//   };

//   const persist = async (patch: Partial<Omit<PersonalInfo, "username" | "updatedAt">>) => {
//     if (!username) return;
//     try {
//       await savePersonalInfo(username, patch);
//     } catch (err) {
//       console.error("[Settings] Firestore sync failed:", err);
//     }
//   };

//   const setMapView = (view: PersonalInfo["mapView"]) => {
//     setMapViewLocal(view);
//     persist({ mapView: view });
//     setMode(modeMap[view]);
//     triggerToast();
//   };

//   const handleHandChange = (position: HandPreference) => {
//     setHandPreference(position);
//     persist({ handPreference: position });
//     triggerToast();
//   };

//   const handleThemeChange = (newTheme: MapTheme) => {
//     setTheme(newTheme);
//     persist({ mapTheme: newTheme });
//     triggerToast();
//   };

//   // const handleToggle3D = () => {
//   //   toggle3D();
//   //   const nextIs3D = !useMapPreferenceStore.getState().is3D;
//   //   persist({ is3D: nextIs3D });
//   //   triggerToast();
//   // };

//   const handleToggle3D = () => {
//   toggle3D();
//   const nextIs3D = useMapPreferenceStore.getState().is3D; // ← remove the ! 
//   persist({ is3D: nextIs3D });
//   triggerToast();
// };

//   return {
//     hand: handPreference,
//     mapTheme: theme,
//     mapView,
//     setMapView,
//     is3D,
//     showSaved,
//     loadingSync,
//     locationPermission,
//     cameraPermission,
//     refreshPermissions,
//     handleHandChange,
//     handleThemeChange,
//     handleToggle3D,
//   };
// };


import { useState, useEffect } from "react";
import { useUIPreference, HandPreference } from "@/store/User_Ui_Preference";
import { useMapPreferenceStore, MapTheme } from "@/store/Map_preference";
import { useGridStore } from "@/features/frontend/play/GridPlot/Today/GridStore";

import { db, auth } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export type PermissionStatus = "granted" | "denied" | "prompt" | "unknown";

export interface PersonalInfo {
  username: string;
  mapView: "community" | "personal" | "today";
  mapTheme: MapTheme;
  is3D: boolean;
  handPreference: HandPreference;
  locationPermission: PermissionStatus;
  cameraPermission: PermissionStatus;
  updatedAt?: any;
}

const modeMap: Record<PersonalInfo["mapView"], "global" | "history" | "today"> = {
  community: "global",
  personal: "history",
  today: "today",
};

async function fetchUsername(uid: string): Promise<string | null> {
  const userSnap = await getDoc(doc(db, "users", uid));
  if (!userSnap.exists()) return null;
  return userSnap.data()?.username ?? null;
}

async function savePersonalInfo(
  username: string,
  patch: Partial<Omit<PersonalInfo, "username" | "updatedAt">>
) {
  const ref = doc(db, "personalInfo", username);
  await setDoc(ref, { ...patch, username, updatedAt: serverTimestamp() }, { merge: true });
}

async function queryPermission(name: "geolocation" | "camera"): Promise<PermissionStatus> {
  try {
    const permName = name === "camera" ? ("camera" as PermissionName) : ("geolocation" as PermissionName);
    const result = await navigator.permissions.query({ name: permName });
    return result.state as PermissionStatus;
  } catch {
    return "unknown";
  }
}

export const useSettingsLogic = () => {
  const { handPreference, setHandPreference } = useUIPreference();
  const { theme, is3D, setTheme, toggle3D } = useMapPreferenceStore();

  // ── Pull all grid actions from store ─────────────────────────────────────
  const setMode          = useGridStore((s) => s.setMode);
  const loadTodayCells   = useGridStore((s) => s.loadTodayCells);
  const loadHistoryCells = useGridStore((s) => s.loadHistoryCells);
  const loadGlobalCells  = useGridStore((s) => s.loadGlobalCells);

  const [mapView, setMapViewLocal] = useState<PersonalInfo["mapView"]>("community");
  const [showSaved, setShowSaved] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loadingSync, setLoadingSync] = useState(true);
  const [locationPermission, setLocationPermission] = useState<PermissionStatus>("unknown");
  const [cameraPermission, setCameraPermission] = useState<PermissionStatus>("unknown");

  // ── Helper: set mode + load its data together ─────────────────────────────
  const applyMode = (gridMode: "today" | "history" | "global") => {
    setMode(gridMode);
    if (gridMode === "today")   loadTodayCells();
    if (gridMode === "history") loadHistoryCells();
    if (gridMode === "global")  loadGlobalCells();
  };

  useEffect(() => {
    const init = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) { setLoadingSync(false); return; }

      const uname = await fetchUsername(uid);
      if (!uname) { setLoadingSync(false); return; }
      setUsername(uname);

      const [locPerm, camPerm] = await Promise.all([
        queryPermission("geolocation"),
        queryPermission("camera"),
      ]);
      setLocationPermission(locPerm);
      setCameraPermission(camPerm);

      const snap = await getDoc(doc(db, "personalInfo", uname));
      if (snap.exists()) {
        const data = snap.data() as PersonalInfo;

        if (data.mapTheme) setTheme(data.mapTheme);
        if (data.is3D !== undefined) {
          const storeIs3D = useMapPreferenceStore.getState().is3D;
          if (data.is3D !== storeIs3D) toggle3D();
        }
        if (data.handPreference) setHandPreference(data.handPreference);
        if (data.mapView) {
          setMapViewLocal(data.mapView);
          // ✅ applyMode sets mode AND loads gridplot data for that mode
          applyMode(modeMap[data.mapView]);
        }

        await savePersonalInfo(uname, { locationPermission: locPerm, cameraPermission: camPerm });
      } else {
        // New user — default community/global
        applyMode(modeMap[mapView]);
        await savePersonalInfo(uname, {
          mapView,
          mapTheme: theme,
          is3D,
          handPreference,
          locationPermission: locPerm,
          cameraPermission: camPerm,
        });
      }

      setLoadingSync(false);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshPermissions = async () => {
    const [locPerm, camPerm] = await Promise.all([
      queryPermission("geolocation"),
      queryPermission("camera"),
    ]);
    setLocationPermission(locPerm);
    setCameraPermission(camPerm);
    if (username) await savePersonalInfo(username, { locationPermission: locPerm, cameraPermission: camPerm });
  };

  const triggerToast = () => {
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const persist = async (patch: Partial<Omit<PersonalInfo, "username" | "updatedAt">>) => {
    if (!username) return;
    try {
      await savePersonalInfo(username, patch);
    } catch (err) {
      console.error("[Settings] Firestore sync failed:", err);
    }
  };

  const setMapView = (view: PersonalInfo["mapView"]) => {
    setMapViewLocal(view);
    persist({ mapView: view });
    // ✅ applyMode sets mode AND loads gridplot data when user manually switches
    applyMode(modeMap[view]);
    triggerToast();
  };

  const handleHandChange = (position: HandPreference) => {
    setHandPreference(position);
    persist({ handPreference: position });
    triggerToast();
  };

  const handleThemeChange = (newTheme: MapTheme) => {
    setTheme(newTheme);
    persist({ mapTheme: newTheme });
    triggerToast();
  };

  const handleToggle3D = () => {
    toggle3D();
    const nextIs3D = useMapPreferenceStore.getState().is3D;
    persist({ is3D: nextIs3D });
    triggerToast();
  };

  return {
    hand: handPreference,
    mapTheme: theme,
    mapView,
    setMapView,
    is3D,
    showSaved,
    loadingSync,
    locationPermission,
    cameraPermission,
    refreshPermissions,
    handleHandChange,
    handleThemeChange,
    handleToggle3D,
  };
};