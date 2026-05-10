"use client";
import React, { useState } from 'react';
import { requestPermissions } from "@/lib/permissions";

export default function PermissionTestPage() {
  const [status, setStatus] = useState<string>("Waiting for user action...");

  const testLocation = async () => {
    setStatus("Requesting Location...");
    const res: any = await requestPermissions.location();
    if (res.success) {
      setStatus(`Location Success! Lat: ${res.coords.latitude}`);
    } else {
      setStatus(`Location Failed: ${res.error}`);
    }
  };

  const testCamera = async () => {
    setStatus("Requesting Camera...");
    const res = await requestPermissions.camera();
    if (res.success) {
      setStatus("Camera Success! Permission granted.");
    } else {
      setStatus(`Camera Failed: ${res.error}`);
    }
  };

  return (
    <div className="p-10 font-sans">
      <h1 className="text-2xl font-bold mb-4">Permission Tester</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-6 border border-gray-300">
        <strong>Status:</strong> <span className="text-blue-600">{status}</span>
      </div>

      <div className="flex gap-4">
        <button 
          onClick={testLocation}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          Test Location
        </button>

        <button 
          onClick={testCamera}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Test Camera
        </button>
      </div>

      <p className="mt-6 text-sm text-gray-500">
        Note: Open your browser Console (F12) to see detailed logs if nothing happens.
      </p>
    </div>
  );
}