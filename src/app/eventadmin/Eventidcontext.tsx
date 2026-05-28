"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface EventIdContextType {
  eventId: string;
  setEventId: (id: string) => void;
}

const EventIdContext = createContext<EventIdContextType>({
  eventId: "",
  setEventId: () => {},
});

export function EventIdProvider({ children }: { children: ReactNode }) {
  const [eventId, setEventId] = useState("");
  return (
    <EventIdContext.Provider value={{ eventId, setEventId }}>
      {children}
    </EventIdContext.Provider>
  );
}

// ✅ Use this hook in every admin page instead of local state
export function useEventId() {
  return useContext(EventIdContext);
}