// 1. Measures real connection speed across both iOS and Android in the background
export async function measureNetworkSpeed(): Promise<number> {
  const testTargetUrl = "https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"; 
  const fileSizeInBits = 90000 * 8; 
  const startTime = new Date().getTime();

  try {
    await fetch(`${testTargetUrl}?nocache=${startTime}`);
    const endTime = new Date().getTime();
    const durationInSeconds = (endTime - startTime) / 1000;
    const mbps = ((fileSizeInBits / durationInSeconds) / 1024 / 1024);
    return parseFloat(mbps.toFixed(2));
  } catch (error) {
    console.error("Speed metric tracking failed:", error);
    return 0;
  }
}

// 2. Captures local browser network hardware metadata if available
export function getNativeNetworkType(): string {
  if (typeof window !== 'undefined') {
    const nav = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return nav ? (nav.type || "unknown") : "restricted"; 
  }
  return "unknown";
}

// 3. ADD THIS: Fetches ISP (Ncell, NTC, Worldlink) directly from the client side
export async function fetchIspDetails(): Promise<{ isp: string; country: string }> {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    return {
      isp: data.org || "Unknown ISP",
      country: data.country_name || "Unknown"
    };
  } catch (e) {
    return { isp: "Unknown ISP", country: "Unknown" };
  }
}