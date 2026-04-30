import { handleMarkerScan, MarkerScanResult } from "./actions/markerAction";
import { handleFinishScan } from "./actions/finishAction";
import { QRcodeMarkerData } from "../Markers/QRcodeMarkers/Logic";

export type QrActionResult =
  | { shouldClose: false }
  | { shouldClose: true; marker?: QRcodeMarkerData };

export const handleQrAction = async (
  data: string,
  userId: string,
  eventId: string
): Promise<QrActionResult> => {
  console.log("🔍 Routing scan data:", data);

  if (data.toLowerCase().includes("ghumanteyuwa.com/finish")) {
    await handleFinishScan(userId, eventId);
    return { shouldClose: true };
  }

  if (data.toLowerCase().includes("ghumanteyuwa.com/")) {
    const result: MarkerScanResult = await handleMarkerScan(data, userId, eventId);
    if (result.success) {
      return { shouldClose: true, marker: result.marker };
    }
    return { shouldClose: false };
  }

  alert("Invalid QR: Not a recognized Ghumante Yuwa link.");
  return { shouldClose: false };
};