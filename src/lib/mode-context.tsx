"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type PresentationMode = "simple" | "pro";

interface ModeContextValue {
  mode: PresentationMode;
  setMode: (mode: PresentationMode) => void;
}

const ModeContext = createContext<ModeContextValue>({ mode: "simple", setMode: () => {} });

const STORAGE_KEY = "pda_presentation_mode";

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<PresentationMode>("simple");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "simple" || stored === "pro") setModeState(stored);
  }, []);

  const setMode = (next: PresentationMode) => {
    setModeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  return <ModeContext.Provider value={{ mode, setMode }}>{children}</ModeContext.Provider>;
}

export function useMode(): ModeContextValue {
  return useContext(ModeContext);
}
