import { NextResponse } from 'next/server';
import axios from 'axios';

const MOBILE_CARRIERS = ["ncell", "nepal telecom", "ntc", "smart cell"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, networkDiagnostics } = body;

    // 1. PLACEHOLDER: Put your actual authentication check here
    // e.g., const user = await db.user.findUnique({ where: { email } })
    // If auth fails: return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    // 2. Extract client IP Address from Next.js request headers
    let userIp = request.headers.get('x-forwarded-for') || '127.0.0.1';
    
    // Clean up proxy strings if multiple IPs exist
    if (userIp.includes(',')) {
      userIp = userIp.split(',')[0].trim();
    }
    
    // Localhost fallback for testing (Simulates a Worldlink IP)
    if (userIp === '::1' || userIp === '127.0.0.1') {
      userIp = '27.34.20.18'; 
    }

    // 3. Perform the ISP Lookup
    let ispName = "Unknown ISP";
    let finalConnectionType = networkDiagnostics.nativeType;

    try {
      const ipLookup = await axios.get(`http://ip-api.com/json/${userIp}`);
      if (ipLookup.data && ipLookup.data.status === 'success') {
        ispName = ipLookup.data.isp || "Unknown ISP";
        
        // Smart translation for iOS compatibility
        if (finalConnectionType === "unknown" || finalConnectionType === "restricted") {
          const lowerISP = ispName.toLowerCase();
          const isMobile = MOBILE_CARRIERS.some(carrier => lowerISP.includes(carrier));
          finalConnectionType = isMobile ? "cellular" : "wifi/broadband";
        }
      }
    } catch (ipError) {
      console.error("ISP Lookup failed, falling back to basic data", ipError);
    }

    // 4. Compile the consolidated profile
    const secureLogProfile = {
      email, // Track which user logged in
      ipAddress: userIp,
      isp: ispName,
      connectionType: finalConnectionType,
      speedMbps: networkDiagnostics.calculatedSpeedMbps,
      timestamp: new Date()
    };

    console.log("=== SAVING USER SESSION AND NETWORK TELEMETRY ===");
    console.log(secureLogProfile);
    
    // PLACEHOLDER: Save secureLogProfile to MongoDB/Prisma/PostgreSQL database here

    // 5. Respond back to frontend successfully
    return NextResponse.json({ 
      success: true, 
      message: "Authenticated successfully with network metrics recorded." 
    }, { status: 200 });

  } catch (error) {
    console.error("Auth route error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}