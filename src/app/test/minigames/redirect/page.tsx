"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ThankYouPage() {
  const router = useRouter();
  const [buffer, setBuffer] = useState("");
  const [mounted, setMounted] = useState(false);

  const KEYWORD = "demo";
  const REDIRECT_URL = "https://your-demo-link.com"; 

  // 1. Handle Mounting to prevent Hydration Error
  useEffect(() => {
    setMounted(true);
  }, []);

  // 2. Secret Key Listener
  useEffect(() => {
    if (!mounted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.length !== 1) return;
      const char = e.key.toLowerCase();
      const newBuffer = (buffer + char).slice(-KEYWORD.length);
      setBuffer(newBuffer);

      if (newBuffer === KEYWORD) {
        if (REDIRECT_URL.startsWith('http')) {
          window.location.href = REDIRECT_URL;
        } else {
          router.push(REDIRECT_URL);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const timer = setTimeout(() => setBuffer(""), 2000);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [buffer, router, mounted]);

  // Don't render until mounted to ensure server/client match
  if (!mounted) return null;

  return (
    <div className="page-wrapper">
      <style>{`
        .page-wrapper {
          margin: 0;
          padding: 0;
          min-height: 100vh;
          background-color: #ffffff;
          color: #000000;
          font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }
        .container {
          text-align: center;
          padding: 60px 20px;
          max-width: 900px;
          width: 100%;
        }
        .logo {
          width: clamp(150px, 25vw, 250px); 
          margin-bottom: 30px;
        }
        h1 {
          font-size: clamp(2.5rem, 12vw, 6rem);
          font-weight: 900;
          margin: 0;
          letter-spacing: -3px;
          line-height: 0.85;
          text-transform: uppercase;
        }
        .sub-header {
          color: #ff0000; 
          font-size: clamp(1.2rem, 5vw, 2.5rem);
          font-weight: 800;
          margin: 15px 0 40px 0;
          text-transform: uppercase;
          letter-spacing: -1px;
        }
        .stats-box {
          background-color: #000;
          color: #fff;
          padding: 15px 30px;
          display: inline-block;
          margin-bottom: 40px;
          transform: rotate(-1.5deg);
        }
        .stats-box p {
          margin: 0;
          font-weight: 900;
          font-size: clamp(1.2rem, 4vw, 1.8rem);
          text-transform: uppercase;
        }
        .cta-section {
          font-size: 1.25rem;
          line-height: 1.4;
          font-weight: 600;
          color: #000;
          text-transform: uppercase;
        }
        .instagram-link {
          display: inline-block;
          margin-top: 20px;
          font-size: 2rem;
          font-weight: 900;
          color: #000;
          text-decoration: none;
          border-bottom: 8px solid #ff0000;
          transition: 0.2s ease;
        }
        .instagram-link:hover {
          background-color: #ff0000;
          color: #fff;
        }
        hr {
          border: 0;
          border-top: 4px solid #000;
          width: 80px;
          margin: 60px auto 30px auto;
        }
        .made-by {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          margin-top: 20px;
        }
        .la-logo {
          width: 80px;
          height: auto;
        }
        .la-text {
          font-weight: 900;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #000;
        }
        @media (max-width: 480px) {
          h1 { letter-spacing: -1px; }
          .stats-box { transform: rotate(0); width: 85%; }
          .instagram-link { font-size: 1.5rem; }
        }
      `}</style>

      <div className="container">
        <img src="/logo.png" alt="Ghumante Yuwa" className="logo" />

        <h1>THANK YOU<br />FOR PLAYING!</h1>
        <div className="sub-header">BASANTAPUR WAS EPIC.</div>

        <div className="stats-box">
          <p>100+ PRIZES EARNED</p>
        </div>

        <div className="cta-section">
          <p>WE’LL BRING MORE STUFF LIKE THAT.<br />OK COOL?</p>
          <p style={{ marginTop: "30px", fontWeight: "400", textTransform: "none" }}>
            Leave us suggestions on a new location by messaging us!
          </p>
          <a href="https://instagram.com/ghumanteyuwa" target="_blank" className="instagram-link">
            @GHUMANTEYUWA
          </a>
        </div>

        <hr />

        <div className="made-by">
          <span className="la-text">MADE BY</span>
          <a href="https://lagarau.com" target="_blank">
            <img src="/lalogo.jpg" alt="La Garau" className="la-logo" />
          </a>
        </div>
      </div>
    </div>
  );
}