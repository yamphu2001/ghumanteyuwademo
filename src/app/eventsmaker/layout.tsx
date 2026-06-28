"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function EventsmakerLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
      } else {
        setAuthChecked(true);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-white">
        <div className="flex flex-col items-center gap-3 text-black">
          <div className="w-12 h-12 border-4 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold uppercase tracking-[0.25em]">Checking login status...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
