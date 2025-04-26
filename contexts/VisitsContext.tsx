'use client';

import { createContext, useContext, useState } from 'react';

type VisitsContextType = {
  refreshVisits: () => void;
  refreshKey: number;
};

const VisitsContext = createContext<VisitsContextType>({
  refreshVisits: () => {},
  refreshKey: 0,
});

export function VisitsProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshVisits = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <VisitsContext.Provider value={{ refreshVisits, refreshKey }}>
      {children}
    </VisitsContext.Provider>
  );
}

export const useVisits = () => useContext(VisitsContext); 