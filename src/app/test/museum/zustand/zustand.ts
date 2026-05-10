import { create } from "zustand";

export type DeviceType = "mobile" | "desktop";

interface DeviceState {
  deviceType: DeviceType;
  isMobile: boolean;
  detect: () => void;
}

const MOBILE_BREAKPOINT = 768;

const detectDevice = (): DeviceType => {
  if (typeof window === "undefined") return "desktop";
  const isNarrowScreen = window.innerWidth < MOBILE_BREAKPOINT;
  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const hasMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return isNarrowScreen || (isTouchDevice && hasMobileUA) ? "mobile" : "desktop";
};

export const useDeviceStore = create<DeviceState>((set) => ({
  deviceType: "desktop",
  isMobile: false,
  detect: () => {
    const deviceType = detectDevice();
    set({ deviceType, isMobile: deviceType === "mobile" });
  },
}));