import React, { createContext, useState, useEffect } from "react";

const SiteIdContext = createContext();

export const SiteIdProvider = ({ children }) => {
  const [siteId, setSiteId] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cragmark_site_id");
    if (stored) {
      setSiteId(stored);
    }
    setIsLoaded(true);
  }, []);

  const setSiteIdValue = (id) => {
    setSiteId(id);
    localStorage.setItem("cragmark_site_id", id);
  };

  const clearSiteId = () => {
    setSiteId(null);
    localStorage.removeItem("cragmark_site_id");
  };

  return (
    <SiteIdContext.Provider value={{ siteId, setSiteId: setSiteIdValue, clearSiteId, isLoaded }}>
      {children}
    </SiteIdContext.Provider>
  );
};

export const useSiteId = () => {
  const context = React.useContext(SiteIdContext);
  if (!context) {
    throw new Error("useSiteId must be used within SiteIdProvider");
  }
  return context;
};
