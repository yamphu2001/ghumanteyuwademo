"use client";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .page {
          min-height: 100vh;
          min-height: 100dvh;
          background: #fff;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 60px 32px 40px;
          max-width: 420px;
          margin: 0 auto;
        }

        .top {
          text-align: center;
        }

        .collab {
          font-size: 0.72rem;
          color: #aaa;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
        }

        .title {
          font-size: 2rem;
          font-weight: 600;
          color: #111;
          line-height: 1.15;
        }

        .mascot {
          width: 180px;
          height: auto;
        }

        .bottom {
          width: 100%;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .tagline {
          font-size: 0.9rem;
          color: #888;
          font-weight: 300;
        }

        .btn {
          width: 100%;
          padding: 18px;
          background: #E63946;
          color: #fff;
          border: none;
          border-radius: 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
        }

        .btn:hover { opacity: 0.88; }

        .byline {
          font-size: 0.65rem;
          color: #ccc;
          letter-spacing: 0.08em;
        }
      `}</style>

      <div className="page">
        <div className="top">
          <p className="collab">Ghumante Yuwa × Hanuman Dhoka Museum</p>
          <h1 className="title">Making museums<br />fun to explore.</h1>
        </div>

        <img className="mascot" src="/play/PlayerMarker/Mascot.png" alt="Mascot" />

        <div className="bottom">
          <p className="tagline">Scan. Explore. Collect rewards.</p>
          <button className="btn" onClick={() => router.push("../../test/museum/map")}>
            Play Demo
          </button>
          <p className="byline">by La Garau</p>
        </div>
      </div>
    </>
  );
}