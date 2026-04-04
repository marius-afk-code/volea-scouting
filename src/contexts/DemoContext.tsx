'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const DEMO_KEY = 'volea_demo';

interface DemoContextValue {
  isDemo: boolean;
  activateDemo: () => void;
  exitDemo: () => void;
}

const DemoContext = createContext<DemoContextValue>({
  isDemo: false,
  activateDemo: () => {},
  exitDemo: () => {},
});

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isDemo, setIsDemo] = useState(false);

  // Read from sessionStorage after mount (client-only)
  useEffect(() => {
    setIsDemo(sessionStorage.getItem(DEMO_KEY) === '1');
  }, []);

  function activateDemo() {
    sessionStorage.setItem(DEMO_KEY, '1');
    setIsDemo(true);
  }

  function exitDemo() {
    sessionStorage.removeItem(DEMO_KEY);
    setIsDemo(false);
  }

  return (
    <DemoContext.Provider value={{ isDemo, activateDemo, exitDemo }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  return useContext(DemoContext);
}
